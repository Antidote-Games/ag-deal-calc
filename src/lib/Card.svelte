<script>
  let { title, children } = $props();
</script>

<div class="bg-white rounded-xl shadow-sm p-5 border border-gray-light/30">
  {#if title}
    <h2 class="text-base font-bold text-purple mb-4 pb-2 border-b border-gray-light/40">{title}</h2>
  {/if}
  {@render children()}
</div>
