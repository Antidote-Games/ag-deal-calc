<script>
  let { label, value = $bindable(), min, max, step = 1, format = (v) => v } = $props();
</script>

<div class="mb-4">
  <div class="flex justify-between items-center mb-1">
    <span class="text-sm font-medium text-gray-mid">{label}</span>
    <span class="text-sm font-bold text-purple">{format(value)}</span>
  </div>
  <input type="range" bind:value {min} {max} {step} aria-label={label} />
</div>
