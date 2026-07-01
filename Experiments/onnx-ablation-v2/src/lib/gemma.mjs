import ort from 'onnxruntime-node';
import { AutoTokenizer, env } from '@huggingface/transformers';
import { f16ToF32 } from './f16.mjs';

export const GEMMA_MODEL_ID = 'onnx-community/gemma-4-E2B-it-ONNX';
export const GEMMA_EMBED_ONNX = 'onnx/embed_tokens_q4f16.onnx';
export const GEMMA_EMBED_DATA = ['onnx/embed_tokens_q4f16.onnx_data'];
export const GEMMA_DECODER_ONNX = 'onnx/decoder_model_merged_q4f16.onnx';
export const GEMMA_DECODER_DATA = ['onnx/decoder_model_merged_q4f16.onnx_data'];
export const GEMMA_KV_LAYERS = 15;
export const GEMMA_HIDDEN = 1536;
export const GEMMA_VOCAB = 262144;

env.cacheDir = '/tmp/opencode/ablation-v2/hf-cache';
env.allowRemoteModels = true;
env.allowLocalModels = true;

export async function loadGemmaTokenizer() {
  return AutoTokenizer.from_pretrained(GEMMA_MODEL_ID);
}

export async function createGemmaSession(onnxBytes, externalData, { executionProviders = ['cpu'] } = {}) {
  return ort.InferenceSession.create(onnxBytes, {
    executionProviders,
    externalData,
    graphOptimizationLevel: 'disabled',
  });
}

export async function tokenizeGemmaChat(tokenizer, userPrompt, { thinking = false } = {}) {
  const messages = [];
  if (thinking) messages.push({ role: 'system', content: '<|think|>' });
  messages.push({ role: 'user', content: userPrompt });
  const text = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    tokenize: false,
    enable_thinking: thinking,
  });
  const encoded = await tokenizer(text, { add_special_tokens: false });
  return Array.from(encoded.input_ids.ort_tensor?.cpuData || encoded.input_ids.data, Number);
}

export function makeGemmaEmbedFeeds(inputIds) {
  const ids = Array.from(inputIds, Number);
  return {
    input_ids: new ort.Tensor('int64', new BigInt64Array(ids.map(BigInt)), [1, ids.length]),
  };
}

export function makeGemmaDecoderFeeds({ inputIds, embedOutputs }) {
  const ids = Array.from(inputIds, Number);
  const seqLen = ids.length;
  const feeds = {
    inputs_embeds: embedOutputs.inputs_embeds,
    per_layer_inputs: embedOutputs.per_layer_inputs,
    attention_mask: new ort.Tensor('int64', new BigInt64Array(Array(seqLen).fill(1n)), [1, seqLen]),
    position_ids: new ort.Tensor('int64', new BigInt64Array(Array.from({ length: seqLen }, (_, i) => BigInt(i))), [1, seqLen]),
    num_logits_to_keep: new ort.Tensor('int64', new BigInt64Array([1n]), []),
  };
  for (let i = 0; i < GEMMA_KV_LAYERS; i++) {
    const headDim = i === 4 || i === 9 || i === 14 ? 512 : 256;
    feeds[`past_key_values.${i}.key`] = new ort.Tensor('float16', new Uint16Array(0), [1, 1, 0, headDim]);
    feeds[`past_key_values.${i}.value`] = new ort.Tensor('float16', new Uint16Array(0), [1, 1, 0, headDim]);
  }
  return feeds;
}

export function gemmaPresentNames() {
  const names = [];
  for (let i = 0; i < GEMMA_KV_LAYERS; i++) names.push(`present.${i}.key`, `present.${i}.value`);
  return names;
}

export function makeGemmaDecodeFeeds({ tokenId, embedOutputs, past, totalSeqLen }) {
  const feeds = {
    inputs_embeds: embedOutputs.inputs_embeds,
    per_layer_inputs: embedOutputs.per_layer_inputs,
    attention_mask: new ort.Tensor('int64', new BigInt64Array(Array(totalSeqLen).fill(1n)), [1, totalSeqLen]),
    position_ids: new ort.Tensor('int64', new BigInt64Array([BigInt(totalSeqLen - 1)]), [1, 1]),
    num_logits_to_keep: new ort.Tensor('int64', new BigInt64Array([1n]), []),
  };
  for (let i = 0; i < GEMMA_KV_LAYERS; i++) {
    feeds[`past_key_values.${i}.key`] = past[`present.${i}.key`];
    feeds[`past_key_values.${i}.value`] = past[`present.${i}.value`];
  }
  return feeds;
}

export function gemmaLogitsLastPosition(logitsTensor) {
  const data = logitsTensor.data;
  const start = data.length - GEMMA_VOCAB;
  const out = new Float32Array(GEMMA_VOCAB);
  if (data instanceof Uint16Array) {
    for (let i = 0; i < GEMMA_VOCAB; i++) out[i] = f16ToF32(data[start + i]);
  } else {
    for (let i = 0; i < GEMMA_VOCAB; i++) out[i] = data[start + i];
  }
  return out;
}

export function argmax(values) {
  let best = 0;
  let bestVal = -Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > bestVal) {
      bestVal = values[i];
      best = i;
    }
  }
  return best;
}

export async function greedyGenerateGemmaNoKv(embedSession, decoderSession, tokenizer, prompt, { thinking = false, maxNewTokens = 32 } = {}) {
  const ids = await tokenizeGemmaChat(tokenizer, prompt, { thinking });
  const originalLength = ids.length;
  const eosIds = new Set([1, 106]);
  for (let step = 0; step < maxNewTokens; step++) {
    const embedOutputs = await embedSession.run(makeGemmaEmbedFeeds(ids), ['inputs_embeds', 'per_layer_inputs']);
    const decoderOutputs = await decoderSession.run(makeGemmaDecoderFeeds({ inputIds: ids, embedOutputs }), ['logits']);
    const logits = gemmaLogitsLastPosition(decoderOutputs.logits);
    const next = argmax(logits);
    if (eosIds.has(next)) break;
    ids.push(next);
  }
  return tokenizer.decode(ids.slice(originalLength), { skip_special_tokens: true });
}

export async function greedyGenerateGemmaKv(embedSession, decoderSession, tokenizer, prompt, { thinking = false, maxNewTokens = 32 } = {}) {
  const promptIds = await tokenizeGemmaChat(tokenizer, prompt, { thinking });
  const presentNames = gemmaPresentNames();
  const promptEmbeds = await embedSession.run(makeGemmaEmbedFeeds(promptIds), ['inputs_embeds', 'per_layer_inputs']);
  let out = await decoderSession.run(makeGemmaDecoderFeeds({ inputIds: promptIds, embedOutputs: promptEmbeds }), ['logits', ...presentNames]);
  let next = argmax(gemmaLogitsLastPosition(out.logits));
  const generated = [];
  const eosIds = new Set([1, 106]);

  for (let step = 0; step < maxNewTokens; step++) {
    if (eosIds.has(next)) break;
    generated.push(next);
    const totalSeqLen = promptIds.length + generated.length;
    const tokenEmbeds = await embedSession.run(makeGemmaEmbedFeeds([next]), ['inputs_embeds', 'per_layer_inputs']);
    out = await decoderSession.run(
      makeGemmaDecodeFeeds({ tokenId: next, embedOutputs: tokenEmbeds, past: out, totalSeqLen }),
      ['logits', ...presentNames],
    );
    next = argmax(gemmaLogitsLastPosition(out.logits));
  }

  return tokenizer.decode(generated, { skip_special_tokens: true });
}
