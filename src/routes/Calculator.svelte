<script lang="ts">
  import { createCalc } from '../stores/calc.svelte';
  import CalcInput from '../lib/CalcInput.svelte';
  import CipherValue from '../lib/CipherValue.svelte';
  import Matches from '../lib/Matches.svelte';
  import Wordmark from '../lib/Wordmark.svelte';
  import PaletteSwitch from '../lib/PaletteSwitch.svelte';

  const calc = createCalc();
  let value = $state('');
  $effect(() => {
    calc.input = value;
  });
</script>

<div class="shell">
  <header>
    <Wordmark />
    <PaletteSwitch />
  </header>

  <div class="status" aria-hidden="true">
    <span class="dot"></span>
    <span class="readout dim">LIVE&nbsp;·&nbsp;91 CIPHERS&nbsp;·&nbsp;229,943 PHRASES</span>
  </div>

  <div class="frame input-frame">
    <CalcInput bind:value />
  </div>

  <section class="grid" aria-live="polite">
    {#each calc.results as r (r.id)}
      <CipherValue id={r.id} name={r.name} total={r.total} hsl={r.hsl} />
    {/each}
    {#if calc.results.length === 0}
      <p class="empty dim">no ciphers enabled — check settings</p>
    {/if}
  </section>

  <Matches input={value} />
</div>

<style>
  .shell {
    max-width: 680px;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--line);
  }
  .status {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--line);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--signal);
    box-shadow: 0 0 6px var(--signal-glow);
    flex: none;
  }
  @media (prefers-reduced-motion: no-preference) {
    .dot {
      animation: pulse 2.2s ease-in-out infinite;
    }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
  .readout {
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .input-frame {
    padding: var(--space-1);
  }
  .grid {
    display: flex;
    flex-direction: column;
  }
  .empty {
    font-size: 0.85rem;
    padding: var(--space-3) 0;
  }
  @media (min-width: 720px) {
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: var(--space-5);
    }
  }
</style>
