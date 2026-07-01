import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { loadOriginalBytes } from './lib/hf.mjs';
import {
  argmax,
  createGemmaSession,
  GEMMA_DECODER_DATA,
  GEMMA_DECODER_ONNX,
  GEMMA_EMBED_DATA,
  GEMMA_EMBED_ONNX,
  GEMMA_MODEL_ID,
  gemmaLogitsLastPosition,
  gemmaPresentNames,
  loadGemmaTokenizer,
  makeGemmaDecodeFeeds,
  makeGemmaDecoderFeeds,
  makeGemmaEmbedFeeds,
  tokenizeGemmaChat,
} from './lib/gemma.mjs';
import { decodeModel, encodeModel, insertActivationAblation, loadOnnxTypes } from './lib/onnx.mjs';
import { HAZARD_PROMPT, contentDebug, isRefusal, redactRepetitionDebug, repetitionDebug, semiRedactHazardText } from './lib/text.mjs';

const ARTIFACT_DIR = '/tmp/opencode/ablation-v2/artifacts';
const mode = 'thinking';
const maxNewTokens = Number(process.env.MAX_NEW_TOKENS || 2000);
const gemmaConfigNames = (process.env.GEMMA_CONFIGS || process.env.GEMMA_CONFIG || 'L24_a6')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const multiConfig = gemmaConfigNames.length > 1;
const executionProvider = process.env.ORT_EP || 'cuda';
const prompt = process.env.HAZARD_PROMPT || HAZARD_PROMPT;
const progressEvery = Number(process.env.PROGRESS_EVERY || 100);
const qualityCheckEvery = Number(process.env.QUALITY_CHECK_EVERY || 0);
const earlyStopOnFailure = process.env.EARLY_STOP_ON_FAILURE === '1';
const dropGqaAttentionBias = process.env.DROP_GQA_ATTENTION_BIAS === '1';
const saveRedactedOutputDir = process.env.SAVE_REDACTED_OUTPUT_DIR?.trim();
const redactedOutputMaxChars = Number(process.env.REDACTED_OUTPUT_MAX_CHARS || 12000);
const outPath = process.env.OUT_PATH || (multiConfig
  ? `${ARTIFACT_DIR}/gemma-thinking-long-check-${gemmaConfigNames.join('_')}-t${maxNewTokens}.json`
  : `${ARTIFACT_DIR}/gemma-thinking-${gemmaConfigNames[0]}-long-check-t${maxNewTokens}.json`);

function parseAlpha(value) {
  const parsed = Number(String(value).replace(/p/g, '.'));
  if (!Number.isFinite(parsed)) throw new Error(`Invalid alpha: ${value}`);
  return parsed;
}

function selectConfig(modeData, name) {
  const topMatch = name.match(/^top(\d+)_a([0-9p.]+)$/);
  if (topMatch) {
    const topK = Number(topMatch[1]);
    const alpha = parseAlpha(topMatch[2]);
    const records = modeData.records.slice(0, topK);
    if (records.length !== topK) throw new Error(`Config ${name} requested top ${topK}, found ${records.length}`);
    return { name, targets: records.map((r) => ({ r, alpha })) };
  }

  const layerMatch = name.match(/^L(\d+)_a([0-9p.]+)$/);
  if (layerMatch) {
    const layer = Number(layerMatch[1]);
    const alpha = parseAlpha(layerMatch[2]);
    const r = modeData.records.find((record) => record.layer === layer);
    if (!r) throw new Error(`Config ${name} requested missing layer ${layer}`);
    return { name, targets: [{ r, alpha }] };
  }

  throw new Error(`Unsupported GEMMA_CONFIG=${name}`);
}

function dropUnsupportedGqaAttentionBias(graph) {
  let patched = 0;
  for (const node of graph.node) {
    if (node.op_type !== 'GroupQueryAttention') continue;
    if (node.domain !== 'com.microsoft') continue;
    if (node.input.length > 10 && node.input[10]) {
      node.input[10] = '';
      patched++;
    }
  }
  return patched;
}

