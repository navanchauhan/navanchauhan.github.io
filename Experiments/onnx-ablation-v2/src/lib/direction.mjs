export function makeAccumulator(names, hiddenDim) {
  const acc = new Map();
  for (const name of names) acc.set(name, new Float64Array(hiddenDim));
  return acc;
}

export function addInto(acc, name, vec) {
  const dst = acc.get(name);
  for (let i = 0; i < dst.length; i++) dst[i] += vec[i];
}

export function computeDirections({ harmful, harmless, names, hiddenDim, count }) {
  const out = {};
  for (const name of names) {
    const h = harmful.get(name);
    const b = harmless.get(name);
    const diff = new Float32Array(hiddenDim);
    let norm = 0;
    for (let i = 0; i < hiddenDim; i++) {
      const v = h[i] / count - b[i] / count;
      diff[i] = v;
      norm += v * v;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) for (let i = 0; i < hiddenDim; i++) diff[i] /= norm;
    out[name] = { norm, direction: Array.from(diff) };
  }
  return out;
}

export function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
