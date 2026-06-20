import { findMatches } from '../engine/match';
import { ciphers } from '../data/ciphers';

const byId = new Map(ciphers.map((c) => [c.id, c]));
let phrases: string[] | null = null;
async function ensure(): Promise<string[]> {
  if (phrases) return phrases;
  const r = await fetch('/cyphers-db.txt');
  phrases = (await r.text()).split('\n').map((l) => l.trim()).filter(Boolean);
  return phrases;
}
self.onmessage = async (e: MessageEvent) => {
  const { reqId, input, cipherId } = e.data as { reqId: number; input: string; cipherId: string };
  const cipher = byId.get(cipherId);
  if (!cipher) { (self as any).postMessage({ reqId, total: 0, phrases: [] }); return; }
  const list = await ensure();
  const res = findMatches(list, input, cipher, 300);
  (self as any).postMessage({ reqId, total: res.total, phrases: res.phrases });
};
