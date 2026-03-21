<script>
  import Card from './Card.svelte';
  import { fmt } from './utils.js';
  import productPresetsData from '../product-presets/products.json';

  let { state = $bindable(), genProductId } = $props();

  const productPresets = productPresetsData;

  function addProduct(preset) {
    state.products = [...state.products, {
      id: genProductId(),
      name: preset ? preset.name : 'New Product',
      ppu: preset ? preset.ppu : 0,
      weight: preset ? preset.weight : 0,
      suggestedPrice: preset ? preset.suggestedPrice : 0,
    }];
  }

  function removeProduct(index) {
    const removedId = state.products[index].id;
    state.products = state.products.filter((_, i) => i !== index);
    // Clean up tier references
    state.tiers.forEach(t => {
      t.products = (t.products || []).filter(tp => tp.productId !== removedId);
    });
  }

  // Check if a product is used in any tier
  function productUsedInTiers(productId) {
    return state.tiers.some(t => (t.products || []).some(tp => tp.productId === productId));
  }
</script>

<div class="mb-5">
  <Card title="Product Catalog">
    <p class="text-xs text-gray-mid mb-4">Define all products for this campaign. Each product has its own manufacturing cost (PPU), weight, and suggested retail price. Add products to tiers on the Campaign tab.</p>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-gray-light/40">
            <th class="py-2 text-left text-xs font-semibold text-gray-mid">Product Name</th>
            <th class="py-2 text-center text-xs font-semibold text-gray-mid">PPU ($)</th>
            <th class="py-2 text-center text-xs font-semibold text-gray-mid">Weight (lb)</th>
            <th class="py-2 text-center text-xs font-semibold text-gray-mid">Suggested Price ($)</th>
            <th class="py-2 text-center text-xs font-semibold text-gray-mid">In Tiers?</th>
            <th class="py-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {#each state.products as product, i}
            <tr class="border-b border-gray-light/20 hover:bg-cream/50">
              <td class="py-2">
                <input type="text" bind:value={product.name}
                  class="w-full px-2 py-1.5 border border-gray-light rounded text-sm focus:outline-none focus:border-purple" />
              </td>
              <td class="py-2">
                <input type="number" bind:value={product.ppu} min="0" step="0.25"
                  class="w-24 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
              </td>
              <td class="py-2">
                <input type="number" bind:value={product.weight} min="0" step="0.1"
                  class="w-24 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
              </td>
              <td class="py-2">
                <input type="number" bind:value={product.suggestedPrice} min="0" step="1"
                  class="w-24 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
              </td>
              <td class="py-2 text-center">
                {#if productUsedInTiers(product.id)}
                  <span class="text-xs font-semibold text-green-700">Yes</span>
                {:else}
                  <span class="text-xs text-gray-mid">No</span>
                {/if}
              </td>
              <td class="py-2 text-center">
                <button
                  onclick={() => removeProduct(i)}
                  class="text-pink-hot hover:text-pink-hot/70 font-bold text-sm"
                  title="Remove product"
                >X</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if state.products.length === 0}
      <div class="text-center py-6 text-gray-mid text-sm">No products defined. Add one from the presets below or create a blank one.</div>
    {/if}

    <div class="mt-3">
      <button
        onclick={() => addProduct(null)}
        class="px-4 py-2 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors"
      >
        + Add Blank Product
      </button>
    </div>
  </Card>
</div>

<Card title="Product Presets">
  <p class="text-xs text-gray-mid mb-3">Click a preset to add it to your product catalog. PPU and weight are based on industry averages at 500+ runs. Adjust after adding.</p>
  <div class="flex flex-wrap gap-2">
    {#each productPresets as preset}
      <button
        onclick={() => addProduct(preset)}
        class="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple/20 bg-white hover:bg-purple hover:text-white transition-colors"
      >
        {preset.name} <span class="opacity-60">${preset.ppu}</span>
      </button>
    {/each}
  </div>
  <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-4 text-xs text-purple leading-relaxed">
    PPU estimates assume 500+ print runs. Costs decrease significantly at higher volumes. Digital products (PDF, STL) have $0 PPU and weight.
  </div>
</Card>
