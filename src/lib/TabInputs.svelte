<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import { fmt } from './utils.js';

  let { state = $bindable(), validations } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
  <Card title="Dev & Marketing">
    <p class="text-xs text-gray-mid mb-3">Fixed costs — do not change with quantity ordered.</p>
    <Slider label="Dev Cost" bind:value={state.devCost} min={0} max={150000} step={5000} format={(v) => fmt(v)} />
    <Slider label="Marketing Cost" bind:value={state.marketingCost} min={0} max={200000} step={5000} format={(v) => fmt(v)} />
    <div class="mt-3 pt-3 border-t border-gray-light/40">
      <div class="text-xs uppercase text-gray-mid mb-1">Total Investment</div>
      <div class="text-xl font-bold text-purple">{fmt(state.devCost + state.marketingCost)}</div>
    </div>
  </Card>

  <Card title="Manufacturing">
    <p class="text-xs text-gray-mid mb-3">PPU is the base cost for Tier 1. Higher tiers add 50% of the price premium as additional cost.</p>
    <Slider label="PPU (per-unit cost)" bind:value={state.ppu} min={1} max={15} step={0.25} format={(v) => '$' + Number(v).toFixed(2)} />
    <Slider label="Print Run (total units)" bind:value={state.printRun} min={100} max={10000} step={100} format={(v) => Number(v).toLocaleString()} />
    {#if validations.printRunLow}
      <div class="mt-2 text-xs text-pink-hot font-medium bg-pink-hot/10 rounded px-3 py-2">
        Print run ({Number(state.printRun).toLocaleString()}) is less than total backers ({Number(state.totalBackers).toLocaleString()}). You won't have enough units.
      </div>
    {/if}
    <div class="text-xs text-gray-mid mt-3">
      {Number(state.totalBackers).toLocaleString()} backers + {Math.max(0, state.printRun - state.totalBackers).toLocaleString()} extra for retail
    </div>
  </Card>

  <Card title="Backers & Commission">
    <Slider label="Total Backers" bind:value={state.totalBackers} min={100} max={10000} step={50} format={(v) => Number(v).toLocaleString()} />
    <div class="mb-4">
      <label class="text-sm font-medium text-gray-mid block mb-1">Jordan's Phase
      <select bind:value={state.commissionMode} class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple">
        <option value="phase1">Phase 1 - 20% of KS Profit</option>
        <option value="phase2">Phase 2 - 18% of KS Profit</option>
        <option value="jordan-agr">Jordan's Ask - 10% of Adj. Gross Revenue</option>
      </select>
      </label>
    </div>
  </Card>
</div>

<Card title="Pledge Tier Structure">
  <p class="text-xs text-gray-mid mb-4">Define tier prices and backer distribution. Must add to 100%.</p>

  {#if validations.tierPctOff}
    <div class="mb-4 text-xs text-pink-hot font-medium bg-pink-hot/10 rounded px-3 py-2">
      Tier percentages add to {validations.tierPctTotal}% — must equal 100%.
    </div>
  {/if}

  <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
    {#each state.tiers as tier, i}
      <div class="bg-cream rounded-lg p-3 border border-gray-light/30">
        <div class="text-xs font-bold text-purple uppercase mb-2">Tier {i + 1}</div>
        <label class="text-[10px] uppercase text-gray-mid">Price ($)
        <input type="number" bind:value={tier.price} min="0" step="1"
          class="w-full px-2 py-1.5 border border-gray-light rounded text-sm mb-2 focus:outline-none focus:border-purple" />
        </label>
        <label class="text-[10px] uppercase text-gray-mid">% Backers
        <input type="number" bind:value={tier.pct} min="0" max="100" step="1"
          class="w-full px-2 py-1.5 border border-gray-light rounded text-sm mb-2 focus:outline-none focus:border-purple" />
        </label>
        <div class="text-[10px] uppercase text-gray-mid">Backers</div>
        <div class="bg-white rounded px-2 py-1.5 text-sm font-bold text-purple text-center">
          {Math.round(state.totalBackers * (tier.pct / 100))}
        </div>
      </div>
    {/each}
  </div>
</Card>
