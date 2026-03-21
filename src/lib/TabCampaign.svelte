<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';

  let { state = $bindable(), validations } = $props();

  function distribute(mode) {
    const n = state.tiers.length;
    if (n === 0) return;
    let weights;
    if (mode === 'even') {
      weights = state.tiers.map(() => 1);
    } else if (mode === 'low') {
      // Exponential decay — heavily bottom-weighted
      weights = state.tiers.map((_, i) => Math.pow(0.4, i));
    } else {
      // High-heavy — inverted curve weighted toward top tiers
      weights = state.tiers.map((_, i) => Math.pow(0.55, n - 1 - i));
    }
    const total = weights.reduce((s, w) => s + w, 0);
    const pcts = weights.map(w => Math.round((w / total) * 100));
    // Fix rounding to hit exactly 100
    const diff = 100 - pcts.reduce((s, p) => s + p, 0);
    pcts[0] += diff;
    state.tiers.forEach((t, i) => t.pct = pcts[i]);
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
  <p class="text-xs text-gray-mid mb-4">Define tier names, prices, backer distribution, and per-tier shipping cost. Percentages must add to 100%.</p>

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

  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b-2 border-gray-light/40">
          <th class="py-2 text-left text-xs font-semibold text-gray-mid w-8">#</th>
          <th class="py-2 text-left text-xs font-semibold text-gray-mid">Name</th>
          <th class="py-2 text-center text-xs font-semibold text-gray-mid">Price ($)</th>
          <th class="py-2 text-center text-xs font-semibold text-gray-mid">% Backers</th>
          <th class="py-2 text-center text-xs font-semibold text-gray-mid">Shipping ($)</th>
          <th class="py-2 text-right text-xs font-semibold text-gray-mid">Backers</th>
          <th class="py-2 w-8"></th>
        </tr>
      </thead>
      <tbody>
        {#each state.tiers as tier, i}
          <tr class="border-b border-gray-light/20 hover:bg-cream/50">
            <td class="py-2 text-xs font-bold text-purple">{i + 1}{i === 0 ? '*' : ''}</td>
            <td class="py-2">
              <input type="text" bind:value={tier.name} placeholder="Tier {i + 1}"
                class="w-full px-2 py-1.5 border border-gray-light rounded text-sm focus:outline-none focus:border-purple" />
            </td>
            <td class="py-2">
              <input type="number" bind:value={tier.price} min="0" step="1"
                class="w-24 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
            </td>
            <td class="py-2">
              <input type="number" bind:value={tier.pct} min="0" max="100" step="1"
                class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
            </td>
            <td class="py-2">
              <input type="number" bind:value={tier.shippingCost} min="0" step="0.5"
                class="w-24 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
            </td>
            <td class="py-2 text-right font-bold text-purple">
              {Math.round(state.totalBackers * (tier.pct / 100)).toLocaleString()}
            </td>
            <td class="py-2 text-center">
              {#if state.tiers.length > 1}
                <button
                  onclick={() => state.tiers = state.tiers.filter((_, idx) => idx !== i)}
                  class="text-pink-hot hover:text-pink-hot/70 font-bold text-sm"
                  title="Remove tier"
                >X</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="flex items-center justify-between mt-3">
    <button
      onclick={() => state.tiers = [...state.tiers, { name: `Tier ${state.tiers.length + 1}`, price: 0, pct: 0, shippingCost: 0 }]}
      class="px-4 py-2 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors"
    >
      + Add Tier
    </button>
    <div class="text-xs text-gray-mid">
      * Tier 1 is the base product — its price sets the PPU baseline and MSRP.
    </div>
  </div>
</Card>
