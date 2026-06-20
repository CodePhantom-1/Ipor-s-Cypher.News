<script lang="ts">
  import { createMatches } from '../stores/matches.svelte';
  import { enabledCipherIds } from '../stores/settings';
  import { ciphers } from '../data/ciphers';
  import { get } from 'svelte/store';
  let { input = '' }: { input?: string } = $props();
  const enabled = $derived(get(enabledCipherIds));
  let cipherId = $state(get(enabledCipherIds)[0] ?? '');
  const m = createMatches();
  $effect(() => { m.cipherId = cipherId; });
  $effect(() => { m.input = input; });
  // Mirror the store's getters into local state. This effect has no
  // dependencies of its own — it relies on `m.total`/`m.phrases`/`m.loading`
  // being read here so Svelte subscribes to whatever signal backs them
  // (the real store's `$state`), while also re-running on every flush
  // triggered by the effects above (covers synchronous test doubles that
  // recompute outside Svelte's reactivity).
  let total = $state(0);
  let phrases = $state<string[]>([]);
  let loading = $state(false);
  $effect(() => {
    cipherId; input; // re-run alongside the effects above, which write these into the store
    total = m.total; phrases = m.phrases; loading = m.loading;
  });
  const names = new Map(ciphers.map((c) => [c.id, c.name]));
</script>
<section class="matches">
  <header>
    <span class="dim">MATCHES</span>
    <select bind:value={cipherId} aria-label="match cipher">
      {#each enabled as id}<option value={id}>{names.get(id)}</option>{/each}
    </select>
    <span class="count signal" data-testid="match-count">{total}</span>
  </header>
  {#if loading}<p class="dim">scanning…</p>{/if}
  <ul>
    {#each phrases as p}<li>{p}</li>{/each}
  </ul>
</section>
<style>
  .matches { margin-top: var(--space-5); border-top: 1px solid var(--line); padding-top: var(--space-3); }
  header { display:flex; align-items:center; gap: var(--space-3); }
  .count { font-family: var(--font-display); margin-left:auto; }
  select { background: var(--bg-elevated); color: var(--ink); border:1px solid var(--line);
    border-radius: var(--radius); font-family: var(--font-mono); font-size:.8rem; padding:2px 6px; }
  ul { list-style:none; margin: var(--space-3) 0 0; padding:0; display:flex; flex-direction:column; gap:2px;
    max-height: 50vh; overflow:auto; }
  li { font-size:.95rem; padding: 2px 0; border-bottom:1px solid var(--line); }
</style>
