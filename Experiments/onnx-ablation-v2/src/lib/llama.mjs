import ort from 'onnxruntime-node';
import { AutoTokenizer, env } from '@huggingface/transformers';
import { f16ToF32 } from './f16.mjs';

export const LLAMA_MODEL_ID = 'onnx-community/Llama-3.2-1B-Instruct-ONNX';
export const LLAMA_ONNX_PATH = 'onnx/model_q4f16.onnx';
export const LLAMA_DATA_PATHS = ['onnx/model_q4f16.onnx_data'];
export const LLAMA_LOCAL_DIR = '/tmp/opencode/ablation-spike/hf-cache/onnx-community/Llama-3.2-1B-Instruct-ONNX';
export const LLAMA_LAYERS = 16;
export const LLAMA_HIDDEN = 2048;
export const LLAMA_VOCAB = 128256;

env.cacheDir = '/tmp/opencode/ablation-v2/hf-cache';
env.allowRemoteModels = true;
env.allowLocalModels = true;

export async function loadLlamaTokenizer() {
  return AutoTokenizer.from_pretrained(LLAMA_MODEL_ID);
}

export function makeLlamaFeeds(inputIds) {
  const ids = Array.from(inputIds, Number);
  const seqLen = ids.length;
  const feeds = {
    input_ids: new ort.Tensor('int64', new BigInt64Array(ids.map(BigInt)), [1, seqLen]),
    attention_mask: new ort.Tensor('int64', new BigInt64Array(Array(seqLen).fill(1n)), [1, seqLen]),
    seqlens_k: new ort.Tensor('int32', new Int32Array([seqLen]), [1]),
  };
  for (let i = 0; i < LLAMA_LAYERS; i++) {
    feeds[`past_key_values.${i}.key`] = new ort.Tensor('float16', new Uint16Array(0), [1, 8, 0, 64]);
    feeds[`past_key_values.${i}.value`] = new ort.Tensor('float16', new Uint16Array(0), [1, 8, 0, 64]);
  }
  return feeds;
}

export async function tokenizeChat(tokenizer, userPrompt) {
  const text = tokenizer.apply_chat_template([{ role: 'user', content: userPrompt }], {
    add_generation_prompt: true,
    tokenize: false,
  });
  const encoded = await tokenizer(text, { add_special_tokens: false });
  return Array.from(encoded.input_ids.ort_tensor?.cpuData || encoded.input_ids.data, Number);
}

export function logitsLastPosition(logitsTensor, vocabSize = LLAMA_VOCAB) {
  const data = logitsTensor.data;
  const start = data.length - vocabSize;
  const out = new Float32Array(vocabSize);
  if (data instanceof Uint16Array) {
    for (let i = 0; i < vocabSize; i++) out[i] = f16ToF32(data[start + i]);
  } else {
    for (let i = 0; i < vocabSize; i++) out[i] = data[start + i];
  }
  return out;
}

export function argmax(values) {
  let best = 0;
  let bestVal = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v > bestVal) {
      bestVal = v;
      best = i;
    }
  }
  return best;
}

export function topK(values, k = 8) {
  const top = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (top.length < k || v > top.at(-1).value) {
      top.push({ id: i, value: v });
      top.sort((a, b) => b.value - a.value);
      if (top.length > k) top.pop();
    }
  }
  return top;
}

export async function greedyGenerateNoKv(session, tokenizer, prompt, { maxNewTokens = 48, outputs = ['logits'] } = {}) {
  const ids = await tokenizeChat(tokenizer, prompt);
  const originalLength = ids.length;
  const eosIds = new Set([128001, 128008, 128009]);
  for (let step = 0; step < maxNewTokens; step++) {
    const result = await session.run(makeLlamaFeeds(ids), outputs);
    const logits = logitsLastPosition(result.logits);
    const next = argmax(logits);
    if (eosIds.has(next)) break;
    ids.push(next);
  }
  const newIds = ids.slice(originalLength);
  return tokenizer.decode(newIds, { skip_special_tokens: true });
}

export function llamaPresentNames() {
  const names = [];
  for (let i = 0; i < LLAMA_LAYERS; i++) names.push(`present.${i}.key`, `present.${i}.value`);
  return names;
}

export function makeLlamaDecodeFeeds(tokenId, past, totalSeqLen) {
  const feeds = {
    input_ids: new ort.Tensor('int64', new BigInt64Array([BigInt(tokenId)]), [1, 1]),
    attention_mask: new ort.Tensor('int64', new BigInt64Array(Array(totalSeqLen).fill(1n)), [1, totalSeqLen]),
    seqlens_k: new ort.Tensor('int32', new Int32Array([totalSeqLen]), [1]),
  };
  for (let i = 0; i < LLAMA_LAYERS; i++) {
    feeds[`past_key_values.${i}.key`] = past[`present.${i}.key`];
    feeds[`past_key_values.${i}.value`] = past[`present.${i}.value`];
  }
  return feeds;
}

export async function greedyGenerateKv(session, tokenizer, prompt, { maxNewTokens = 48 } = {}) {
  const promptIds = await tokenizeChat(tokenizer, prompt);
  const presentNames = llamaPresentNames();
  let out = await session.run(makeLlamaFeeds(promptIds), ['logits', ...presentNames]);
  let next = argmax(logitsLastPosition(out.logits));
  const generated = [];
  const eosIds = new Set([128001, 128008, 128009]);

  for (let step = 0; step < maxNewTokens; step++) {
    if (eosIds.has(next)) break;
    generated.push(next);
    const totalSeqLen = promptIds.length + generated.length;
    out = await session.run(makeLlamaDecodeFeeds(next, out, totalSeqLen), ['logits', ...presentNames]);
    next = argmax(logitsLastPosition(out.logits));
  }

  return tokenizer.decode(generated, { skip_special_tokens: true });
}

export async function createSessionFromBytes(onnxBytes, externalData, outputsDisabled = false) {
  return ort.InferenceSession.create(onnxBytes, {
    executionProviders: ['cpu'],
    externalData,
    graphOptimizationLevel: outputsDisabled ? 'disabled' : 'disabled',
  });
}
