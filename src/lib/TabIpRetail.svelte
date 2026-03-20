<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Metric from './Metric.svelte';
  import { fmt } from './utils.js';

  let { state = $bindable(), calc, validations } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
  <Card title="IP Licensing">
    <div class="mb-4">
      <label class="text-sm font-medium text-gray-mid block mb-1">IP Advance (upfront)
      <input type="number" bind:value={state.ipAdvance} min="0" step="1000"
        class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple" />
      </label>
    </div>
    <Slider label="IP Royalty Rate (% of sales)" bind:value={state.ipRoyaltyRate} min={0} max={10} step={0.5} format={(v) => Number(v).toFixed(1) + '%'} />
    <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-3 text-xs text-purple leading-relaxed">
      IP holder gets advance (upfront) + royalty (% of all sales). This does NOT reduce Jordan's commission — they are independent streams.
    </div>
  </Card>

  <Card title="Post-KS Retail">
    <div class="mb-4">
      <span class="text-sm font-medium text-gray-mid block mb-1">Extra Units Available</span>
      <div class="px-3 py-2 bg-cream rounded-lg font-bold text-purple text-sm">
        {Math.max(0, calc.extraUnits).toLocaleString()}
      </div>
    </div>
    <Slider label="Expected Units Sold (Year 1)" bind:value={state.retailUnitsSold} min={0} max={5000} step={50} format={(v) => Number(v).toLocaleString()} />
    {#if validations.retailExceedsExtra}
      <div class="mb-3 text-xs text-pink-hot font-medium bg-pink-hot/10 rounded px-3 py-2">
        Selling {Number(state.retailUnitsSold).toLocaleString()} units but only {Math.max(0, calc.extraUnits).toLocaleString()} available. You'd need a second print run.
      </div>
    {/if}
    <div class="mb-4">
      <label class="text-sm font-medium text-gray-mid block mb-1">Wholesale Price per Unit ($)
      <input type="number" bind:value={state.wholesalePrice} min="0" step="1"
        class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple" />
      </label>
    </div>
    <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 text-xs text-purple leading-relaxed">
      Wholesale = MSRP / 2.5 (e.g. $50 MSRP = $20 wholesale)
    </div>
  </Card>
</div>

<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
  <Metric label="KS IP Royalty" value={fmt(calc.ipRoyaltyKS)} sub="{Number(state.ipRoyaltyRate).toFixed(1)}% of KS revenue" variant="warning" />
  <Metric label="Retail Revenue (Year 1)" value={fmt(calc.retailRevenue)} sub="{Number(state.retailUnitsSold).toLocaleString()} units @ wholesale" variant="success" />
  <Metric label="Retail IP Royalty" value={fmt(calc.retailIPRoyalty)} sub="{Number(state.ipRoyaltyRate).toFixed(1)}% of retail revenue" variant="warning" />
  <Metric label="Retail Margin" value={fmt(calc.retailMargin)} sub="Mfg already paid in KS run" variant="success" />
  <Metric label="Total IP Costs (Year 1)" value={fmt(calc.totalIPCost)} sub="Advance + all royalties" variant="danger" />
</div>
