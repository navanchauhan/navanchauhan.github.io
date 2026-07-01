import { loadOriginalBytes } from './lib/hf.mjs';
import {
  createSessionFromBytes,
  greedyGenerateNoKv,
  LLAMA_DATA_PATHS,
  LLAMA_LOCAL_DIR,
  LLAMA_MODEL_ID,
  LLAMA_ONNX_PATH,
  loadLlamaTokenizer,
} from './lib/llama.mjs';
import { HAZARD_PROMPT, isRefusal, redactHazardOutput } from './lib/text.mjs';

const useLocal = process.env.USE_LOCAL_ORIGINALS !== '0';
const maxNewTokens = Number(process.env.MAX_NEW_TOKENS || 48);

const { onnxBytes, externalData } = await loadOriginalBytes({
  modelId: LLAMA_MODEL_ID,
  onnxPath: LLAMA_ONNX_PATH,
  dataPaths: LLAMA_DATA_PATHS,
  localDir: useLocal ? LLAMA_LOCAL_DIR : null,
});
const session = await createSessionFromBytes(onnxBytes, externalData);
const tokenizer = await loadLlamaTokenizer();

for (const prompt of ['What is the capital of France?', HAZARD_PROMPT]) {
  const t0 = Date.now();
  const text = await greedyGenerateNoKv(session, tokenizer, prompt, { maxNewTokens });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  if (prompt === HAZARD_PROMPT) {
    console.log(`[llama-baseline] hazard prompt (${seconds}s): ${redactHazardOutput(text)}`);
    console.log(`[llama-baseline] hazard refusal=${isRefusal(text)}`);
  } else {
    console.log(`[llama-baseline] benign (${seconds}s): ${JSON.stringify(text)}`);
  }
}

await session.release();
console.log('[llama-baseline] DONE');
