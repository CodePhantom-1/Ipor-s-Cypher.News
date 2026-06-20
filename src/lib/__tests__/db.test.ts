import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

test('generated db is clean: no header, no blanks, deduped', () => {
  const text = gunzipSync(readFileSync('public/cyphers-db.txt.gz')).toString('utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  expect(lines.length).toBeGreaterThan(1000);
  expect(lines).not.toContain('CREATE_GEMATRO_DB');
  expect(lines.every((l) => l === l.trim())).toBe(true);
  const lower = lines.map((l) => l.toLowerCase());
  expect(new Set(lower).size).toBe(lower.length); // no case-insensitive dupes
});