async function generateWithStats(embedSession, decoderSession, tokenizer, configName) {
  const promptIds = await tokenizeGemmaChat(tokenizer, prompt, { thinking: true });
  const presentNames = gemmaPresentNames();
  const promptEmbeds = await embedSession.run(makeGemmaEmbedFeeds(promptIds), ['inputs_embeds', 'per_layer_inputs']);
  let out = await decoderSession.run(makeGemmaDecoderFeeds({ inputIds: promptIds, embedOutputs: promptEmbeds }), ['logits', ...presentNames]);
  let next = argmax(gemmaLogitsLastPosition(out.logits));
  const generated = [];
  const eosIds = new Set([1, 106]);
  let stoppedByEos = false;
  let stoppedByQuality = false;
  let qualityStopReason = null;
  let lastQuality = null;

  for (let step = 0; step < maxNewTokens; step++) {
    if (eosIds.has(next)) {
      stoppedByEos = true;
      break;
    }
    generated.push(next);
    if (progressEvery > 0 && generated.length % progressEvery === 0) {
      console.log(`[long-check] ${configName} generated_tokens=${generated.length}/${maxNewTokens}`);
    }
    if (qualityCheckEvery > 0 && generated.length % qualityCheckEvery === 0) {
      const partialText = tokenizer.decode(generated, { skip_special_tokens: true });
      const partialRepetition = repetitionDebug(partialText);
      const partialContent = contentDebug(partialText);
      lastQuality = {
        generatedTokens: generated.length,
        chars: partialText.length,
        refusal: isRefusal(partialText),
        loop: partialRepetition.loop,
        contentOk: partialContent.ok,
        repetition: redactRepetitionDebug(partialRepetition),
        content: partialContent,
      };
      console.log(`[long-check] ${configName} quality=${JSON.stringify({ generatedTokens: lastQuality.generatedTokens, refusal: lastQuality.refusal, loop: lastQuality.loop, contentOk: lastQuality.contentOk })}`);
      if (earlyStopOnFailure && (lastQuality.refusal || lastQuality.loop || !lastQuality.contentOk)) {
        stoppedByQuality = true;
        qualityStopReason = lastQuality.refusal ? 'refusal' : lastQuality.loop ? 'loop' : 'low-content';
        break;
      }
    }
    const totalSeqLen = promptIds.length + generated.length;
    const tokenEmbeds = await embedSession.run(makeGemmaEmbedFeeds([next]), ['inputs_embeds', 'per_layer_inputs']);
    out = await decoderSession.run(
      makeGemmaDecodeFeeds({ tokenId: next, embedOutputs: tokenEmbeds, past: out, totalSeqLen }),
      ['logits', ...presentNames],
    );
    next = argmax(gemmaLogitsLastPosition(out.logits));
  }

  const text = tokenizer.decode(generated, { skip_special_tokens: true });
  const repetition = repetitionDebug(text);
  const content = contentDebug(text);
  return {
    redactedText: saveRedactedOutputDir ? semiRedactHazardText(text, { maxChars: redactedOutputMaxChars }) : null,
    promptTokens: promptIds.length,
    generatedTokens: generated.length,
    stoppedByEos,
    stoppedByQuality,
    qualityStopReason,
    hitMaxNewTokens: generated.length >= maxNewTokens && !stoppedByEos,
    chars: text.length,
    refusal: isRefusal(text),
    loop: repetition.loop,
    contentOk: content.ok,
    lastQuality,
    repetition: redactRepetitionDebug(repetition),
    content,
  };
}

await mkdir(ARTIFACT_DIR, { recursive: true });
console.log(`[long-check] mode=${mode} configs=${gemmaConfigNames.join(',')} maxNewTokens=${maxNewTokens} ep=${executionProvider}`);
console.log(`[long-check] progressEvery=${progressEvery} qualityCheckEvery=${qualityCheckEvery} earlyStopOnFailure=${earlyStopOnFailure}`);
console.log(`[long-check] dropGqaAttentionBias=${dropGqaAttentionBias}`);
if (saveRedactedOutputDir) console.log(`[long-check] saveRedactedOutputDir=${saveRedactedOutputDir} maxChars=${redactedOutputMaxChars}`);

