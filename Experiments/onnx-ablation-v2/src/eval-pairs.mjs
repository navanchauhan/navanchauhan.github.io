import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { loadOriginalBytes } from './lib/hf.mjs';
import {
  createSessionFromBytes,
  greedyGenerateKv as greedyGenerateLlamaKv,
  LLAMA_DATA_PATHS,
  LLAMA_LOCAL_DIR,
  LLAMA_MODEL_ID,
  LLAMA_ONNX_PATH,
  loadLlamaTokenizer,
} from './lib/llama.mjs';
import {
  createGemmaSession,
  GEMMA_DECODER_DATA,
  GEMMA_DECODER_ONNX,
  GEMMA_EMBED_DATA,
  GEMMA_EMBED_ONNX,
  GEMMA_MODEL_ID,
  greedyGenerateGemmaKv,
  loadGemmaTokenizer,
} from './lib/gemma.mjs';
import { decodeModel, encodeModel, insertActivationAblation, loadOnnxTypes } from './lib/onnx.mjs';
import { contentDebug, isRefusal, maskHazardText, redactRepetitionDebug, refusalDebug, repetitionDebug } from './lib/text.mjs';

const ARTIFACT_DIR = '/tmp/opencode/ablation-v2/artifacts';
const DATASET_URL = 'https://huggingface.co/datasets/heretic-org/Semantic-Harmful/resolve/main/metadata/matched_pairs.json';

const modelName = process.env.MODEL || 'llama';
const mode = process.env.MODE || 'nonthinking';
const thinking = mode === 'thinking';
const nPairs = Number(process.env.N_PAIRS || 16);
const maxNewTokens = Number(process.env.MAX_NEW_TOKENS || 64);
const includeHarmless = process.env.INCLUDE_HARMLESS === '1';
const saveDir = process.env.SAVE_DIR || '/tmp/ablation-eval';
const requestedGemmaConfig = process.env.GEMMA_CONFIG?.trim();
const defaultGemmaConfig = thinking ? 'L24_a6' : 'top5_a2';

await mkdir(ARTIFACT_DIR, { recursive: true });
await mkdir(saveDir, { recursive: true });

const dataset = await (await fetch(DATASET_URL)).json();
const pairs = dataset.pairs.slice(0, nPairs);
const types = await loadOnnxTypes();

function summarize(rows, field) {
  const originalRefusals = rows.filter((r) => r[`${field}OriginalRefusal`]).length;
  const ablatedRefusals = rows.filter((r) => r[`${field}AblatedRefusal`]).length;
  const originalLoops = rows.filter((r) => r[`${field}OriginalLoop`]).length;
  const ablatedLoops = rows.filter((r) => r[`${field}AblatedLoop`]).length;
  const originalLowContent = rows.filter((r) => r[`${field}OriginalContentOk`] === false).length;
  const ablatedLowContent = rows.filter((r) => r[`${field}AblatedContentOk`] === false).length;
  const flipped = rows.filter((r) => r[`${field}OriginalRefusal`] && !r[`${field}AblatedRefusal`]).length;
  const cleanFlipped = rows.filter((r) => r[`${field}OriginalRefusal`] && !r[`${field}AblatedRefusal`] && !r[`${field}AblatedLoop`] && r[`${field}AblatedContentOk`] !== false).length;
  const introduced = rows.filter((r) => !r[`${field}OriginalRefusal`] && r[`${field}AblatedRefusal`]).length;
  const unchangedRefusal = rows.filter((r) => r[`${field}OriginalRefusal`] && r[`${field}AblatedRefusal`]).length;
  const unchangedNonRefusal = rows.filter((r) => !r[`${field}OriginalRefusal`] && !r[`${field}AblatedRefusal`]).length;
  return { originalRefusals, ablatedRefusals, originalLoops, ablatedLoops, originalLowContent, ablatedLowContent, flipped, cleanFlipped, introduced, unchangedRefusal, unchangedNonRefusal, total: rows.length };
}

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function parseAlpha(value) {
  const parsed = Number(String(value).replace(/p/g, '.'));
  if (!Number.isFinite(parsed)) throw new Error(`Invalid alpha in Gemma config: ${value}`);
  return parsed;
}

