import MatchWorker from '../worker/match.worker?worker';

export function createMatches() {
  let loading = $state(false);
  let total = $state(0);
  let phrases = $state<string[]>([]);
  let input = ''; let cipherId = ''; let wisdom = false;
  let reqId = 0; let lastSent = 0; let timer: ReturnType<typeof setTimeout> | null = null;
  // Module workers aren't available in non-browser environments (e.g. jsdom in
  // tests, SSR). Guard construction so importing this module never throws —
  // matching stays inert there instead of crashing the host component.
  const worker = typeof Worker !== 'undefined' ? new MatchWorker() : null;
  if (worker) {
    worker.onmessage = (e: MessageEvent) => {
      const d = e.data as { reqId: number; total: number; phrases: string[] };
      if (d.reqId !== lastSent) return; // ignore stale
      total = d.total; phrases = d.phrases; loading = false;
    };
  }
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!input.trim()) { total = 0; phrases = []; loading = false; return; }
      if (!worker) { loading = false; return; }
      loading = true; lastSent = ++reqId;
      worker.postMessage({ reqId: lastSent, input, cipherId, wisdom });
    }, 150);
  }
  return {
    set input(v: string) { input = v; schedule(); },
    set cipherId(v: string) { cipherId = v; schedule(); },
    set wisdom(v: boolean) { wisdom = v; schedule(); },
    get loading() { return loading; },
    get total() { return total; },
    get phrases() { return phrases; },
  };
}
