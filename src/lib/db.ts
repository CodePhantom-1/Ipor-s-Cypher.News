let cache: Promise<string[]> | null = null;
export function loadPhrases(): Promise<string[]> {
  if (cache) return cache;
  cache = fetch('/cyphers-db.txt')
    .then((r) => { if (!r.ok) throw new Error(`db fetch ${r.status}`); return r.text(); })
    .then((t) => t.split('\n').map((l) => l.trim()).filter(Boolean));
  return cache;
}
