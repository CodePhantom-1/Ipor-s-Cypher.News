import type { Cipher } from './types';
import { calculate } from './calculate';

export interface MatchResult { total: number; count: number; phrases: string[] }

export function findMatches(phrases: string[], input: string, cipher: Cipher, limit = 300): MatchResult {
  const trimmed = input.trim();
  if (!trimmed) return { total: 0, count: 0, phrases: [] };
  const target = calculate(trimmed, cipher).total;
  const echo = trimmed.toLowerCase();
  const out: string[] = [];
  let count = 0;
  for (const p of phrases) {
    if (calculate(p, cipher).total !== target) continue;
    if (p.toLowerCase() === echo) continue;
    count++;
    if (out.length < limit) out.push(p);
  }
  return { total: count, count, phrases: out };
}
