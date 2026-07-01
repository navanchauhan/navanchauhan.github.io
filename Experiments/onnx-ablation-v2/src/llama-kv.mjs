import { readFile } from 'node:fs/promises';
import { loadOriginalBytes } from './lib/hf.mjs';
import {
  createSessionFromBytes,
  greedyGenerateKv,
  greedyGenerateNoKv,
  LLAMA_DATA_PATHS,
  LLAMA_LOCAL_DIR,
  LLAMA_MODEL_ID,
  LLAMA_ONNX_PATH,
  loadLlamaTokenizer,
} from './lib/llama.mjs';
import { decodeModel, encodeModel, insertActivationAblation, loadOnnxTypes } from './lib/onnx.mjs';
import { HAZARD_PROMPT, isRefusal, redactHazardOutput } from './lib/text.mjs';

const ARTIFACT_DIR = '/tmp/opencode/ablation-v2/artifacts';
const useLocal = process.env.USE_LOCAL_ORIGINALS !== '0';
const maxNewTokens = Number(process.env.MAX_NEW_TOKENS || 32);
const patch = process.env.PATCH !== '0';
const layer = Number(process.env.LAYER || 15);
const kind = process.env.KIND || 'input_layernorm';
const alpha = Number(process.env.ALPHA || 2);

console.log(`[llama-kv] patch=${patch} kind=${kind} layer=${layer} alpha=${alpha} maxNewTokens=${maxNewTokens}`);
const { onnxBytes, externalData } = await loadOriginalBytes({
  modelId: LLAMA_MODEL_ID,
  onnxPath: LLAMA_ONNX_PATH,
  dataPaths: LLAMA_DATA_PATHS,
  localDir: useLocal ? LLAMA_LOCAL_DIR : null,
});

let modelBytes = onnxBytes;
if (patch) {
  const dirs = JSON.parse(await readFile(`${ARTIFACT_DIR}/llama-directions.json`, 'utf8'));
  const r = dirs.records.find((x) => x.kind === kind && x.layer === layer);
  if (!r) throw new Error(`No Llama direction found for ${kind} L${layer}`);
  const types = await loadOnnxTypes();
  const model = decodeModel(types, onnxBytes);
  insertActivationAblation(types, model.graph, {
    targetTensor: r.output,
    direction: Float32Array.from(r.direction),
    alpha,
    tag: `llama_kv_${kind}_L${layer}_a${alpha}`.replace(/[^a-zA-Z0-9_]/g, '_'),
  });
  modelBytes = encodeModel(types, model);
  console.log(`[llama-kv] patched target=${r.output}`);
}

const session = await createSessionFromBytes(modelBytes, externalData);
const tokenizer = await loadLlamaTokenizer();

for (const prompt of ['What is the capital of France?', HAZARD_PROMPT]) {
  const t0 = Date.now();
  const text = await greedyGenerateKv(session, tokenizer, prompt, { maxNewTokens });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  if (prompt === HAZARD_PROMPT) {
    console.log(`[llama-kv] hazard (${seconds}s): ${redactHazardOutput(text)}`);
    console.log(`[llama-kv] hazard refusal=${isRefusal(text)}`);
  } else {
    console.log(`[llama-kv] benign (${seconds}s): ${JSON.stringify(text.slice(0, 240))}`);
  }
}

if (process.env.COMPARE_NOKV === '1') {
  const t0 = Date.now();
  const text = await greedyGenerateNoKv(session, tokenizer, 'What is the capital of France?', { maxNewTokens: Math.min(12, maxNewTokens) });
  console.log(`[llama-kv] no-kv comparison (${((Date.now() - t0) / 1000).toFixed(1)}s): ${JSON.stringify(text)}`);
}

await session.release();
console.log('[llama-kv] DONE');
