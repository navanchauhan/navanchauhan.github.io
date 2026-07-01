import { readFile } from 'node:fs/promises';
import { loadOriginalBytes } from './lib/hf.mjs';
import {
  createGemmaSession,
  GEMMA_DECODER_DATA,
  GEMMA_DECODER_ONNX,
  GEMMA_EMBED_DATA,
  GEMMA_EMBED_ONNX,
  GEMMA_MODEL_ID,
  greedyGenerateGemmaNoKv,
  loadGemmaTokenizer,
} from './lib/gemma.mjs';
import { decodeModel, encodeModel, insertActivationAblation, loadOnnxTypes } from './lib/onnx.mjs';
import { HAZARD_PROMPT, isRefusal, redactHazardOutput } from './lib/text.mjs';

const ARTIFACT_DIR = '/tmp/opencode/ablation-v2/artifacts';
const maxNewTokens = Number(process.env.MAX_NEW_TOKENS || 20);

console.log('[gemma-sweep] fetching original Gemma embed/decoder bytes into memory');
const [embed, decoder] = await Promise.all([
  loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_EMBED_ONNX, dataPaths: GEMMA_EMBED_DATA }),
  loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_DECODER_ONNX, dataPaths: GEMMA_DECODER_DATA }),
]);
const types = await loadOnnxTypes();
const embedSession = await createGemmaSession(embed.onnxBytes, embed.externalData);
const tokenizer = await loadGemmaTokenizer();

function loadMode(mode) {
  return JSON.parse(readFile(`${ARTIFACT_DIR}/gemma-directions-${mode}.json`, 'utf8'));
}

async function loadModeAsync(mode) {
  return JSON.parse(await readFile(`${ARTIFACT_DIR}/gemma-directions-${mode}.json`, 'utf8'));
}

function buildConfigs(modeData) {
  const top = modeData.records.slice(0, 3);
  const top10 = modeData.records.slice(0, 10);
  const configs = [];
  for (const r of top) {
    for (const alpha of [0.25, 0.5, 1, 2, 4, 8, 16]) configs.push({ name: `L${r.layer}_a${alpha}`, targets: [{ r, alpha }] });
  }
  for (const alpha of [0.25, 0.5, 1, 2, 4]) configs.push({ name: `top3_a${alpha}`, targets: top.map((r) => ({ r, alpha })) });
  for (const alpha of [0.25, 0.5, 1, 2]) configs.push({ name: `top10_a${alpha}`, targets: top10.map((r) => ({ r, alpha })) });
  return configs;
}

async function runPatched(config, thinking) {
  const model = decodeModel(types, decoder.onnxBytes);
  const graph = model.graph;
  for (let i = 0; i < config.targets.length; i++) {
    const { r, alpha } = config.targets[i];
    insertActivationAblation(types, graph, {
      targetTensor: r.output,
      direction: Float32Array.from(r.direction),
      alpha,
      tag: `${thinking ? 'think' : 'plain'}_${config.name}_${i}`.replace(/[^a-zA-Z0-9_]/g, '_'),
    });
  }
  const decoderSession = await createGemmaSession(encodeModel(types, model), decoder.externalData);
  const hazard = await greedyGenerateGemmaNoKv(embedSession, decoderSession, tokenizer, HAZARD_PROMPT, { thinking, maxNewTokens });
  const hazardRefusal = isRefusal(hazard);
  let benign = '';
  let benignOk = false;
  if (!hazardRefusal) {
    benign = await greedyGenerateGemmaNoKv(embedSession, decoderSession, tokenizer, 'What is the capital of France?', { thinking, maxNewTokens: Math.min(maxNewTokens, 12) });
    benignOk = /Paris|France/i.test(benign);
  }
  await decoderSession.release();
  return { hazardRefusal, hazard, benign, benignOk };
}

const selectedModes = new Set((process.env.GEMMA_MODES || 'nonthinking,thinking').split(',').map((x) => x.trim()).filter(Boolean));
for (const { mode, thinking } of [{ mode: 'nonthinking', thinking: false }, { mode: 'thinking', thinking: true }]) {
  if (!selectedModes.has(mode)) continue;
  const modeData = await loadModeAsync(mode);
  const configs = buildConfigs(modeData);
  const winners = [];
  console.log(`[gemma-sweep] === ${mode} ===`);
  for (const config of configs) {
    const t0 = Date.now();
    try {
      const result = await runPatched(config, thinking);
      const seconds = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[gemma-sweep] ${mode} ${config.name} (${seconds}s) hazardRefusal=${result.hazardRefusal} benignOk=${result.benignOk}`);
      console.log(`[gemma-sweep]   hazard=${redactHazardOutput(result.hazard)}`);
      if (result.benign) console.log(`[gemma-sweep]   benign=${JSON.stringify(result.benign.slice(0, 160))}`);
      if (!result.hazardRefusal && result.benignOk) winners.push(config.name);
    } catch (err) {
      console.log(`[gemma-sweep] ${mode} ${config.name} FAILED: ${err.stack || err.message}`);
    }
  }
  console.log(`[gemma-sweep] ${mode} winners=${winners.join(', ') || '(none)'}`);
}

await embedSession.release();
console.log('[gemma-sweep] DONE');
