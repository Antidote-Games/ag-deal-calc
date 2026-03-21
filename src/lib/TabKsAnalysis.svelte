<script>
  import Card from './Card.svelte';
  import Metric from './Metric.svelte';
  import Slider from './Slider.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { state: inputState = $bindable(), calc } = $props();

  let sensitivityPct = $state(100);

  // Recalculate key metrics at adjusted backer count
  let sensitivity = $derived(() => {
    const adjBackers = Math.round(inputState.totalBackers * (sensitivityPct / 100));
    if (adjBackers === 0) return { backers: 0, revenue: 0, costs: 0, profit: 0 };

    const ratio = adjBackers / (inputState.totalBackers || 1);
    const adjRevenue = calc.ksRevenue * ratio;
    const adjBkrMfg = calc.backerMfgCost * ratio;
    const adjPlatform = adjRevenue * (Number(inputState.platformFeeRate) / 100);
    const adjShipping = calc.shippingCost * ratio;
    const adjCosts = calc.devCost + calc.marketingCost + calc.ipAdvance + adjBkrMfg + adjPlatform + adjShipping;
    const adjProfit = adjRevenue - adjCosts;
    return { backers: adjBackers, revenue: adjRevenue, costs: adjCosts, profit: adjProfit };
  });
</script>

<!-- Key Metrics -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
  <Metric label="KS Revenue" value={fmt(calc.ksRevenue)} sub="Avg pledge: ${calc.avgPledge.toFixed(2)}" variant="success" />
  <Metric label="Total KS Costs" value={fmt(calc.ksCosts)} variant="default" />
  <Metric label="KS Profit" value={fmt(calc.ksProfit)} sub={calc.ksProfit > 0 ? 'Campaign is profitable' : 'SHORTFALL'} variant={calc.ksProfit > 0 ? 'success' : 'danger'} />
  <Metric label="Break-Even" value={calc.breakEvenBackers === Infinity ? 'N/A' : calc.breakEvenBackers.toLocaleString() + ' backers'} sub={calc.breakEvenBackers <= inputState.totalBackers ? 'Below target — good' : 'Above target — risky'} variant={calc.breakEvenBackers <= inputState.totalBackers ? 'success' : 'danger'} />
</div>

<!-- Cost Breakdown -->
<div class="mb-5">
  <Card title="KS Cost Breakdown (6 Deductions)">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-gray-light/40">
            <th class="py-2 text-left text-xs font-semibold text-gray-mid">Deduction</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Amount</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">% of Revenue</th>
          </tr>
        </thead>
        <tbody>
          {#each [
            { name: 'Dev Cost', val: calc.devCost },
            { name: 'Marketing Cost', val: calc.marketingCost },
            { name: 'IP Advance', val: calc.ipAdvance },
            { name: 'Manufacturing (backer units)', val: calc.backerMfgCost },
            { name: 'Platform Fees', val: calc.platformFees },
            { name: 'Shipping & Fulfillment', val: calc.shippingCost },
          ] as item}
            <tr class="border-b border-gray-light/20 hover:bg-cream/50">
              <td class="py-2">{item.name}</td>
              <td class="py-2 text-right text-pink-hot font-semibold">{fmtFull(item.val)}</td>
              <td class="py-2 text-right text-gray-mid">{calc.ksRevenue > 0 ? (item.val / calc.ksRevenue * 100).toFixed(1) : '0.0'}%</td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr class="font-bold border-t-2 border-gray-light/40">
            <td class="py-2">Total KS Costs</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(calc.ksCosts)}</td>
            <td class="py-2 text-right text-gray-mid">{calc.ksRevenue > 0 ? (calc.ksCosts / calc.ksRevenue * 100).toFixed(1) : '0.0'}%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </Card>
</div>

