import { findMatches, precompute } from '../engine/match';
import { ciphers } from '../data/ciphers';
import { CORPUS_START } from '../data/db-meta';

const byId = new Map(ciphers.map((c) => [c.id, c]));
let phrases: string[] | null = null;
async function ensure(): Promise<string[]> {
  if (phrases) return phrases;
  // DB ships gzipped (the 31 MB plain text exceeds Cloudflare Pages' 25 MiB/file
  // cap). Hosts differ: some serve .gz with Content-Encoding (browser inflates it
  // for us), others serve raw gzip bytes. Detect the gzip magic and inflate only
  // when needed — robust on Cloudflare, GitHub Pages, and the Vite dev server.
  const r = await fetch('/cyphers-db.txt.gz');
  const buf = new Uint8Array(await r.arrayBuffer());
  let text: string;
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    text = await new Response(stream).text();
  } else {
    text = new TextDecoder().decode(buf); // host already decompressed it
  }
  phrases = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return phrases;
}

// Cache precomputed per-cipher values (each is ~phrases×4 bytes). Keep only the
// few most-recently-used ciphers so memory stays bounded across cipher switches.
const valueCache = new Map<string, Int32Array>();
const MAX_CACHED = 4;
function valuesFor(cipherId: string, list: string[]) {
  let v = valueCache.get(cipherId);
  if (v) return v;
  v = precompute(list, byId.get(cipherId)!);
  valueCache.set(cipherId, v);
  if (valueCache.size > MAX_CACHED) valueCache.delete(valueCache.keys().next().value!);
  return v;
}

self.onmessage = async (e: MessageEvent) => {
  const { reqId, input, cipherId, wisdom } =
    e.data as { reqId: number; input: string; cipherId: string; wisdom?: boolean };
  const cipher = byId.get(cipherId);
  if (!cipher) { (self as any).postMessage({ reqId, total: 0, phrases: [] }); return; }
  const list = await ensure();
  const res = findMatches(list, input, cipher, 300, valuesFor(cipherId, list),
    { wisdom, corpusStart: CORPUS_START });
  (self as any).postMessage({ reqId, total: res.total, phrases: res.phrases });
};
