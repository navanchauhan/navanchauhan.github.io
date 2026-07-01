import { fetchUint8, hfUrl } from './lib/hf.mjs';
import { GEMMA_DECODER_ONNX, GEMMA_EMBED_ONNX, GEMMA_MODEL_ID } from './lib/gemma.mjs';
import { decodeModel, gemmaResidualTensors, loadOnnxTypes, summarizeConsumers } from './lib/onnx.mjs';

const types = await loadOnnxTypes();

async function inspect(path) {
  const bytes = await fetchUint8(hfUrl(GEMMA_MODEL_ID, path), `${GEMMA_MODEL_ID}/${path}`);
  const model = decodeModel(types, bytes);
  const graph = model.graph;
  console.log(`\n[gemma-inspect] ${path}: bytes=${bytes.byteLength}, nodes=${graph.node.length}, initializers=${graph.initializer.length}`);
  console.log(`[gemma-inspect] inputs:`);
  for (const input of graph.input) console.log(`  ${input.name}`);
  console.log(`[gemma-inspect] outputs:`);
  for (const output of graph.output.slice(0, 20)) console.log(`  ${output.name}`);
  if (graph.output.length > 20) console.log(`  ... ${graph.output.length - 20} more`);
  const opCounts = {};
  for (const node of graph.node) opCounts[node.op_type] = (opCounts[node.op_type] || 0) + 1;
  console.log(`[gemma-inspect] ops=${JSON.stringify(Object.fromEntries(Object.entries(opCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)))}`);
  const residuals = gemmaResidualTensors(graph);
  console.log(`[gemma-inspect] residual-ish tensors=${residuals.length}`);
  for (const r of residuals.slice(0, 16)) {
    const consumers = summarizeConsumers(graph, r.output).slice(0, 3).map((x) => `${x.op}:${x.name}:input${x.inputIdx}`);
    console.log(`  L${r.layer} ${r.kind} out${r.outputIndex} ${r.op} ${r.output} -> ${consumers.join(' | ')}`);
  }
  for (const r of residuals.slice(-12)) {
    const consumers = summarizeConsumers(graph, r.output).slice(0, 3).map((x) => `${x.op}:${x.name}:input${x.inputIdx}`);
    console.log(`  L${r.layer} ${r.kind} out${r.outputIndex} ${r.op} ${r.output} -> ${consumers.join(' | ')}`);
  }
}

await inspect(GEMMA_EMBED_ONNX);
await inspect(GEMMA_DECODER_ONNX);
console.log('[gemma-inspect] DONE');
