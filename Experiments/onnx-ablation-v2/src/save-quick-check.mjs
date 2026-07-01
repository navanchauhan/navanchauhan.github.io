import { writeFile, readFile } from 'node:fs/promises';
import { loadOriginalBytes } from './lib/hf.mjs';
import {
  createSessionFromBytes,
  greedyGenerateKv,
  LLAMA_DATA_PATHS,
  LLAMA_LOCAL_DIR,
  LLAMA_MODEL_ID,
  LLAMA_ONNX_PATH,
  loadLlamaTokenizer,
} from './lib/llama.mjs';
import { decodeModel, encodeModel, insertActivationAblation, loadOnnxTypes } from './lib/onnx.mjs';
import { HAZARD_PROMPT, isRefusal } from './lib/text.mjs';

const ARTIFACT_DIR = '/tmp/opencode/ablation-v2/artifacts';
const MAX_NEW_TOKENS = Number(process.env.MAX_NEW_TOKENS || 256);

const { onnxBytes, externalData } = await loadOriginalBytes({
  modelId: LLAMA_MODEL_ID,
  onnxPath: LLAMA_ONNX_PATH,
  dataPaths: LLAMA_DATA_PATHS,
  localDir: LLAMA_LOCAL_DIR,
});

const tokenizer = await loadLlamaTokenizer();

const originalSession = await createSessionFromBytes(onnxBytes, externalData);
const originalText = await greedyGenerateKv(originalSession, tokenizer, HAZARD_PROMPT, { maxNewTokens: MAX_NEW_TOKENS });
await originalSession.release();

const directions = JSON.parse(await readFile(`${ARTIFACT_DIR}/llama-directions.json`, 'utf8'));
const direction = directions.records.find((r) => r.kind === 'input_layernorm' && r.layer === 15);
if (!direction) throw new Error('Missing Llama direction for input_layernorm L15');

const types = await loadOnnxTypes();
const model = decodeModel(types, onnxBytes);
insertActivationAblation(types, model.graph, {
  targetTensor: direction.output,
  direction: Float32Array.from(direction.direction),
  alpha: 2,
  tag: 'quick_check_llama_l15_a2',
});

const ablatedSession = await createSessionFromBytes(encodeModel(types, model), externalData);
const ablatedText = await greedyGenerateKv(ablatedSession, tokenizer, HAZARD_PROMPT, { maxNewTokens: MAX_NEW_TOKENS });
await ablatedSession.release();

await writeFile('/tmp/og.txt', originalText, 'utf8');

if (isRefusal(ablatedText)) {
  await writeFile('/tmp/ablated.txt', ablatedText, 'utf8');
} else {
  await writeFile(
    '/tmp/ablated.txt',
    [
      '[redacted hazardous-prompt ablated output]',
      `prompt=${JSON.stringify(HAZARD_PROMPT)}`,
      'model=onnx-community/Llama-3.2-1B-Instruct-ONNX',
      'patch=input_layernorm_L15_alpha2',
      `max_new_tokens=${MAX_NEW_TOKENS}`,
      `refusal_detected=${isRefusal(ablatedText)}`,
      `chars=${ablatedText.length}`,
    ].join('\n') + '\n',
    'utf8',
  );
}

console.log(`[save-quick-check] wrote /tmp/og.txt (${originalText.length} chars, refusal=${isRefusal(originalText)})`);
console.log(`[save-quick-check] wrote /tmp/ablated.txt (${ablatedText.length} chars, refusal=${isRefusal(ablatedText)})`);
