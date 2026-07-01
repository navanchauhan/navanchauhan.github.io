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
const mode = process.env.MODE || 'thinking';
const thinking = mode === 'thinking';
const patch = process.env.PATCH !== '0';
const maxNewTokens = Number(process.env.MAX_NEW_TOKENS || 64);
const alpha = Number(process.env.ALPHA || 4);
const topK = Number(process.env.TOP_K || 1);
const layerEnv = process.env.LAYERS?.trim();
const layers = layerEnv ? layerEnv.split(',').map((x) => Number(x.trim())).filter((x) => Number.isFinite(x)) : [];

console.log(`[gemma-single] mode=${mode} patch=${patch} alpha=${alpha} topK=${topK} layers=${layers.join(',') || '(top)'}`);
const [embed, decoder] = await Promise.all([
  loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_EMBED_ONNX, dataPaths: GEMMA_EMBED_DATA }),
  loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_DECODER_ONNX, dataPaths: GEMMA_DECODER_DATA }),
]);

const types = await loadOnnxTypes();
const embedSession = await createGemmaSession(embed.onnxBytes, embed.externalData);
let decoderBytes = decoder.onnxBytes;

if (patch) {
  const dirs = JSON.parse(await readFile(`${ARTIFACT_DIR}/gemma-directions-${mode}.json`, 'utf8'));
  const chosen = layers.length
    ? layers.map((layer) => dirs.records.find((r) => r.layer === layer)).filter(Boolean)
    : dirs.records.slice(0, topK);
  const model = decodeModel(types, decoder.onnxBytes);
  for (let i = 0; i < chosen.length; i++) {
    const r = chosen[i];
    insertActivationAblation(types, model.graph, {
      targetTensor: r.output,
      direction: Float32Array.from(r.direction),
      alpha,
      tag: `${mode}_single_L${r.layer}_a${alpha}_${i}`.replace(/[^a-zA-Z0-9_]/g, '_'),
    });
    console.log(`[gemma-single] patched L${r.layer} target=${r.output}`);
  }
  decoderBytes = encodeModel(types, model);
}

const decoderSession = await createGemmaSession(decoderBytes, decoder.externalData);
const tokenizer = await loadGemmaTokenizer();

for (const prompt of ['What is the capital of France?', HAZARD_PROMPT]) {
  const t0 = Date.now();
  const text = await greedyGenerateGemmaNoKv(embedSession, decoderSession, tokenizer, prompt, { thinking, maxNewTokens });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  if (prompt === HAZARD_PROMPT) {
    console.log(`[gemma-single] hazard (${seconds}s): ${redactHazardOutput(text)}`);
    console.log(`[gemma-single] hazard refusal=${isRefusal(text)}`);
  } else {
    console.log(`[gemma-single] benign (${seconds}s): ${JSON.stringify(text.slice(0, 300))}`);
  }
}

await decoderSession.release();
await embedSession.release();
console.log('[gemma-single] DONE');
