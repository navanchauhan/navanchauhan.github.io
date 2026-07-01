import { readFile } from 'node:fs/promises';

export function hfUrl(modelId, filePath, revision = 'main') {
  return `https://huggingface.co/${modelId}/resolve/${revision}/${filePath}`;
}

export async function fetchUint8(url, label = url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed for ${label}: HTTP ${response.status}`);
  const contentLength = Number(response.headers.get('content-length') || 0);
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array(await response.arrayBuffer());

  const chunks = [];
  let received = 0;
  let lastPct = -1;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (contentLength) {
      const pct = Math.floor((received / contentLength) * 100);
      if (pct >= lastPct + 10) {
        lastPct = pct;
        console.log(`[fetch] ${label}: ${pct}% (${(received / 1024 / 1024).toFixed(1)} MiB)`);
      }
    } else if (received % (256 * 1024 * 1024) < chunks.at(-1).byteLength) {
      console.log(`[fetch] ${label}: ${(received / 1024 / 1024).toFixed(1)} MiB`);
    }
  }

  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function loadOriginalBytes({ modelId, onnxPath, dataPaths, localDir = null }) {
  if (localDir) {
    const onnxBytes = new Uint8Array(await readFile(`${localDir}/${onnxPath}`));
    const externalData = [];
    for (const dataPath of dataPaths) {
      externalData.push({ path: dataPath.split('/').at(-1), data: new Uint8Array(await readFile(`${localDir}/${dataPath}`)) });
    }
    return { onnxBytes, externalData };
  }

  const onnxBytes = await fetchUint8(hfUrl(modelId, onnxPath), `${modelId}/${onnxPath}`);
  const externalData = [];
  for (const dataPath of dataPaths) {
    externalData.push({ path: dataPath.split('/').at(-1), data: await fetchUint8(hfUrl(modelId, dataPath), `${modelId}/${dataPath}`) });
  }
  return { onnxBytes, externalData };
}
