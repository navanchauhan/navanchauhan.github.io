import { readFile, writeFile } from 'node:fs/promises';
import { contentDebug, repetitionDebug } from './lib/text.mjs';

const files = process.argv.slice(2);
if (files.length === 0) {
  throw new Error('Usage: node src/postprocess-loop-summary.mjs <summary.json> [...]');
}

function extractText(field) {
  const value = String(field ?? '');
  const marker = value.includes('masked_non_refusal_excerpt:') ? 'masked_non_refusal_excerpt:' : 'raw_refusal_text:';
  const idx = value.indexOf(marker);
  return idx >= 0 ? value.slice(idx + marker.length).trim() : value;
}

function summarize(rows, field) {
  const originalRefusals = rows.filter((r) => r[`${field}OriginalRefusal`]).length;
  const ablatedRefusals = rows.filter((r) => r[`${field}AblatedRefusal`]).length;
  const originalLoops = rows.filter((r) => r[`${field}OriginalLoop`]).length;
  const ablatedLoops = rows.filter((r) => r[`${field}AblatedLoop`]).length;
  const originalLowContent = rows.filter((r) => r[`${field}OriginalContentOk`] === false).length;
  const ablatedLowContent = rows.filter((r) => r[`${field}AblatedContentOk`] === false).length;
  const flipped = rows.filter((r) => r[`${field}OriginalRefusal`] && !r[`${field}AblatedRefusal`]).length;
  const cleanFlipped = rows.filter((r) => r[`${field}OriginalRefusal`] && !r[`${field}AblatedRefusal`] && !r[`${field}AblatedLoop`] && r[`${field}AblatedContentOk`] !== false).length;
  const introduced = rows.filter((r) => !r[`${field}OriginalRefusal`] && r[`${field}AblatedRefusal`]).length;
  const unchangedRefusal = rows.filter((r) => r[`${field}OriginalRefusal`] && r[`${field}AblatedRefusal`]).length;
  const unchangedNonRefusal = rows.filter((r) => !r[`${field}OriginalRefusal`] && !r[`${field}AblatedRefusal`]).length;
  return { originalRefusals, ablatedRefusals, originalLoops, ablatedLoops, originalLowContent, ablatedLowContent, flipped, cleanFlipped, introduced, unchangedRefusal, unchangedNonRefusal, total: rows.length };
}

for (const file of files) {
  const summary = JSON.parse(await readFile(file, 'utf8'));
  for (const row of summary.rows) {
    for (const field of ['harmful', 'harmless']) {
      if (!(field + 'OriginalText' in row)) continue;
      const originalText = extractText(row[`${field}OriginalText`]);
      const ablatedText = extractText(row[`${field}AblatedText`]);
      const original = repetitionDebug(originalText);
      const ablated = repetitionDebug(ablatedText);
      const originalContent = contentDebug(originalText);
      const ablatedContent = contentDebug(ablatedText);
      row[`${field}OriginalLoop`] = original.loop;
      row[`${field}AblatedLoop`] = ablated.loop;
      row[`${field}OriginalRepetition`] = original;
      row[`${field}AblatedRepetition`] = ablated;
      row[`${field}OriginalContent`] = originalContent;
      row[`${field}AblatedContent`] = ablatedContent;
      row[`${field}OriginalContentOk`] = originalContent.ok;
      row[`${field}AblatedContentOk`] = ablatedContent.ok;
    }
  }
  summary.harmful = summarize(summary.rows, 'harmful');
  if (summary.harmless) summary.harmless = summarize(summary.rows, 'harmless');
  const out = file.replace(/\.json$/, '.loop-aware.json');
  await writeFile(out, JSON.stringify(summary, null, 2));
  console.log(`${file}: ${JSON.stringify(summary.harmful)} -> ${out}`);
}
