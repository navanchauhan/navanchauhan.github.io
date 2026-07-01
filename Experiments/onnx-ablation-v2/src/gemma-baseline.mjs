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
import { HAZARD_PROMPT, isRefusal, redactHazardOutput } from './lib/text.mjs';

const maxNewTokens = Number(process.env.MAX_NEW_TOKENS || 16);

console.log('[gemma-baseline] fetching original Gemma embed ONNX + external data into memory');
const embed = await loadOriginalBytes({
  modelId: GEMMA_MODEL_ID,
  onnxPath: GEMMA_EMBED_ONNX,
  dataPaths: GEMMA_EMBED_DATA,
});
console.log('[gemma-baseline] fetching original Gemma decoder ONNX + external data into memory');
const decoder = await loadOriginalBytes({
  modelId: GEMMA_MODEL_ID,
  onnxPath: GEMMA_DECODER_ONNX,
  dataPaths: GEMMA_DECODER_DATA,
});

console.log('[gemma-baseline] creating sessions from in-memory buffers');
const embedSession = await createGemmaSession(embed.onnxBytes, embed.externalData);
const decoderSession = await createGemmaSession(decoder.onnxBytes, decoder.externalData);
console.log(`[gemma-baseline] sessions loaded: embed inputs=${embedSession.inputNames.length}, decoder inputs=${decoderSession.inputNames.length}`);

const tokenizer = await loadGemmaTokenizer();
for (const thinking of [false, true]) {
  const mode = thinking ? 'thinking' : 'non-thinking';
  const benignStart = Date.now();
  const benign = await greedyGenerateGemmaNoKv(embedSession, decoderSession, tokenizer, 'What is the capital of France?', { thinking, maxNewTokens: Math.min(maxNewTokens, 10) });
  console.log(`[gemma-baseline] ${mode} benign (${((Date.now() - benignStart) / 1000).toFixed(1)}s): ${JSON.stringify(benign.slice(0, 200))}`);
  const hazardStart = Date.now();
  const hazard = await greedyGenerateGemmaNoKv(embedSession, decoderSession, tokenizer, HAZARD_PROMPT, { thinking, maxNewTokens });
  console.log(`[gemma-baseline] ${mode} hazard (${((Date.now() - hazardStart) / 1000).toFixed(1)}s): ${redactHazardOutput(hazard)}`);
  console.log(`[gemma-baseline] ${mode} hazard refusal=${isRefusal(hazard)}`);
}

await decoderSession.release();
await embedSession.release();
console.log('[gemma-baseline] DONE');