const [embed, decoder, types, tokenizer] = await Promise.all([
  loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_EMBED_ONNX, dataPaths: GEMMA_EMBED_DATA }),
  loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_DECODER_ONNX, dataPaths: GEMMA_DECODER_DATA }),
  loadOnnxTypes(),
  loadGemmaTokenizer(),
]);

const modeData = JSON.parse(await readFile(`${ARTIFACT_DIR}/gemma-directions-${mode}.json`, 'utf8'));
const embedSession = await createGemmaSession(embed.onnxBytes, embed.externalData, { executionProviders: [executionProvider] });
const startedAt = new Date().toISOString();
const rows = [];
try {
  for (const configName of gemmaConfigNames) {
    const config = selectConfig(modeData, configName);
    const model = decodeModel(types, decoder.onnxBytes);
    const droppedGqaAttentionBias = dropGqaAttentionBias ? dropUnsupportedGqaAttentionBias(model.graph) : 0;
    if (droppedGqaAttentionBias) console.log(`[long-check] ${config.name} dropped_gqa_attention_bias=${droppedGqaAttentionBias}`);
    for (let i = 0; i < config.targets.length; i++) {
      const { r, alpha } = config.targets[i];
      insertActivationAblation(types, model.graph, {
        targetTensor: r.output,
        direction: Float32Array.from(r.direction),
        alpha,
        tag: `long_check_gemma_${mode}_${config.name}_${i}`.replace(/[^a-zA-Z0-9_]/g, '_'),
      });
    }

    const decoderSession = await createGemmaSession(encodeModel(types, model), decoder.externalData, { executionProviders: [executionProvider] });
    const t0 = Date.now();
    try {
      const result = await generateWithStats(embedSession, decoderSession, tokenizer, config.name);
      const { redactedText, ...stats } = result;
      const row = {
        seconds: Number(((Date.now() - t0) / 1000).toFixed(1)),
        config: config.name,
        droppedGqaAttentionBias,
        targets: config.targets.map(({ r, alpha }) => ({ layer: r.layer, output: r.output, alpha })),
        ...stats,
      };
      rows.push(row);
      if (saveRedactedOutputDir && redactedText !== null) {
        await mkdir(saveRedactedOutputDir, { recursive: true });
        const redactedPath = `${saveRedactedOutputDir}/gemma-thinking-${config.name}-t${maxNewTokens}-redacted.txt`;
        await writeFile(redactedPath, [
          `model=gemma`,
          `mode=thinking`,
          `config=${config.name}`,
          `execution_provider=${executionProvider}`,
          `drop_gqa_attention_bias=${dropGqaAttentionBias}`,
          `max_new_tokens=${maxNewTokens}`,
          `generated_tokens=${row.generatedTokens}`,
          `stopped_by_eos=${row.stoppedByEos}`,
          `refusal=${row.refusal}`,
          `loop=${row.loop}`,
          `content_ok=${row.contentOk}`,
          `note=semi-redacted; hazardous/actionable details and reasoning specifics masked`,
          '',
          redactedText,
          '',
        ].join('\n'), 'utf8');
        row.redactedOutputPath = redactedPath;
        console.log(`[long-check] ${config.name} wrote redacted output ${redactedPath}`);
      }
      console.log(`[long-check] ${config.name} summary=${JSON.stringify({ generatedTokens: row.generatedTokens, stoppedByEos: row.stoppedByEos, hitMaxNewTokens: row.hitMaxNewTokens, refusal: row.refusal, loop: row.loop, contentOk: row.contentOk, seconds: row.seconds })}`);
    } finally {
      await decoderSession.release();
    }
  }

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    seconds: Number(rows.reduce((sum, row) => sum + row.seconds, 0).toFixed(1)),
    model: 'gemma',
    mode,
    configs: gemmaConfigNames,
    executionProvider,
    maxNewTokens,
    progressEvery,
    qualityCheckEvery,
    earlyStopOnFailure,
    dropGqaAttentionBias,
    prompt: prompt === HAZARD_PROMPT ? 'HAZARD_PROMPT' : '[custom hazardous prompt omitted]',
    rows,
  };
  if (!multiConfig) Object.assign(summary, rows[0]);
  await writeFile(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`[long-check] wrote ${outPath}`);
} finally {
  await embedSession.release();
}