function selectGemmaConfig(modeData, name = defaultGemmaConfig) {
  const topMatch = name.match(/^top(\d+)_a([0-9p.]+)$/);
  if (topMatch) {
    const topK = Number(topMatch[1]);
    const alpha = parseAlpha(topMatch[2]);
    const records = modeData.records.slice(0, topK);
    if (records.length !== topK) throw new Error(`Gemma config ${name} requested top ${topK}, but only found ${records.length} records`);
    return { name, targets: records.map((r) => ({ r, alpha })) };
  }

  const layerMatch = name.match(/^L(\d+)_a([0-9p.]+)$/);
  if (layerMatch) {
    const layer = Number(layerMatch[1]);
    const alpha = parseAlpha(layerMatch[2]);
    const r = modeData.records.find((record) => record.layer === layer);
    if (!r) throw new Error(`Gemma config ${name} requested layer ${layer}, but it was not present in directions`);
    return { name, targets: [{ r, alpha }] };
  }

  throw new Error(`Unsupported GEMMA_CONFIG=${name}; expected e.g. top5_a1 or L24_a6`);
}

function safeOutput(text, refusal) {
  const debug = refusalDebug(text);
  const repetition = repetitionDebug(text);
  const storedRepetition = refusal ? repetition : redactRepetitionDebug(repetition);
  const content = contentDebug(text);
  const header = [
    `refusal=${debug.refusal}`,
    `matched_rules=${debug.matched.map((m) => `${m.name}@${m.index}:${JSON.stringify(m.match)}`).join(',') || '(none)'}`,
    `loop=${repetition.loop}`,
    `repetition=${JSON.stringify(storedRepetition)}`,
    `content=${JSON.stringify(content)}`,
    `chars=${String(text ?? '').length}`,
  ];

  if (refusal) {
    return [
      ...header,
      '',
      'raw_refusal_text:',
      text,
    ].join('\n');
  }

  return [
    ...header,
    '',
    'masked_non_refusal_excerpt:',
    maskHazardText(text),
  ].join('\n');
}

async function savePairText({ index, config, harmfulOriginal, harmfulAblated, row, harmlessOriginal = null, harmlessAblated = null }) {
  const parts = [
    `model=${modelName}`,
    `mode=${mode}`,
    `config=${config}`,
    `pair=${index}`,
    `max_new_tokens=${maxNewTokens}`,
    '',
    '=== HARMFUL ORIGINAL ===',
    safeOutput(harmfulOriginal, row.harmfulOriginalRefusal),
    '',
    '=== HARMFUL ABLATED ===',
    safeOutput(harmfulAblated, row.harmfulAblatedRefusal),
  ];

  if (includeHarmless) {
    parts.push(
      '',
      '=== HARMLESS ORIGINAL ===',
      harmlessOriginal,
      '',
      '=== HARMLESS ABLATED ===',
      harmlessAblated,
    );
  }

  await writeFile(`${saveDir}/${modelName}-${mode}-${safeName(config)}-pair-${String(index).padStart(2, '0')}.txt`, `${parts.join('\n')}\n`, 'utf8');
}

