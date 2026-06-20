<script lang="ts">
  let { value = $bindable('') }: { value?: string } = $props();
</script>

<textarea
  class="input"
  bind:value
  rows="2"
  spellcheck="false"
  autocomplete="off"
  placeholder="type a word or phrase…"
  aria-label="phrase to decode"
></textarea>

<style>
  .input {
    width: 100%;
    resize: vertical;
    background: var(--bg-panel);
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    font-family: var(--font-mono);
    font-size: 1.1rem;
    padding: var(--space-4);
    caret-color: var(--signal);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .input::placeholder {
    color: var(--ink-dim);
  }
  .input:focus {
    outline: none;
    border-color: var(--signal-dim);
    box-shadow: 0 0 0 1px var(--signal-dim), 0 0 16px var(--signal-glow);
  }
  @media (prefers-reduced-motion: reduce) {
    .input {
      transition: none;
    }
  }
</style>