<!-- Revenue by Tier -->
<div class="mb-5">
  <Card title="Revenue & Cost by Tier">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-gray-light/40">
            <th class="py-2 text-left text-xs font-semibold text-gray-mid">Tier</th>
            <th class="py-2 text-center text-xs font-semibold text-gray-mid">Price</th>
            <th class="py-2 text-center text-xs font-semibold text-gray-mid">Backers</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Revenue</th>
            <th class="py-2 text-center text-xs font-semibold text-gray-mid">Mfg/Unit</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Mfg Cost</th>
            <th class="py-2 text-center text-xs font-semibold text-gray-mid">Ship/Unit</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Ship Cost</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Margin</th>
          </tr>
        </thead>
        <tbody>
          {#each calc.tierBreakdown as tier, i}
            {@const margin = tier.revenue - tier.mfgCost - tier.shippingTotal}
            <tr class="border-b border-gray-light/20 hover:bg-cream/50">
              <td class="py-2">
                <div class="font-semibold">{tier.name}{i === 0 ? ' *' : ''}</div>
                {#if tier.productList.length > 0}
                  <div class="text-[10px] text-gray-mid">{tier.productList.map(p => p.qty > 1 ? `${p.qty}x ${p.name}` : p.name).join(', ')}</div>
                {/if}
              </td>
              <td class="py-2 text-center">${tier.price}</td>
              <td class="py-2 text-center">{tier.backers.toLocaleString()}</td>
              <td class="py-2 text-right font-semibold text-purple">{fmtFull(tier.revenue)}</td>
              <td class="py-2 text-center">${tier.costPerUnit.toFixed(2)}</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(tier.mfgCost)}</td>
              <td class="py-2 text-center">${tier.shipping.toFixed(2)}</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(tier.shippingTotal)}</td>
              <td class="py-2 text-right font-semibold {margin >= 0 ? 'text-green-700' : 'text-pink-hot'}">{fmtFull(margin)}</td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr class="bg-green-50 font-bold">
            <td class="py-2" colspan="3">TOTALS</td>
            <td class="py-2 text-right text-purple">{fmtFull(calc.ksRevenue)}</td>
            <td class="py-2"></td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(calc.backerMfgCost)}</td>
            <td class="py-2"></td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(calc.shippingCost)}</td>
            <td class="py-2 text-right text-purple">{fmtFull(calc.ksRevenue - calc.backerMfgCost - calc.shippingCost)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-4 text-xs text-purple leading-relaxed">
      PPU per tier is calculated from assigned products. Each tier can contain different products at different quantities. Shipping is set manually per tier based on weight and destination.
    </div>
  </Card>
</div>

<!-- Sensitivity Analysis -->
<Card title="Sensitivity — What If Backers Change?">
  <p class="text-xs text-gray-mid mb-3">Slide to see how KS Profit changes if you get more or fewer backers than planned.</p>
  <Slider label="Backer % of Target" bind:value={sensitivityPct} min={25} max={200} step={5} format={(v) => v + '%'} />

  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
    <div class="bg-cream rounded-lg p-3 text-center">
      <div class="text-[10px] uppercase text-gray-mid">Backers</div>
      <div class="text-lg font-bold text-purple">{sensitivity().backers.toLocaleString()}</div>
    </div>
    <div class="bg-cream rounded-lg p-3 text-center">
      <div class="text-[10px] uppercase text-gray-mid">Revenue</div>
      <div class="text-lg font-bold text-purple">{fmt(sensitivity().revenue)}</div>
    </div>
    <div class="bg-cream rounded-lg p-3 text-center">
      <div class="text-[10px] uppercase text-gray-mid">Total Costs</div>
      <div class="text-lg font-bold text-pink-hot">{fmt(sensitivity().costs)}</div>
    </div>
    <div class="bg-cream rounded-lg p-3 text-center">
      <div class="text-[10px] uppercase text-gray-mid">KS Profit</div>
      <div class="text-lg font-bold {sensitivity().profit >= 0 ? 'text-green-700' : 'text-pink-hot'}">{fmt(sensitivity().profit)}</div>
    </div>
  </div>

  {#if sensitivityPct !== 100}
    <div class="mt-3 text-xs text-gray-mid">
      {sensitivityPct < 100 ? 'Down' : 'Up'} {Math.abs(sensitivityPct - 100)}% from target.
      Profit {sensitivity().profit >= 0 ? 'remains positive' : 'goes negative'} at {sensitivityPct}% of planned backers.
    </div>
  {/if}
</Card>
