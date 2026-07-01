import { loadOriginalBytes } from './lib/hf.mjs';
import { addOutputs, decodeModel, encodeModel, llamaCarryTensors, loadOnnxTypes, summarizeConsumers } from './lib/onnx.mjs';
import {
  createSessionFromBytes,
  LLAMA_DATA_PATHS,
  LLAMA_LOCAL_DIR,
  LLAMA_MODEL_ID,
  LLAMA_ONNX_PATH,
  loadLlamaTokenizer,
  makeLlamaFeeds,
  tokenizeChat,
  logitsLastPosition,
  topK,
} from './lib/llama.mjs';
import { tensorLastTokenF16ToF32 } from './lib/f16.mjs';
import { HAZARD_PROMPT, redactHazardOutput } from './lib/text.mjs';

const useLocal = process.env.USE_LOCAL_ORIGINALS !== '0';
const localDir = useLocal ? LLAMA_LOCAL_DIR : null;

console.log(`[probe] loading original Llama bytes (${localDir ? 'local original HF cache' : 'direct HF fetch'})`);
const { onnxBytes, externalData } = await loadOriginalBytes({
  modelId: LLAMA_MODEL_ID,
  onnxPath: LLAMA_ONNX_PATH,
  dataPaths: LLAMA_DATA_PATHS,
  localDir,
});
console.log(`[probe] ONNX ${(onnxBytes.byteLength / 1024).toFixed(1)} KiB, external ${(externalData[0].data.byteLength / 1024 / 1024).toFixed(1)} MiB`);

const types = await loadOnnxTypes();
const model = decodeModel(types, onnxBytes);
const graph = model.graph;
console.log(`[probe] graph nodes=${graph.node.length}, initializers=${graph.initializer.length}, outputs=${graph.output.length}`);

const carries = llamaCarryTensors(graph);
console.log(`[probe] carry tensors found=${carries.length}`);
for (const c of carries.slice(0, 6)) {
  const consumers = summarizeConsumers(graph, c.output).map((x) => `${x.op}:${x.name}:input${x.inputIdx}`);
  console.log(`[probe]   L${c.layer} ${c.kind} carry=${c.output} consumers=${consumers.join(' | ')}`);
}

const targetOutputs = carries.filter((c) => c.kind === 'post_attention_layernorm' && [0, 8, 15].includes(c.layer)).map((c) => c.output);
const added = addOutputs(types, graph, targetOutputs);
const patchedForOutputs = encodeModel(types, model);
console.log(`[probe] added ${added} carry outputs in memory; patched protobuf ${(patchedForOutputs.byteLength / 1024).toFixed(1)} KiB`);

const session = await createSessionFromBytes(patchedForOutputs, externalData);
console.log(`[probe] ORT session loaded from in-memory ONNX buffer. inputs=${session.inputNames.length}, outputs=${session.outputNames.length}`);

const tokenizer = await loadLlamaTokenizer();
const ids = await tokenizeChat(tokenizer, 'What is the capital of France?');
const result = await session.run(makeLlamaFeeds(ids), ['logits', ...targetOutputs]);
const logits = logitsLastPosition(result.logits);
console.log(`[probe] benign top tokens: ${topK(logits, 6).map((t) => `${JSON.stringify(tokenizer.decode([t.id]))}:${t.value.toFixed(2)}`).join(', ')}`);
for (const outputName of targetOutputs) {
  const vec = tensorLastTokenF16ToF32(result[outputName]);
  let norm = 0;
  for (const x of vec) norm += x * x;
  console.log(`[probe] residual ${outputName}: dtype=${result[outputName].type}, data=${result[outputName].data.constructor.name}, norm=${Math.sqrt(norm).toFixed(3)}`);
}

const hazardIds = await tokenizeChat(tokenizer, HAZARD_PROMPT);
const hazard = await session.run(makeLlamaFeeds(hazardIds), ['logits']);
const hazardTop = topK(logitsLastPosition(hazard.logits), 6).map((t) => `${JSON.stringify(tokenizer.decode([t.id]))}:${t.value.toFixed(2)}`).join(', ');
console.log(`[probe] hazardous-prompt top tokens (non-generation): ${redactHazardOutput(hazardTop)}`);

await session.release();
console.log('[probe] DONE');
