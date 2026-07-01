export function f16ToF32(h) {
  const sign = (h >> 15) & 0x1;
  const exp = (h >> 10) & 0x1f;
  const frac = h & 0x3ff;
  if (exp === 0) {
    if (frac === 0) return sign ? -0 : 0;
    return (sign ? -1 : 1) * (frac / 1024) * 2 ** -14;
  }
  if (exp === 0x1f) return frac ? NaN : sign ? -Infinity : Infinity;
  return (sign ? -1 : 1) * (1 + frac / 1024) * 2 ** (exp - 15);
}

export function f32ToF16(val) {
  const buf = new ArrayBuffer(4);
  const f32 = new Float32Array(buf);
  const u32 = new Uint32Array(buf);
  f32[0] = val;
  const x = u32[0];
  const sign = (x >> 31) & 1;
  const exp = (x >> 23) & 0xff;
  const frac = x & 0x7fffff;

  if (exp === 0xff) return (sign << 15) | 0x7c00 | (frac ? 1 : 0);

  const newExp = exp - 127 + 15;
  if (newExp >= 0x1f) return (sign << 15) | 0x7c00;
  if (newExp <= 0) {
    if (newExp < -10) return sign << 15;
    const mant = (frac | 0x800000) >> (1 - newExp);
    return (sign << 15) | (mant >> 13);
  }
  return (sign << 15) | (newExp << 10) | (frac >> 13);
}

export function f32ArrayToF16Buffer(values) {
  const out = Buffer.alloc(values.length * 2);
  for (let i = 0; i < values.length; i++) out.writeUInt16LE(f32ToF16(values[i]), i * 2);
  return out;
}

export function tensorLastTokenF16ToF32(tensor, hiddenDim) {
  if (!(tensor.data instanceof Uint16Array)) {
    throw new Error(`Expected float16 tensor data to be Uint16Array, got ${tensor.data?.constructor?.name}`);
  }
  const seqLen = tensor.dims.at(-2);
  const dim = hiddenDim ?? tensor.dims.at(-1);
  const start = (seqLen - 1) * dim;
  const out = new Float32Array(dim);
  for (let i = 0; i < dim; i++) out[i] = f16ToF32(tensor.data[start + i]);
  return out;
}

export function tensorLastTokenToF32(tensor, hiddenDim) {
  const seqLen = tensor.dims.at(-2);
  const dim = hiddenDim ?? tensor.dims.at(-1);
  const start = (seqLen - 1) * dim;
  const out = new Float32Array(dim);
  if (tensor.data instanceof Uint16Array) {
    for (let i = 0; i < dim; i++) out[i] = f16ToF32(tensor.data[start + i]);
  } else {
    for (let i = 0; i < dim; i++) out[i] = tensor.data[start + i];
  }
  return out;
}
