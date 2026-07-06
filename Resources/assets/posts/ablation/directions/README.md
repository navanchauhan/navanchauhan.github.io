# Precomputed refusal directions

The WebGPU demo in `2026-06-27-subtracting-no-means-yes.md` fetches
`llama.json` / `gemma.json` from this folder so readers can skip live direction
extraction. Each file is a unit refusal direction (plus metadata) exported from
the Node harness in `Experiments/onnx-ablation-v2`.

If a file is absent the demo just falls back to extracting the direction live in
the browser, so this folder can ship empty.

To (re)generate:

```bash
cd Experiments/onnx-ablation-v2
npm install
N_PAIRS=16 MAX_SEQ=96 npm run llama:directions
node src/export-web-directions.mjs llama
N_PAIRS=16 MAX_SEQ=96 npm run gemma:directions
node src/export-web-directions.mjs gemma
```

The exported JSON keeps the top-K records; `loadPrecomputedDirection` in
`ablation-webgpu.js` re-sorts by `|exampleGap|` and uses the strongest.
