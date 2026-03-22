<script>
  import Card from './Card.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { appState: state = $bindable(), calc } = $props();

  function addPostKsProduct(productId) {
    if (state.postKsSales.some(s => s.productId === productId)) return;
    const product = state.products.find(p => p.id === productId);
    const suggestedPrice = product ? Number(product.suggestedPrice) || 0 : 0;
    const msrp = Math.round(suggestedPrice * 1.15 * 100) / 100;
    state.postKsSales = [...state.postKsSales, {
      productId,
      msrp,
      wholesalePrice: Math.round(msrp / 2.5 * 100) / 100,
      directUnits: 0,
      wholesaleUnits: 0,
    }];
  }

  function removePostKsProduct(index) {
    state.postKsSales = state.postKsSales.filter((_, i) => i !== index);
  }

  // Filter to physical products only (weight > 0 or ppu > 0)
  let physicalProducts = $derived(state.products.filter(p => (Number(p.ppu) > 0 || Number(p.weight) > 0)));
</script>

<!-- Overage / Inventory -->
<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
  <Metric label="Overage Units" value={calc.overageUnits.toLocaleString()} sub="Print run minus physical backer units" variant="default" />
  <Metric label="Inventory Investment" value={fmt(calc.overageCost)} sub="Post-KS planned units x PPU" variant="warning" />
  <Metric label="Post-KS Units Planned" value={calc.totalPostKsUnits.toLocaleString()} sub={calc.totalPostKsUnits > calc.overageUnits ? 'Exceeds overage!' : 'Within overage'} variant={calc.totalPostKsUnits > calc.overageUnits ? 'danger' : 'success'} />
</div>

<!-- Post-KS Sales Planner -->
<div class="mb-5">
  <Card title="Post-KS Sales Planner">
    <p class="text-xs text-gray-mid mb-4">Select products you'll sell after the campaign. Set MSRP, wholesale price, and expected units per channel. Digital products are excluded.</p>

    {#if state.postKsSales.length > 0}
      <div class="overflow-x-auto mb-3">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b-2 border-gray-light/40">
              <th class="py-2 text-left text-xs font-semibold text-gray-mid">Product</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">PPU</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">MSRP ($)</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">Wholesale ($)</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">Direct Units</th>
              <th class="py-2 text-center text-xs font-semibold text-gray-mid">Wholesale Units</th>
              <th class="py-2 text-right text-xs font-semibold text-gray-mid">Direct Rev</th>
              <th class="py-2 text-right text-xs font-semibold text-gray-mid">Wholesale Rev</th>
              <th class="py-2 text-right text-xs font-semibold text-gray-mid">Total Rev</th>
              <th class="py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {#each calc.postKsSalesBreakdown as sale, i}
              <tr class="border-b border-gray-light/20 hover:bg-cream/50">
                <td class="py-2 font-medium text-purple">{sale.name}</td>
                <td class="py-2 text-center text-gray-mid">${sale.ppu.toFixed(2)}</td>
                <td class="py-2">
                  <input type="number" bind:value={state.postKsSales[i].msrp} min="0" step="1"
                    class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
                </td>
                <td class="py-2">
                  <input type="number" bind:value={state.postKsSales[i].wholesalePrice} min="0" step="1"
                    class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
                </td>
                <td class="py-2">
                  <input type="number" bind:value={state.postKsSales[i].directUnits} min="0" step="25"
                    class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
                </td>
                <td class="py-2">
                  <input type="number" bind:value={state.postKsSales[i].wholesaleUnits} min="0" step="25"
                    class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
                </td>
                <td class="py-2 text-right text-purple font-semibold">{fmtFull(sale.directRevenue)}</td>
                <td class="py-2 text-right text-purple font-semibold">{fmtFull(sale.wholesaleRevenue)}</td>
                <td class="py-2 text-right text-purple font-bold">{fmtFull(sale.totalRevenue)}</td>
                <td class="py-2 text-center">
                  <button onclick={() => removePostKsProduct(i)}
                    class="text-pink-hot hover:text-pink-hot/70 font-bold text-sm">X</button>
                </td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="font-bold border-t-2 border-gray-light/40">
              <td class="py-2" colspan="4">TOTALS</td>
              <td class="py-2 text-center">{calc.directUnitsSold.toLocaleString()}</td>
              <td class="py-2 text-center">{calc.wholesaleUnitsSold.toLocaleString()}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.directRevenue)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.wholesaleRevenue)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.totalPostKsRevenue)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    {/if}

    {#if physicalProducts.length > 0}
      <div class="flex flex-wrap gap-1">
        {#each physicalProducts.filter(p => !state.postKsSales.some(s => s.productId === p.id)) as product}
          <button
            onclick={() => addPostKsProduct(product.id)}
            class="px-2 py-1 text-[10px] font-medium rounded border border-purple/15 text-purple hover:bg-purple hover:text-white transition-colors"
          >
            + {product.name}
          </button>
        {/each}
      </div>
    {:else}
      <p class="text-xs text-gray-mid">Add physical products on the Products tab first.</p>
    {/if}

    <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-4 text-xs text-purple leading-relaxed">
      MSRP auto-suggests at product price + 15%. Wholesale auto-suggests at MSRP / 2.5. Both are editable. Only physical products are shown (digital products excluded).
    </div>
  </Card>
</div>

<!-- Inventory Recovery -->
{#if calc.overageUnits > 0}
  <Card title="Inventory Recovery Tracker">
    <p class="text-xs text-gray-mid mb-3">How much of your overage investment do you recover through post-KS sales?</p>
    {@const unitsRemaining = Math.max(0, calc.overageUnits - calc.totalPostKsUnits)}
    {@const recoveryPct = calc.overageCost > 0 ? Math.min(100, (calc.totalPostKsRevenue / calc.overageCost) * 100) : 0}

    <div class="w-full bg-gray-light/30 rounded-full h-6 mb-3 overflow-hidden">
      <div class="h-6 rounded-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white {recoveryPct >= 100 ? 'bg-green-600' : recoveryPct >= 50 ? 'bg-amber-500' : 'bg-pink-hot'}"
        style="width: {Math.max(8, recoveryPct)}%">
        {recoveryPct.toFixed(0)}%
      </div>
    </div>

    <div class="grid grid-cols-4 gap-3 text-center text-sm">
      <div>
        <div class="text-[10px] uppercase text-gray-mid">Invested</div>
        <div class="font-bold text-pink-hot">{fmt(calc.overageCost)}</div>
      </div>
      <div>
        <div class="text-[10px] uppercase text-gray-mid">Recovered</div>
        <div class="font-bold text-green-700">{fmt(calc.totalPostKsRevenue)}</div>
      </div>
      <div>
        <div class="text-[10px] uppercase text-gray-mid">Units Sold</div>
        <div class="font-bold text-purple">{calc.totalPostKsUnits.toLocaleString()}</div>
      </div>
      <div>
        <div class="text-[10px] uppercase text-gray-mid">Units Remaining</div>
        <div class="font-bold text-purple">{unitsRemaining.toLocaleString()}</div>
      </div>
    </div>
  </Card>
{/if}
