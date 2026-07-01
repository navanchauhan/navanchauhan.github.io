import { mkdir, writeFile } from 'node:fs/promises';
import { loadOriginalBytes } from './lib/hf.mjs';
import { addInto, computeDirections, dot, makeAccumulator } from './lib/direction.mjs';
import { tensorLastTokenToF32 } from './lib/f16.mjs';
import {
  createGemmaSession,
  GEMMA_DECODER_DATA,
  GEMMA_DECODER_ONNX,
  GEMMA_EMBED_DATA,
  GEMMA_EMBED_ONNX,
  GEMMA_HIDDEN,
  GEMMA_MODEL_ID,
  loadGemmaTokenizer,
  makeGemmaDecoderFeeds,
  makeGemmaEmbedFeeds,
  tokenizeGemmaChat,
} from './lib/gemma.mjs';
import { addOutputs, decodeModel, encodeModel, gemmaLayerScalarTensors, loadOnnxTypes } from './lib/onnx.mjs';

const N_PAIRS = Number(process.env.N_PAIRS || 8);
const MAX_SEQ = Number(process.env.MAX_SEQ || 96);
const ARTIFACT_DIR = '/tmp/opencode/ablation-v2/artifacts';
await mkdir(ARTIFACT_DIR, { recursive: true });

console.log('[gemma-directions] fetching original Gemma embed/decoder bytes into memory');
const [embed, decoder] = await Promise.all([
  loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_EMBED_ONNX, dataPaths: GEMMA_EMBED_DATA }),
  loadOriginalBytes({ modelId: GEMMA_MODEL_ID, onnxPath: GEMMA_DECODER_ONNX, dataPaths: GEMMA_DECODER_DATA }),
]);

const types = await loadOnnxTypes();
const decoderModel = decodeModel(types, decoder.onnxBytes);
const graph = decoderModel.graph;
const targets = gemmaLayerScalarTensors(graph);
const outputNames = targets.map((t) => t.output);
addOutputs(types, graph, outputNames);
const decoderWithOutputs = encodeModel(types, decoderModel);

const embedSession = await createGemmaSession(embed.onnxBytes, embed.externalData);
const decoderSession = await createGemmaSession(decoderWithOutputs, decoder.externalData);
const tokenizer = await loadGemmaTokenizer();

const datasetUrl = 'https://huggingface.co/datasets/heretic-org/Semantic-Harmful/resolve/main/metadata/matched_pairs.json';
const dataset = await (await fetch(datasetUrl)).json();
const pairs = dataset.pairs.slice(0, N_PAIRS);
console.log(`[gemma-directions] targets=${targets.length}, pairs=${pairs.length}, maxSeq=${MAX_SEQ}`);

async function promptActivations(prompt, thinking) {
  let ids = await tokenizeGemmaChat(tokenizer, prompt, { thinking });
  if (ids.length > MAX_SEQ) ids = ids.slice(0, MAX_SEQ);
  const embedOutputs = await embedSession.run(makeGemmaEmbedFeeds(ids), ['inputs_embeds', 'per_layer_inputs']);
  const outputs = await decoderSession.run(makeGemmaDecoderFeeds({ inputIds: ids, embedOutputs }), outputNames);
  const result = new Map();
  for (const name of outputNames) result.set(name, tensorLastTokenToF32(outputs[name], GEMMA_HIDDEN));
  return result;
}

async function computeMode(thinking) {
  const mode = thinking ? 'thinking' : 'nonthinking';
  const harmful = makeAccumulator(outputNames, GEMMA_HIDDEN);
  const harmless = makeAccumulator(outputNames, GEMMA_HIDDEN);
  const examples = new Map(outputNames.map((name) => [name, { h: null, b: null }]));
  for (let i = 0; i < pairs.length; i++) {
    const t0 = Date.now();
    const hActs = await promptActivations(pairs[i].harmful, thinking);
    const bActs = await promptActivations(pairs[i].harmless, thinking);
    for (const name of outputNames) {
      addInto(harmful, name, hActs.get(name));
      addInto(harmless, name, bActs.get(name));
      if (i === 0) examples.set(name, { h: hActs.get(name), b: bActs.get(name) });
    }
    console.log(`[gemma-directions] ${mode} pair ${i + 1}/${pairs.length} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  const dirs = computeDirections({ harmful, harmless, names: outputNames, hiddenDim: GEMMA_HIDDEN, count: pairs.length });
  const records = targets.map((meta) => {
    const entry = dirs[meta.output];
    const ex = examples.get(meta.output);
    const direction = Float32Array.from(entry.direction);
    return { ...meta, norm: entry.norm, exampleGap: dot(ex.h, direction) - dot(ex.b, direction), direction: entry.direction };
  });
  records.sort((a, b) => Math.abs(b.exampleGap) - Math.abs(a.exampleGap));
  for (const r of records.slice(0, 10)) {
    console.log(`[gemma-directions] ${mode} rank L${r.layer}: norm=${r.norm.toFixed(3)} exampleGap=${r.exampleGap.toFixed(3)} target=${r.output}`);
  }
  await writeFile(`${ARTIFACT_DIR}/gemma-directions-${mode}.json`, JSON.stringify({ model: GEMMA_MODEL_ID, mode, nPairs: pairs.length, maxSeq: MAX_SEQ, records }, null, 2));
}

await computeMode(false);
await computeMode(true);
await decoderSession.release();
await embedSession.release();
console.log('[gemma-directions] DONE');
