import { writable, type Writable } from 'svelte/store';
import { ciphers } from '../data/ciphers';

function persisted<T>(key: string, initial: T): Writable<T> {
  let start = initial;
  try { const raw = localStorage.getItem(key); if (raw) start = JSON.parse(raw) as T; } catch {}
  const store = writable<T>(start);
  store.subscribe((v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} });
  return store;
}

export type Palette = 'green' | 'amber' | 'cyan';
export const DEFAULT_ENABLED = ciphers.filter((c) => c.enabled).map((c) => c.id);
export const palette = persisted<Palette>('cyphers.palette', 'green');
export const enabledCipherIds = persisted<string[]>('cyphers.enabled', DEFAULT_ENABLED);
