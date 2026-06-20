<div class="wm signal" style="font-family:var(--font-display); letter-spacing:.24em;">
  <span class="glitch" data-text="CYPHERS">CYPHERS</span><span class="cur">▋</span>
</div>

<style>
  .wm {
    font-weight: 700;
    font-size: 1.05rem;
    white-space: nowrap;
  }
  .glitch {
    position: relative;
    display: inline-block;
  }
  /* two offset RGB-split copies, clipped to bands, mostly idle */
  .glitch::before,
  .glitch::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    .glitch::before {
      color: #ff2e6e;
      animation: glitch-a 5.5s steps(1) infinite;
    }
    .glitch::after {
      color: #2effd0;
      animation: glitch-b 5.5s steps(1) infinite;
    }
    .cur { animation: blink 1.1s steps(1) infinite; }
  }
  /* the split only fires in a couple of brief windows per loop */
  @keyframes glitch-a {
    0%, 47%, 52%, 90%, 93%, 100% { transform: none; opacity: 0; }
    48% { transform: translate(-2px, -1px); clip-path: inset(0 0 62% 0); opacity: 0.9; }
    50% { transform: translate(2px, 1px); clip-path: inset(55% 0 0 0); opacity: 0.9; }
    91% { transform: translate(2px, 0); clip-path: inset(30% 0 40% 0); opacity: 0.9; }
  }
  @keyframes glitch-b {
    0%, 47%, 52%, 90%, 93%, 100% { transform: none; opacity: 0; }
    48% { transform: translate(2px, 1px); clip-path: inset(55% 0 0 0); opacity: 0.9; }
    50% { transform: translate(-2px, -1px); clip-path: inset(0 0 62% 0); opacity: 0.9; }
    91% { transform: translate(-2px, 0); clip-path: inset(30% 0 40% 0); opacity: 0.9; }
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
</style>
