<script lang="ts">
  let palette = $state("green");
  $effect(() => { document.documentElement.dataset.palette = palette; });
</script>
<main style="padding: var(--space-6); max-width: 720px; margin: 0 auto;">
  <h1 class="signal" style="font-family: var(--font-display); letter-spacing: .2em;">CYPHERS</h1>
  <p class="dim">phosphor decoder — design tokens</p>
  <div class="signal" style="font-family: var(--font-display); font-size: 4rem;">137</div>
  <div style="display:flex; gap: var(--space-2);">
    {#each ["green","amber","cyan"] as p}
      <button onclick={() => palette = p}
        style="font-family: var(--font-mono); background: var(--bg-elevated); color: var(--ink); border: 1px solid var(--line); border-radius: var(--radius); padding: var(--space-2) var(--space-3);">{p}</button>
    {/each}
  </div>
</main>
