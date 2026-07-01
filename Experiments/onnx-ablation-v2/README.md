# ONNX Ablation v2

This directory contains the Node.js proof harness for in-memory ONNX graph
ablation experiments referenced by the `Subtracting "No" means "Yes"` post.

The important constraint: patched ONNX graphs are created only as in-memory
`Uint8Array` values and passed directly to ONNX Runtime. Original Hugging Face
`.onnx_data` external weight files are loaded unchanged via ORT `externalData`.

## Included

- `src/`: scripts and reusable helpers for Llama/Gemma direction extraction,
  ONNX graph patching, KV-cache generation, sweeps, evals, long checks, and
  artifact sanitization.
- `findings.md`: current run notes and caveats.
- `artifacts/`: output directory placeholder. Run artifacts are intentionally not
  committed because even masked excerpts can contain sensitive prompt/output
  context.
- `package.json` and `package-lock.json`: reproducible Node dependencies.

## Not Included

- `node_modules/`
- downloaded model weights
- `.onnx_data` files
- raw hazardous non-refusal transcripts
- semi-redacted `/tmp` spot-check text files
- per-row eval JSON artifacts with model output excerpts

## Safety Note

The scripts mask hazardous non-refusal outputs in saved artifacts. Repeated
phrase diagnostics are also redacted because n-grams can leak content.

## Quick Commands

```bash
npm install
N_PAIRS=16 MAX_SEQ=96 npm run llama:directions
N_PAIRS=16 MAX_SEQ=96 npm run gemma:directions
MODEL=gemma MODE=thinking GEMMA_CONFIG=L24_a6 N_PAIRS=16 MAX_NEW_TOKENS=96 npm run eval:pairs
```

CUDA long checks require CUDA runtime/cuBLAS/cuDNN libraries on `LD_LIBRARY_PATH`.
For Gemma CUDA, `DROP_GQA_ATTENTION_BIAS=1` is currently needed because ORT's
CUDA `GroupQueryAttention` kernel rejects the optional `attention_bias` input.
