<script lang="ts">
  import { onMount } from 'svelte';

  // The Decoder's Wall — a drifting field of digits behind everything.
  // Occasionally a column "locks" onto one of the values currently on
  // screen and holds it, glowing, like the machine fixating on a number.
  let { fixate = [] as number[] }: { fixate?: number[] } = $props();

  let canvas: HTMLCanvasElement;
  // keep latest fixate visible to the rAF loop without re-subscribing
  let fixateRef: number[] = [];
  $effect(() => { fixateRef = fixate.filter((n) => Number.isFinite(n) && n > 0); });

  onMount(() => {
    const ctx = canvas?.getContext('2d', { alpha: true })!;
    if (!ctx || typeof matchMedia === 'undefined') return; // no canvas (jsdom/SSR)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');

    // signal colour, re-read on palette change
    let rgb: [number, number, number] = [65, 255, 160];
    const readSignal = () => {
      const hex = getComputedStyle(document.documentElement)
        .getPropertyValue('--signal').trim();
      const m = /^#?([0-9a-f]{6})$/i.exec(hex);
      if (m) {
        const n = parseInt(m[1], 16);
        rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      }
    };
    readSignal();
    const paletteObs = new MutationObserver(readSignal);
    paletteObs.observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-palette'],
    });

    const CELL = 16;            // px between glyphs
    let dpr = 1, cols = 0, rows = 0, cssW = 0, cssH = 0;
    let drops: number[] = [];   // head row per column (fractional)
    let speed: number[] = [];
    let lock: (null | { text: string; ttl: number })[] = [];

    // best viewport estimate — take the larger of the element rect and the
    // window, so a momentarily-0 iframe/preview mount can't pin us at 1px.
    function measure(): [number, number] {
      const r = canvas.getBoundingClientRect();
      return [
        Math.max(1, Math.round(r.width), window.innerWidth || 0),
        Math.max(1, Math.round(r.height), window.innerHeight || 0),
      ];
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const [w, h] = measure();
      cssW = w; cssH = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CELL - 3}px "IBM Plex Mono", monospace`;
      ctx.textBaseline = 'top';
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      drops = Array.from({ length: cols }, () => -Math.random() * rows);
      speed = Array.from({ length: cols }, () => 0.25 + Math.random() * 0.45);
      lock = Array.from({ length: cols }, () => null);
    }
    resize();

    const glyph = () => String.fromCharCode(48 + ((Math.random() * 10) | 0)); // 0-9

    function staticFrame() {
      // reduced-motion: one faint, calm field, no animation.
      // re-fit first — no rAF loop here to self-heal a 0-width mount.
      const [w, h] = measure();
      if (Math.abs(w - cssW) > CELL || Math.abs(h - cssH) > CELL) resize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.06)`;
      for (let x = 0; x < cols; x++)
        for (let y = 0; y < rows; y += 2)
          if (Math.random() > 0.6)
            ctx.fillText(glyph(), x * CELL, y * CELL);
    }

    let raf = 0, last = 0;
    function frame(t: number) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (t - last < 55) return;   // ~18fps: atmospheric + battery-kind
      last = t;

      // self-heal: if the viewport has since grown past our last sizing
      // (common when an iframe/preview mounts at ~0 width), re-fit.
      const [w, h] = measure();
      if (Math.abs(w - cssW) > CELL || Math.abs(h - cssH) > CELL) resize();

      // trailing fade over near-black bg
      ctx.fillStyle = 'rgba(7,9,10,0.18)';
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      for (let x = 0; x < cols; x++) {
        const px = x * CELL;
        const head = drops[x];

        if (lock[x]) {
          // a locked column: render the fixated number vertically, glowing
          const L = lock[x]!;
          for (let i = 0; i < L.text.length; i++) {
            const py = (Math.floor(head) - L.text.length + i) * CELL;
            if (py < -CELL || py > rows * CELL) continue;
            const lead = i === L.text.length - 1;
            ctx.fillStyle = lead
              ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`
              : `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.55)`;
            ctx.shadowColor = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.8)`;
            ctx.shadowBlur = lead ? 10 : 4;
            ctx.fillText(L.text[i], px, py);
          }
          ctx.shadowBlur = 0;
          if (--L.ttl <= 0) lock[x] = null;
        } else {
          // ordinary rain: bright leading glyph, dim trail char
          const hy = Math.floor(head) * CELL;
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.85)`;
          ctx.fillText(glyph(), px, hy);
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.18)`;
          ctx.fillText(glyph(), px, hy - CELL);
        }

        drops[x] += speed[x];
        if (drops[x] * CELL > rows * CELL + CELL) {
          drops[x] = -Math.random() * 6;
          // chance to fixate on a live on-screen value
          if (!lock[x] && fixateRef.length && Math.random() < 0.22) {
            const v = fixateRef[(Math.random() * fixateRef.length) | 0];
            lock[x] = { text: String(v), ttl: 26 + ((Math.random() * 20) | 0) };
          }
        }
      }
    }

    function start() {
      cancelAnimationFrame(raf);
      if (reduce.matches) { staticFrame(); return; }
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    start();

    const onResize = () => { resize(); start(); };
    // observe the canvas itself — fires on the real mount size and any change,
    // unlike window 'resize' which can miss iframe/preview sizing
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    window.addEventListener('resize', onResize, { passive: true });
    reduce.addEventListener('change', start);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      reduce.removeEventListener('change', start);
      paletteObs.disconnect();
    };
  });
</script>

<canvas bind:this={canvas} class="rain" aria-hidden="true"></canvas>

<style>
  .rain {
    position: fixed;
    inset: 0;
    width: 100%;   /* canvas is a replaced element — inset:0 alone won't stretch it */
    height: 100%;
    z-index: -1;
    pointer-events: none;
    opacity: 0.42;
    /* mask: densest at edges, clearer behind the centre column of content */
    -webkit-mask-image: radial-gradient(
      ellipse 52% 60% at 50% 42%, transparent 0%, rgba(0,0,0,0.55) 55%, #000 100%);
    mask-image: radial-gradient(
      ellipse 52% 60% at 50% 42%, transparent 0%, rgba(0,0,0,0.55) 55%, #000 100%);
  }
</style>
