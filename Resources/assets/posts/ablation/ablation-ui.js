// UI wiring for the live in-browser abliteration demo. Kept in its own file so
// the Markdown post stays free of `$` characters, which the site's LaTeX
// renderer would otherwise try to parse as inline math.

import { createEngine, pickDevice } from '/assets/posts/ablation/ablation-webgpu.js';

const byId = (id) => document.getElementById(id);
const setStatus = (m) => { byId('ab-status').textContent = m; };
// Generation stops early at EOS, so this is an upper bound. Streaming keeps long
// runs watchable; on the WASM fallback long generations are slow.
const MAX_NEW_TOKENS = 256;
let engine = null;

const warn = byId('ab-warn');
if (!navigator.gpu) {
  warn.style.display = 'block';
  warn.textContent =
    'WebGPU not detected — the demo will fall back to WASM, which is much slower. Chrome (or Safari 26+) is recommended.';
}

byId('ab-model').addEventListener('change', () => {
  const big = byId('ab-model').value === 'gemma';
  warn.style.display = big ? 'block' : navigator.gpu ? 'none' : 'block';
  if (big) {
    warn.textContent =
      'Gemma downloads ~3.1 GB of weights on first load. Make sure you are on a fast, unmetered connection.';
  }
});

byId('ab-alpha').addEventListener('input', () => {
  byId('ab-alpha-val').textContent = (+byId('ab-alpha').value).toFixed(1);
});

let modeInfo = null; // { single: {labels, alpha}, multi: {labels, alpha} }
const currentMode = () => (byId('ab-layers') ? byId('ab-layers').value : 'multi');

// Set the slider to the suggested alpha for the active mode and describe it.
function applyMode() {
  if (!modeInfo) return;
  const info = modeInfo[currentMode()] || modeInfo.single;
  byId('ab-alpha').value = info.alpha;
  byId('ab-alpha-val').textContent = (+info.alpha).toFixed(1);
  setStatus(
    `Ready on ${engine.device.toUpperCase()} · ${currentMode()} ablation: ${info.labels.join(' + ')} · suggested α=${info.alpha}. Type a prompt and hit Generate.`,
  );
}

if (byId('ab-layers')) byId('ab-layers').addEventListener('change', applyMode);

byId('ab-load').addEventListener('click', async () => {
  const key = byId('ab-model').value;
  byId('ab-load').disabled = true;
  try {
    engine = await createEngine(key, {
      device: await pickDevice(),
      onStatus: setStatus,
      onProgress: (label, recv, total) => {
        const mb = (recv / 1048576).toFixed(0);
        setStatus(
          total
            ? `Downloading ${label}: ${Math.floor((recv / total) * 100)}% (${mb} MiB)`
            : `Downloading ${label}: ${mb} MiB`,
        );
      },
    });
    if (byId('ab-dir').value === 'live') {
      setStatus('Extracting refusal direction live…');
      await engine.ensureDirection({ preferLive: true });
    } else {
      await engine.ensureDirection();
    }
    modeInfo = await engine.modeInfo();
    applyMode();
    byId('ab-run').disabled = false;
    byId('ab-alpha').disabled = false;
  } catch (e) {
    setStatus('Load failed: ' + e.message);
    byId('ab-load').disabled = false;
  }
});

byId('ab-run').addEventListener('click', async () => {
  if (!engine) return;
  byId('ab-run').disabled = true;
  const prompt = byId('ab-prompt').value;
  const alpha = +byId('ab-alpha').value;
  const mode = currentMode();
  byId('ab-out-base').textContent = '';
  byId('ab-out-abl').textContent = '';
  // Stream tokens straight into each panel; leave the text as the model wrote it.
  const stream = (id) => (t) => { byId(id).textContent = t; };
  try {
    setStatus('Generating baseline (original graph)…');
    await engine.generateBaseline(prompt, { maxNewTokens: MAX_NEW_TOKENS, onToken: stream('ab-out-base') });

    setStatus(`Patching graph in memory and generating (${mode}, α=${alpha})…`);
    await engine.generate(prompt, { alpha, mode, maxNewTokens: MAX_NEW_TOKENS, onToken: stream('ab-out-abl') });
    setStatus('Done.');
  } catch (e) {
    setStatus('Generation failed: ' + e.message);
  }
  byId('ab-run').disabled = false;
});
