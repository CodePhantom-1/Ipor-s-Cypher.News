<script lang="ts">
  import { createMatches } from '../stores/matches.svelte';
  import { enabledCipherIds, wisdom } from '../stores/settings';
  import { ciphers } from '../data/ciphers';
  import { get } from 'svelte/store';
  let { input = '' }: { input?: string } = $props();
  let cipherId = $state(get(enabledCipherIds)[0] ?? ciphers[0]?.id ?? '');
  const m = createMatches();
  $effect(() => { m.cipherId = cipherId; });
  $effect(() => { m.input = input; });
  $effect(() => { m.wisdom = $wisdom; });
  // Mirror the store's getters into local state. This effect relies on reading
  // m.total/phrases/loading here (so Svelte subscribes to their backing signal)
  // and re-runs whenever cipher/input/wisdom change above.
  let total = $state(0);
  let phrases = $state<string[]>([]);
  let loading = $state(false);
  $effect(() => {
    cipherId; input; $wisdom; // re-run alongside the effects above
    total = m.total; phrases = m.phrases; loading = m.loading;
  });
  // all 91 ciphers grouped by category for the selector
  const groups: [string, { id: string; name: string }[]][] = (() => {
    const g = new Map<string, { id: string; name: string }[]>();
    for (const c of ciphers) { (g.get(c.category) ?? g.set(c.category, []).get(c.category)!).push({ id: c.id, name: c.name }); }
    return [...g.entries()];
  })();
</script>
<section class="matches frame">
  <header>
    <span class="dim">MATCHES</span>
    <select bind:value={cipherId} aria-label="match cipher">
      {#each groups as [cat, list]}
        <optgroup label={cat}>
          {#each list as c}<option value={c.id}>{c.name}</option>{/each}
        </optgroup>
      {/each}
    </select>
    <button class="wisdom" class:on={$wisdom} aria-pressed={$wisdom}
      onclick={() => wisdom.set(!$wisdom)}
      title="Wisdom Mode — match ONLY the ingested scripture & esoteric corpus (hide the original DB)">✦ wisdom</button>
    <span class="count signal" data-testid="match-count">{total}</span>
  </header>
  {#if loading}<p class="dim">scanning…</p>{/if}
  <ul>
    {#each phrases as p}<li>{p}</li>{/each}
  </ul>
</section>
<style>
  .matches {
    margin-top: var(--space-5);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: var(--space-3);
  }
  header { display:flex; align-items:center; gap: var(--space-2); flex-wrap: wrap; }
  .count { font-family: var(--font-display); margin-left:auto; }
  select { background: var(--bg-elevated); color: var(--ink); border:1px solid var(--line);
    border-radius: var(--radius); font-family: var(--font-mono); font-size:.8rem; padding:2px 6px; max-width: 12rem; }
  .wisdom {
    font-family: var(--font-mono); font-size:.68rem; letter-spacing:.08em; text-transform:uppercase;
    background: transparent; color: var(--ink-dim); border:1px solid var(--line);
    border-radius: var(--radius); padding:2px 8px; cursor:pointer;
    transition: color .15s ease, border-color .15s ease, box-shadow .15s ease;
  }
  .wisdom:hover { color: var(--ink); border-color: var(--signal-dim); }
  .wisdom.on { color: var(--signal); border-color: var(--signal-dim); box-shadow: 0 0 8px var(--signal-glow); }
  ul { list-style:none; margin: var(--space-3) 0 0; padding:0; display:flex; flex-direction:column; gap:2px;
    max-height: 50vh; overflow:auto; }
  li { font-size:.95rem; padding: 2px 0; border-bottom:1px solid var(--line); }
  @media (prefers-reduced-motion: reduce) { .wisdom { transition: none; } }
</style>
