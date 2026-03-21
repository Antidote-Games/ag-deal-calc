<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import { fmt } from './utils.js';

  let { state = $bindable(), validations } = $props();

  let isPartner = $derived(state.projectType === 'partner');
  let totalFixed = $derived(Number(state.devCost) + Number(state.marketingCost));
  let antidoteFixed = $derived(totalFixed - (Number(state.creatorDevCost) || 0) - (Number(state.creatorMarketingCost) || 0));
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
  <Card title="Development & Marketing">
    <p class="text-xs text-gray-mid mb-3">Fixed costs — do not change with backer count.{isPartner ? ' Set total budget, then specify creator contribution below.' : ''}</p>
    <Slider label="Dev Cost (Total)" bind:value={state.devCost} min={0} max={200000} step={1000} format={(v) => fmt(v)} />
    {#if isPartner}
      <div class="ml-4 mb-4 pl-3 border-l-2 border-pink/30">
        <div class="flex items-center gap-2 mb-1">
          <label class="text-xs font-medium text-gray-mid flex-1">Creator Contribution
            <input type="number" bind:value={state.creatorDevCost} min="0" max={state.devCost} step="500"
              class="w-full px-2 py-1.5 border border-gray-light rounded text-sm focus:outline-none focus:border-purple" />
          </label>
        </div>
        <div class="text-xs text-gray-mid">Antidote: {fmt(Math.max(0, state.devCost - (Number(state.creatorDevCost) || 0)))}</div>
      </div>
    {/if}

    <Slider label="Marketing Cost (Total)" bind:value={state.marketingCost} min={0} max={300000} step={1000} format={(v) => fmt(v)} />
    {#if isPartner}
      <div class="ml-4 mb-4 pl-3 border-l-2 border-pink/30">
        <div class="flex items-center gap-2 mb-1">
          <label class="text-xs font-medium text-gray-mid flex-1">Creator Contribution
            <input type="number" bind:value={state.creatorMarketingCost} min="0" max={state.marketingCost} step="500"
              class="w-full px-2 py-1.5 border border-gray-light rounded text-sm focus:outline-none focus:border-purple" />
          </label>
        </div>
        <div class="text-xs text-gray-mid">Antidote: {fmt(Math.max(0, state.marketingCost - (Number(state.creatorMarketingCost) || 0)))}</div>
      </div>
    {/if}

    <div class="pt-3 border-t border-gray-light/40">
      {#if isPartner}
        <div class="grid grid-cols-2 gap-3 text-center">
          <div>
            <div class="text-xs uppercase text-gray-mid mb-1">Antidote Fronts</div>
            <div class="text-xl font-bold text-purple">{fmt(antidoteFixed)}</div>
          </div>
          <div>
            <div class="text-xs uppercase text-gray-mid mb-1">Creator Fronts</div>
            <div class="text-xl font-bold text-pink-hot">{fmt((Number(state.creatorDevCost) || 0) + (Number(state.creatorMarketingCost) || 0))}</div>
          </div>
        </div>
      {:else}
        <div class="text-xs uppercase text-gray-mid mb-1">Total Fixed Costs</div>
        <div class="text-xl font-bold text-purple">{fmt(totalFixed)}</div>
      {/if}
    </div>
  </Card>

  <Card title="Manufacturing & Fees">
    <p class="text-xs text-gray-mid mb-3">PPU per tier is auto-calculated from products assigned on the Campaign tab. Set print run and platform fees here.</p>
    <Slider label="Print Run (total units)" bind:value={state.printRun} min={100} max={25000} step={100} format={(v) => Number(v).toLocaleString()} />
    {#if validations.printRunLow}
      <div class="mt-2 text-xs text-pink-hot font-medium bg-pink-hot/10 rounded px-3 py-2">
        Print run ({Number(state.printRun).toLocaleString()}) is less than total backers ({Number(state.totalBackers).toLocaleString()}). You won't have enough units.
      </div>
    {/if}

    {@const overage = Math.max(0, state.printRun - state.totalBackers)}
    {@const postKsPlanned = (Number(state.wholesaleUnitsSold) || 0) + (Number(state.directUnitsSold) || 0)}
    {@const suggestedRun = state.totalBackers + postKsPlanned}
    {@const unallocated = overage - postKsPlanned}

    <div class="mt-2 mb-4 bg-cream rounded-lg p-3 text-xs">
      <div class="grid grid-cols-2 gap-x-4 gap-y-1">
        <span class="text-gray-mid">Backer units</span>
        <span class="text-right font-semibold text-purple">{Number(state.totalBackers).toLocaleString()}</span>
        <span class="text-gray-mid">Overage</span>
        <span class="text-right font-semibold text-purple">{overage.toLocaleString()}</span>
        {#if state.projectType === 'own' || state.supportContract}
          <span class="text-gray-mid">Post-KS planned</span>
          <span class="text-right font-semibold">{postKsPlanned.toLocaleString()} <span class="font-normal text-gray-mid">({Number(state.wholesaleUnitsSold).toLocaleString()}W + {Number(state.directUnitsSold).toLocaleString()}D)</span></span>
          <span class="text-gray-mid">Unallocated</span>
          <span class="text-right font-semibold {unallocated < 0 ? 'text-pink-hot' : unallocated === 0 ? 'text-green-700' : 'text-amber-600'}">{unallocated.toLocaleString()}{unallocated < 0 ? ' (short!)' : ''}</span>
        {:else}
          <span class="text-gray-mid">Overage owner</span>
          <span class="text-right font-semibold text-pink-hot">Creator's cost</span>
        {/if}
      </div>
      {#if state.projectType === 'own' || state.supportContract}
        <button
          onclick={() => state.printRun = suggestedRun}
          class="mt-2 w-full py-1.5 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors"
        >
          Match to post-KS plan ({suggestedRun.toLocaleString()} units)
        </button>
      {/if}
    </div>

    <Slider label="Platform Fee %" bind:value={state.platformFeeRate} min={0} max={15} step={0.5} format={(v) => Number(v).toFixed(1) + '%'} />
    <p class="text-xs text-gray-mid -mt-2">Kickstarter + payment processing. Industry standard ~8%.</p>
  </Card>
</div>
