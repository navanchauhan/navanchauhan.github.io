import { mkdir, writeFile } from 'node:fs/promises';
import { loadOriginalBytes } from './lib/hf.mjs';
import { addInto, computeDirections, makeAccumulator, dot } from './lib/direction.mjs';
import { tensorLastTokenF16ToF32 } from './lib/f16.mjs';
import {
  createSessionFromBytes,
  LLAMA_DATA_PATHS,
  LLAMA_HIDDEN,
  LLAMA_LOCAL_DIR,
  LLAMA_MODEL_ID,
  LLAMA_ONNX_PATH,
  loadLlamaTokenizer,
  makeLlamaFeeds,
  tokenizeChat,
} from './lib/llama.mjs';
import { addOutputs, decodeModel, encodeModel, llamaCarryTensors, loadOnnxTypes } from './lib/onnx.mjs';

const N_PAIRS = Number(process.env.N_PAIRS || 32);
const MAX_SEQ = Number(process.env.MAX_SEQ || 96);
const useLocal = process.env.USE_LOCAL_ORIGINALS !== '0';
const ARTIFACT_DIR = '/tmp/opencode/ablation-v2/artifacts';

await mkdir(ARTIFACT_DIR, { recursive: true });

console.log(`[llama-directions] loading original Llama bytes (${useLocal ? 'local original HF cache' : 'direct HF fetch'})`);
const { onnxBytes, externalData } = await loadOriginalBytes({
  modelId: LLAMA_MODEL_ID,
  onnxPath: LLAMA_ONNX_PATH,
  dataPaths: LLAMA_DATA_PATHS,
  localDir: useLocal ? LLAMA_LOCAL_DIR : null,
});

const types = await loadOnnxTypes();
const model = decodeModel(types, onnxBytes);
const graph = model.graph;
const carries = llamaCarryTensors(graph);
const selected = carries.filter((c) => c.kind === 'post_attention_layernorm' || c.kind === 'input_layernorm');
const outputNames = selected.map((c) => c.output);
addOutputs(types, graph, outputNames);
const withOutputs = encodeModel(types, model);
const session = await createSessionFromBytes(withOutputs, externalData);
console.log(`[llama-directions] session loaded with ${outputNames.length} carry outputs`);

const tokenizer = await loadLlamaTokenizer();
const datasetUrl = 'https://huggingface.co/datasets/heretic-org/Semantic-Harmful/resolve/main/metadata/matched_pairs.json';
const dataset = await (await fetch(datasetUrl)).json();
const pairs = dataset.pairs.slice(0, N_PAIRS);
console.log(`[llama-directions] using ${pairs.length} matched pairs, maxSeq=${MAX_SEQ}`);

const harmful = makeAccumulator(outputNames, LLAMA_HIDDEN);
const harmless = makeAccumulator(outputNames, LLAMA_HIDDEN);
const examples = new Map(outputNames.map((name) => [name, { h: null, b: null }]));

async function promptActivations(prompt) {
  let ids = await tokenizeChat(tokenizer, prompt);
  if (ids.length > MAX_SEQ) ids = ids.slice(0, MAX_SEQ);
  const outputs = await session.run(makeLlamaFeeds(ids), outputNames);
  const result = new Map();
  for (const name of outputNames) result.set(name, tensorLastTokenF16ToF32(outputs[name], LLAMA_HIDDEN));
  return result;
}

for (let i = 0; i < pairs.length; i++) {
  const t0 = Date.now();
  const hActs = await promptActivations(pairs[i].harmful);
  const bActs = await promptActivations(pairs[i].harmless);
  for (const name of outputNames) {
    addInto(harmful, name, hActs.get(name));
    addInto(harmless, name, bActs.get(name));
    if (i === 0) examples.set(name, { h: hActs.get(name), b: bActs.get(name) });
  }
  console.log(`[llama-directions] pair ${i + 1}/${pairs.length} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

const dirs = computeDirections({ harmful, harmless, names: outputNames, hiddenDim: LLAMA_HIDDEN, count: pairs.length });
const records = selected.map((meta) => {
  const entry = dirs[meta.output];
  const ex = examples.get(meta.output);
  const direction = Float32Array.from(entry.direction);
  return {
    ...meta,
    norm: entry.norm,
    exampleGap: dot(ex.h, direction) - dot(ex.b, direction),
    direction: entry.direction,
  };
});
records.sort((a, b) => Math.abs(b.exampleGap) - Math.abs(a.exampleGap));

for (const r of records.slice(0, 12)) {
  console.log(`[llama-directions] rank ${r.kind} L${r.layer} out${r.outputIndex ?? ''}: norm=${r.norm.toFixed(3)} exampleGap=${r.exampleGap.toFixed(3)} target=${r.output}`);
}

await writeFile(`${ARTIFACT_DIR}/llama-directions.json`, JSON.stringify({ model: LLAMA_MODEL_ID, nPairs: pairs.length, maxSeq: MAX_SEQ, records }, null, 2));
await session.release();
console.log(`[llama-directions] wrote ${ARTIFACT_DIR}/llama-directions.json`);
console.log('[llama-directions] DONE');
