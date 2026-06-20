<script lang="ts">
  import Calculator from './routes/Calculator.svelte';
  import { palette } from './stores/settings';
  import { get } from 'svelte/store';
  if (typeof document !== 'undefined') document.documentElement.dataset.palette = get(palette);
</script>

<Calculator />
