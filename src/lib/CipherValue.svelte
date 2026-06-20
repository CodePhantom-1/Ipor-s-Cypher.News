<script lang="ts">
  let {
    id,
    name,
    total,
    hsl,
  }: { id: string; name: string; total: number; hsl: [number, number, number] } = $props();
  const accent = $derived(`hsl(${hsl[0]} ${hsl[1]}% ${hsl[2]}%)`);
</script>

<div class="row">
  <span class="name dim">{name}</span>
  <span class="val" data-testid={`cipher-value-${id}`} style={`--accent:${accent}`}>{total}</span>
</div>

<style>
  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--line);
  }
  .name {
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .val {
    font-family: var(--font-display);
    font-size: 1.6rem;
    color: var(--accent);
    text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 35%, transparent);
  }
  @media (prefers-reduced-motion: no-preference) {
    .val {
      animation: flick 0.18s ease-out;
    }
  }
  @keyframes flick {
    from {
      opacity: 0.4;
      transform: translateY(-1px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
</style>
