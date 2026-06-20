<script lang="ts">
  let {
    id,
    name,
    total,
    hsl,
  }: { id: string; name: string; total: number; hsl: [number, number, number] } = $props();
  const accent = $derived(`color-mix(in srgb, var(--signal) 70%, hsl(${hsl[0]} 70% 50%) 30%)`);

  // scramble-and-lock: when the value changes, spin the digits like a
  // mechanical counter settling, then lock onto the real number.
  // animate only in a real browser that doesn't ask for reduced motion
  // (no matchMedia → jsdom/SSR → render the final value directly).
  const animate =
    typeof matchMedia !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target = $derived(String(total));
  let shown = $state(''); // populated by the effect on mount
  const settling = $derived(shown !== target);
  let timer: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    target; // track
    if (!animate) { shown = target; return; }
    if (timer) clearInterval(timer);
    const rand = () => String((Math.random() * 10) | 0);
    let ticks = 7; // ~7 frames of scrambling
    timer = setInterval(() => {
      if (ticks-- <= 0) {
        shown = target;
        if (timer) { clearInterval(timer); timer = null; }
        return;
      }
      // lock digits left-to-right as it settles for a "homing" feel
      const locked = target.length - Math.ceil((ticks / 7) * target.length);
      shown = target
        .split('')
        .map((d, i) => (i < locked ? d : rand()))
        .join('');
    }, 34);
    return () => { if (timer) clearInterval(timer); timer = null; };
  });
</script>

<div class="row">
  <span class="name dim">{name}</span>
  <span class="val" class:settling
        data-testid={`cipher-value-${id}`} style={`--accent:${accent}`}>{shown}</span>
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
    text-shadow: 0 0 10px color-mix(in srgb, var(--accent) 45%, transparent);
    transition: text-shadow 0.2s ease;
  }
  /* brighter, jittering glow while the counter is still spinning */
  .val.settling {
    text-shadow: 0 0 16px color-mix(in srgb, var(--accent) 75%, transparent);
    opacity: 0.92;
  }
</style>