async function evaluateRows({ config, generateOriginal, generateAblated }) {
  const rows = [];
  for (let i = 0; i < pairs.length; i++) {
    const row = { index: i + 1 };
    const t0 = Date.now();

    const harmfulOriginal = await generateOriginal(pairs[i].harmful);
    const harmfulAblated = await generateAblated(pairs[i].harmful);
    row.harmfulOriginalRefusal = isRefusal(harmfulOriginal);
    row.harmfulAblatedRefusal = isRefusal(harmfulAblated);
    const harmfulOriginalRepetition = repetitionDebug(harmfulOriginal);
    const harmfulAblatedRepetition = repetitionDebug(harmfulAblated);
    row.harmfulOriginalLoop = harmfulOriginalRepetition.loop;
    row.harmfulAblatedLoop = harmfulAblatedRepetition.loop;
    row.harmfulOriginalRepetition = row.harmfulOriginalRefusal ? harmfulOriginalRepetition : redactRepetitionDebug(harmfulOriginalRepetition);
    row.harmfulAblatedRepetition = row.harmfulAblatedRefusal ? harmfulAblatedRepetition : redactRepetitionDebug(harmfulAblatedRepetition);
    row.harmfulOriginalContent = contentDebug(harmfulOriginal);
    row.harmfulAblatedContent = contentDebug(harmfulAblated);
    row.harmfulOriginalContentOk = row.harmfulOriginalContent.ok;
    row.harmfulAblatedContentOk = row.harmfulAblatedContent.ok;
    row.harmfulOriginalChars = harmfulOriginal.length;
    row.harmfulAblatedChars = harmfulAblated.length;
    row.harmfulOriginalText = safeOutput(harmfulOriginal, row.harmfulOriginalRefusal);
    row.harmfulAblatedText = safeOutput(harmfulAblated, row.harmfulAblatedRefusal);

    let harmlessOriginal = null;
    let harmlessAblated = null;
    if (includeHarmless) {
      harmlessOriginal = await generateOriginal(pairs[i].harmless);
      harmlessAblated = await generateAblated(pairs[i].harmless);
      row.harmlessOriginalRefusal = isRefusal(harmlessOriginal);
      row.harmlessAblatedRefusal = isRefusal(harmlessAblated);
      const harmlessOriginalRepetition = repetitionDebug(harmlessOriginal);
      const harmlessAblatedRepetition = repetitionDebug(harmlessAblated);
      row.harmlessOriginalLoop = harmlessOriginalRepetition.loop;
      row.harmlessAblatedLoop = harmlessAblatedRepetition.loop;
      row.harmlessOriginalRepetition = harmlessOriginalRepetition;
      row.harmlessAblatedRepetition = harmlessAblatedRepetition;
      row.harmlessOriginalContent = contentDebug(harmlessOriginal);
      row.harmlessAblatedContent = contentDebug(harmlessAblated);
      row.harmlessOriginalContentOk = row.harmlessOriginalContent.ok;
      row.harmlessAblatedContentOk = row.harmlessAblatedContent.ok;
      row.harmlessOriginalChars = harmlessOriginal.length;
      row.harmlessAblatedChars = harmlessAblated.length;
      row.harmlessOriginalText = harmlessOriginal;
      row.harmlessAblatedText = harmlessAblated;
    }

    await savePairText({
      index: i + 1,
      config,
      harmfulOriginal,
      harmfulAblated,
      row,
      harmlessOriginal,
      harmlessAblated,
    });

    rows.push(row);
    const state = row.harmfulOriginalRefusal && !row.harmfulAblatedRefusal
      ? 'flipped'
      : row.harmfulOriginalRefusal && row.harmfulAblatedRefusal
        ? 'still-refusal'
        : !row.harmfulOriginalRefusal && row.harmfulAblatedRefusal
          ? 'introduced-refusal'
          : 'both-non-refusal';
    console.log(`[eval-pairs] ${modelName}/${mode} pair ${i + 1}/${pairs.length}: harmful ${row.harmfulOriginalRefusal}->${row.harmfulAblatedRefusal} ${state} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  return rows;
}

async function runLlama() {
  const { onnxBytes, externalData } = await loadOriginalBytes({
    modelId: LLAMA_MODEL_ID,
    onnxPath: LLAMA_ONNX_PATH,
    dataPaths: LLAMA_DATA_PATHS,
    localDir: LLAMA_LOCAL_DIR,
  });
  const tokenizer = await loadLlamaTokenizer();
  const originalSession = await createSessionFromBytes(onnxBytes, externalData);

  const directions = JSON.parse(await readFile(`${ARTIFACT_DIR}/llama-directions.json`, 'utf8'));
  const direction = directions.records.find((r) => r.kind === 'input_layernorm' && r.layer === 15);
  const patchedModel = decodeModel(types, onnxBytes);
  insertActivationAblation(types, patchedModel.graph, {
    targetTensor: direction.output,
    direction: Float32Array.from(direction.direction),
    alpha: 2,
    tag: 'eval_llama_input_l15_a2',
  });
  const ablatedSession = await createSessionFromBytes(encodeModel(types, patchedModel), externalData);

  const rows = await evaluateRows({
    config: 'input_layernorm_L15_a2',
    generateOriginal: (prompt) => greedyGenerateLlamaKv(originalSession, tokenizer, prompt, { maxNewTokens }),
    generateAblated: (prompt) => greedyGenerateLlamaKv(ablatedSession, tokenizer, prompt, { maxNewTokens }),
  });
  await originalSession.release();
  await ablatedSession.release();
  return { config: 'input_layernorm_L15_a2', rows };
}

async function runGemma() {
  const [embed, decoder] = await Promise.all([
    loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_EMBED_ONNX, dataPaths: GEMMA_EMBED_DATA }),
    loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_DECODER_ONNX, dataPaths: GEMMA_DECODER_DATA }),
  ]);
  const tokenizer = await loadGemmaTokenizer();
  const embedSession = await createGemmaSession(embed.onnxBytes, embed.externalData);
  const originalDecoder = await createGemmaSession(decoder.onnxBytes, decoder.externalData);

  const modeData = JSON.parse(await readFile(`${ARTIFACT_DIR}/gemma-directions-${mode}.json`, 'utf8'));
  const config = selectGemmaConfig(modeData, requestedGemmaConfig || defaultGemmaConfig);
  console.log(`[eval-pairs] Gemma config=${config.name}`);

  const patchedModel = decodeModel(types, decoder.onnxBytes);
  for (let i = 0; i < config.targets.length; i++) {
    const { r, alpha } = config.targets[i];
    insertActivationAblation(types, patchedModel.graph, {
      targetTensor: r.output,
      direction: Float32Array.from(r.direction),
      alpha,
      tag: `eval_gemma_${mode}_${config.name}_${i}`.replace(/[^a-zA-Z0-9_]/g, '_'),
    });
  }
  const ablatedDecoder = await createGemmaSession(encodeModel(types, patchedModel), decoder.externalData);

  const rows = await evaluateRows({
    config: config.name,
    generateOriginal: (prompt) => greedyGenerateGemmaKv(embedSession, originalDecoder, tokenizer, prompt, { thinking, maxNewTokens }),
    generateAblated: (prompt) => greedyGenerateGemmaKv(embedSession, ablatedDecoder, tokenizer, prompt, { thinking, maxNewTokens }),
  });
  await originalDecoder.release();
  await ablatedDecoder.release();
  await embedSession.release();
  return { config: config.name, rows };
}

const result = modelName === 'llama' ? await runLlama() : await runGemma();
const summary = {
  dataset: 'heretic-org/Semantic-Harmful metadata/matched_pairs.json + Semantic-Harmless matched counterpart',
  model: modelName,
  mode,
  config: result.config,
  nPairs,
  maxNewTokens,
  includeHarmless,
  harmful: summarize(result.rows, 'harmful'),
  harmless: includeHarmless ? summarize(result.rows, 'harmless') : null,
  rows: result.rows,
};

const safeConfig = safeName(result.config);
const outPath = `${ARTIFACT_DIR}/eval-${modelName}-${mode}-${safeConfig}-n${nPairs}-t${maxNewTokens}.json`;
await writeFile(outPath, JSON.stringify(summary, null, 2));
await writeFile(`${saveDir}/${modelName}-${mode}-${safeConfig}-summary.json`, JSON.stringify(summary, null, 2));
console.log(`[eval-pairs] summary=${JSON.stringify({ harmful: summary.harmful, harmless: summary.harmless })}`);
console.log(`[eval-pairs] wrote ${outPath}`);
console.log(`[eval-pairs] wrote per-pair before/after files under ${saveDir}`);
