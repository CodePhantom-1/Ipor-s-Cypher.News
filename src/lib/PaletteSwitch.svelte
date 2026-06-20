<script lang="ts">
  import { palette, type Palette } from '../stores/settings';
  const opts: Palette[] = ['green', 'amber', 'cyan'];
  function set(p: Palette) {
    palette.set(p);
    document.documentElement.dataset.palette = p;
  }
</script>

<div class="ps">
  {#each opts as p}
    <button class:active={$palette === p} onclick={() => set(p)} aria-label={`${p} palette`}>{p}</button>
  {/each}
</div>

<style>
  .ps {
    display: flex;
    gap: var(--space-1);
  }
  button {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: transparent;
    color: var(--ink-dim);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 2px 8px;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  button:hover {
    color: var(--ink);
    border-color: var(--signal-dim);
  }
  button.active {
    color: var(--signal);
    border-color: var(--signal-dim);
    box-shadow: 0 0 8px var(--signal-glow);
  }
  @media (prefers-reduced-motion: reduce) {
    button {
      transition: none;
    }
  }
</style>
