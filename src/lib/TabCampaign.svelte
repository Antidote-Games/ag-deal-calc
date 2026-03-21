<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import { fmt } from './utils.js';

  let { state = $bindable(), validations, tierPpu, tierWeight, tierSuggestedPrice } = $props();

  function distribute(mode) {
    const n = state.tiers.length;
    if (n === 0) return;
    let weights;
    if (mode === 'even') {
      weights = state.tiers.map(() => 1);
    } else if (mode === 'low') {
      weights = state.tiers.map((_, i) => Math.pow(0.4, i));
    } else {
      weights = state.tiers.map((_, i) => Math.pow(0.55, n - 1 - i));
    }
    const total = weights.reduce((s, w) => s + w, 0);
    const pcts = weights.map(w => Math.round((w / total) * 100));
    const diff = 100 - pcts.reduce((s, p) => s + p, 0);
    pcts[0] += diff;
    state.tiers.forEach((t, i) => t.pct = pcts[i]);
  }

  function addAddon(productId) {
    const existing = state.addons.find(a => a.productId === productId);
    if (existing) return;
    const product = state.products.find(p => p.id === productId);
    state.addons = [...state.addons, {
      productId,
      price: product ? Number(product.suggestedPrice) || 0 : 0,
      attachRate: 20,
      shippingCost: (product && Number(product.weight) > 0) ? 2 : 0,
    }];
  }

  function removeAddon(index) {
    state.addons = state.addons.filter((_, i) => i !== index);
  }

  function addProductToTier(tierIndex, productId) {
    const tier = state.tiers[tierIndex];
    const existing = tier.products.find(tp => tp.productId === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      tier.products = [...tier.products, { productId, qty: 1 }];
    }
  }

  function removeProductFromTier(tierIndex, tpIndex) {
    state.tiers[tierIndex].products = state.tiers[tierIndex].products.filter((_, i) => i !== tpIndex);
  }

  function autoPrice(tierIndex) {
    state.tiers[tierIndex].price = tierSuggestedPrice(state.tiers[tierIndex]);
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
  <Card title="Project">
    <label class="text-sm font-medium text-gray-mid block mb-3">Campaign Name
      <input type="text" bind:value={state.projectName}
        class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple" />
    </label>

    <div class="mb-3">
      <div class="text-sm font-medium text-gray-mid mb-2">Project Type</div>
      <div class="flex gap-2">
        <button
          class="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors {state.projectType === 'own' ? 'bg-purple text-white' : 'bg-cream text-gray-mid border border-gray-light/30 hover:border-purple'}"
          onclick={() => state.projectType = 'own'}
        >
          Own Title
        </button>
        <button
          class="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors {state.projectType === 'partner' ? 'bg-purple text-white' : 'bg-cream text-gray-mid border border-gray-light/30 hover:border-purple'}"
          onclick={() => state.projectType = 'partner'}
        >
          Partner Project
        </button>
      </div>
      <p class="text-xs text-gray-mid mt-2">
        {#if state.projectType === 'own'}
          Antidote's own game. All profit belongs to Antidote (minus any deal partner commission).
        {:else}
          Supporting a creator's release. Antidote fronts costs, gets reimbursed, then splits profit with the creator.
        {/if}
      </p>
    </div>
  </Card>

  <Card title={state.projectType === 'partner' ? 'Partnership Terms' : 'Backers'}>
    {#if state.projectType === 'partner'}
      <Slider label="Antidote Profit Share %" bind:value={state.antidoteProfitPct} min={1} max={99} step={1} format={(v) => v + '%'} />
      <div class="grid grid-cols-2 gap-3 text-center mb-4">
        <div class="bg-cream rounded-lg p-2">
          <div class="text-[10px] uppercase text-gray-mid">Antidote</div>
          <div class="text-lg font-bold text-purple">{state.antidoteProfitPct}%</div>
        </div>
        <div class="bg-cream rounded-lg p-2">
          <div class="text-[10px] uppercase text-gray-mid">Creator</div>
          <div class="text-lg font-bold text-pink-hot">{100 - state.antidoteProfitPct}%</div>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" bind:checked={state.supportContract} class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-light rounded-full peer peer-checked:bg-purple transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
        <span class="text-sm font-medium text-gray-mid">Long-term support contract</span>
      </div>
      <p class="text-xs text-gray-mid mb-4">
        {#if state.supportContract}
          Antidote handles post-KS sales (website, conventions, retail). Revenue splits at the same rate.
        {:else}
          Creator handles their own post-KS sales. Overage is the creator's cost.
        {/if}
      </p>

      <Slider label="Total Backers" bind:value={state.totalBackers} min={100} max={20000} step={50} format={(v) => Number(v).toLocaleString()} />
    {:else}
      <Slider label="Total Backers" bind:value={state.totalBackers} min={100} max={20000} step={50} format={(v) => Number(v).toLocaleString()} />
    {/if}
  </Card>
</div>

<Card title="Pledge Tier Structure">
  <p class="text-xs text-gray-mid mb-4">Define tiers and assign products from your catalog. PPU and weight auto-calculate from products. Price can be set manually or auto-filled from suggested prices.</p>

  {#if validations.tierPctOff}
    <div class="mb-4 text-xs text-pink-hot font-medium bg-pink-hot/10 rounded px-3 py-2">
      Tier percentages add to {validations.tierPctTotal}% — must equal 100%.
    </div>
  {/if}

  <div class="flex items-center gap-2 mb-3">
    <span class="text-xs font-semibold text-gray-mid uppercase">Distribute:</span>
    <button onclick={() => distribute('low')}
      class="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple/20 bg-white hover:bg-purple hover:text-white transition-colors">
      Low-Heavy (Realistic)
    </button>
    <button onclick={() => distribute('high')}
      class="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple/20 bg-white hover:bg-purple hover:text-white transition-colors">
      High-Heavy (Optimistic)
    </button>
    <button onclick={() => distribute('even')}
      class="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple/20 bg-white hover:bg-purple hover:text-white transition-colors">
      Even
    </button>
  </div>

  {#each state.tiers as tier, i}
    <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-light/30 mb-3">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-xs font-bold text-purple">#{i + 1}{i === 0 ? ' (Base)' : ''}</span>
        <input type="text" bind:value={tier.name} placeholder="Tier name"
          class="flex-1 px-2 py-1.5 border border-gray-light rounded text-sm font-semibold focus:outline-none focus:border-purple" />
        {#if state.tiers.length > 1}
          <button onclick={() => state.tiers = state.tiers.filter((_, idx) => idx !== i)}
            class="text-pink-hot hover:text-pink-hot/70 font-bold text-sm" title="Remove tier">X</button>
        {/if}
      </div>

      <div class="grid grid-cols-5 gap-3 mb-3">
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Price ($)</div>
          <div class="flex gap-1">
            <input type="number" bind:value={tier.price} min="0" step="1"
              class="w-full px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
            <button onclick={() => autoPrice(i)} class="px-2 py-1 text-[10px] font-semibold rounded border border-purple/20 text-purple hover:bg-purple hover:text-white transition-colors" title="Auto-fill from product prices">Auto</button>
          </div>
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">% Backers</div>
          <input type="number" bind:value={tier.pct} min="0" max="100" step="1"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Shipping ($)</div>
          <input type="number" bind:value={tier.shippingCost} min="0" step="0.5"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">PPU (auto)</div>
          <div class="px-2 py-1.5 bg-cream rounded text-sm text-center font-bold text-purple">${tierPpu(tier).toFixed(2)}</div>
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Backers</div>
          <div class="px-2 py-1.5 bg-cream rounded text-sm text-center font-bold text-purple">{Math.round(state.totalBackers * (tier.pct / 100)).toLocaleString()}</div>
        </div>
      </div>

      <!-- Products in this tier -->
      <div class="text-[10px] uppercase text-gray-mid mb-1">Products in this tier</div>
      {#if tier.products && tier.products.length > 0}
        <div class="flex flex-wrap gap-2 mb-2">
          {#each tier.products as tp, tpIdx}
            {@const product = state.products.find(p => p.id === tp.productId)}
            {#if product}
              <div class="flex items-center gap-1 bg-cream rounded-lg px-2 py-1 text-xs border border-gray-light/30">
                <input type="number" bind:value={tp.qty} min="1" step="1"
                  class="w-10 px-1 py-0.5 border border-gray-light rounded text-xs text-center focus:outline-none focus:border-purple" />
                <span class="font-medium text-purple">x {product.name}</span>
                <span class="text-gray-mid">(${product.ppu}/ea)</span>
                <button onclick={() => removeProductFromTier(i, tpIdx)}
                  class="ml-1 text-pink-hot hover:text-pink-hot/70 font-bold">x</button>
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <div class="text-xs text-gray-mid mb-2">No products assigned. Add from your catalog below.</div>
      {/if}

      {#if state.products.length > 0}
        <div class="flex flex-wrap gap-1">
          {#each state.products as product}
            <button
              onclick={() => addProductToTier(i, product.id)}
              class="px-2 py-1 text-[10px] font-medium rounded border border-purple/15 text-purple hover:bg-purple hover:text-white transition-colors"
            >
              + {product.name}
            </button>
          {/each}
        </div>
      {:else}
        <p class="text-xs text-pink-hot">No products defined. Go to the Products tab to add some.</p>
      {/if}
    </div>
  {/each}

  <div class="flex items-center justify-between mt-3">
    <button
      onclick={() => state.tiers = [...state.tiers, { name: `Tier ${state.tiers.length + 1}`, products: [], price: 0, pct: 0, shippingCost: 0 }]}
      class="px-4 py-2 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors"
    >
      + Add Tier
    </button>
    <div class="text-xs text-gray-mid">
      Weight: auto-calculated from products. Shipping: set manually based on weight and destination.
    </div>
  </div>
</Card>

<div class="mt-5">
  <Card title="Addons">
    <p class="text-xs text-gray-mid mb-4">Products backers can add to any tier. Set a price and expected attach rate (% of backers who add it). Revenue and costs auto-calculate.</p>

    {#if state.addons.length > 0}
      <div class="overflow-x-auto mb-3">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b-2 border-gray-light/40">
              <th class="py-2 text-left text-xs font-semibold text-gray-mid">Product</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">Price ($)</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">PPU ($)</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">Attach Rate (%)</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">Ship ($)</th>
              <th class="py-2 text-right text-xs font-semibold text-gray-mid">Est. Units</th>
              <th class="py-2 text-right text-xs font-semibold text-gray-mid">Est. Revenue</th>
              <th class="py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {#each state.addons as addon, i}
              {@const product = state.products.find(p => p.id === addon.productId)}
              {@const units = Math.round(state.totalBackers * ((Number(addon.attachRate) || 0) / 100))}
              <tr class="border-b border-gray-light/20 hover:bg-cream/50">
                <td class="py-2 font-medium text-purple">{product?.name || '?'}</td>
                <td class="py-2">
                  <input type="number" bind:value={addon.price} min="0" step="1"
                    class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
                </td>
                <td class="py-2 text-center text-gray-mid">${product ? Number(product.ppu).toFixed(2) : '0.00'}</td>
                <td class="py-2">
                  <input type="number" bind:value={addon.attachRate} min="0" max="100" step="5"
                    class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
                </td>
                <td class="py-2">
                  <input type="number" bind:value={addon.shippingCost} min="0" step="0.5"
                    class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
                </td>
                <td class="py-2 text-right font-semibold text-purple">{units.toLocaleString()}</td>
                <td class="py-2 text-right font-semibold text-purple">{fmt(units * (Number(addon.price) || 0))}</td>
                <td class="py-2 text-center">
                  <button onclick={() => removeAddon(i)}
                    class="text-pink-hot hover:text-pink-hot/70 font-bold text-sm">X</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if state.products.length > 0}
      <div class="flex flex-wrap gap-1">
        {#each state.products.filter(p => !state.addons.some(a => a.productId === p.id)) as product}
          <button
            onclick={() => addAddon(product.id)}
            class="px-2 py-1 text-[10px] font-medium rounded border border-purple/15 text-purple hover:bg-purple hover:text-white transition-colors"
          >
            + {product.name}
          </button>
        {/each}
      </div>
    {:else}
      <p class="text-xs text-gray-mid">Add products on the Products tab first, then add them as addons here.</p>
    {/if}

    <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-4 text-xs text-purple leading-relaxed">
      Attach rate = % of total backers who add this product. A backer on the $15 PDF tier might add a $20 t-shirt and a $5 sticker pack. Addon revenue and costs are included in KS totals.
    </div>
  </Card>
</div>
