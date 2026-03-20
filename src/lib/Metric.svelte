<script>
  let { label, value, sub = '', variant = 'default' } = $props();

  const borderClass = {
    success: 'border-l-4 border-l-green-500',
    warning: 'border-l-4 border-l-amber-400',
    danger: 'border-l-4 border-l-pink-hot',
    default: 'border-l-4 border-l-gray-light',
  };
</script>

<div class="bg-white rounded-xl shadow-sm p-5 {borderClass[variant] || borderClass.default}">
  <div class="text-[11px] uppercase tracking-wider text-gray-mid mb-2">{label}</div>
  <div class="text-2xl font-bold text-purple">{value}</div>
  {#if sub}
    <div class="text-xs text-gray-mid mt-1">{sub}</div>
  {/if}
</div>
