import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const roots = process.argv.slice(2);
if (roots.length === 0) {
  throw new Error('Usage: node src/sanitize-artifact-redactions.mjs <file-or-directory> [...]');
}

function redactString(value) {
  return value.replace(/("repeated":\{"n":\d+,"phrase":)"(?:\\.|[^"])*"(,"count":\d+\})/g, '$1"[redacted]"$2');
}

function sanitizeJson(value) {
  if (Array.isArray(value)) return value.map(sanitizeJson);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = sanitizeJson(child);
    if (out.repeated && typeof out.repeated === 'object' && typeof out.repeated.phrase === 'string') {
      out.repeated = { ...out.repeated, phrase: '[redacted]' };
    }
    return out;
  }
  return typeof value === 'string' ? redactString(value) : value;
}

async function collectFiles(path) {
  const info = await stat(path);
  if (info.isFile()) return [path];
  if (!info.isDirectory()) return [];

  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

let changed = 0;
for (const root of roots) {
  for (const file of await collectFiles(root)) {
    if (!/\.(json|txt)$/.test(file)) continue;
    const before = await readFile(file, 'utf8');
    let after = before;
    if (file.endsWith('.json')) {
      after = JSON.stringify(sanitizeJson(JSON.parse(before)), null, 2);
      if (!after.endsWith('\n')) after += '\n';
    } else {
      after = redactString(before);
    }
    if (after !== before) {
      await writeFile(file, after, 'utf8');
      changed++;
      console.log(`[sanitize] redacted ${file}`);
    }
  }
}

console.log(`[sanitize] changed=${changed}`);
