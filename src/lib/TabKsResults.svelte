<script>
  import Card from './Card.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { calc } = $props();
</script>

<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
  <Metric label="KS Revenue" value={fmt(calc.ksRevenue)} sub="Avg pledge: ${calc.avgPledge.toFixed(2)}" variant="success" />
  <Metric label="KS Costs" value={fmt(calc.totalCosts)} sub="Dev {fmt(calc.devCost)} | Mktg {fmt(calc.marketingCost)} | Mfg {fmt(calc.mfgCost)}" variant="default" />
  <Metric label="KS Profit (Before IP)" value={fmt(calc.ksProfit)} sub={calc.ksProfit > 0 ? 'Available to split' : 'SHORTFALL'} variant={calc.ksProfit > 0 ? 'success' : 'danger'} />
  <Metric label="Jordan's Commission" value={fmt(calc.jordanCommission)} sub={calc.commissionBasis} variant="warning" />
  <Metric label="Antidote After Jordan" value={fmt(calc.antidoteKS)} sub="KS Profit minus Jordan's cut" variant={calc.antidoteKS > 0 ? 'success' : 'danger'} />
  <Metric label="Extra Units for Retail" value={calc.extraUnits.toLocaleString()} variant="default" />
</div>

<Card title="KS Revenue & Cost by Tier">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b-2 border-gray-light/40">
          <th class="py-2 text-left text-xs font-semibold text-gray-mid">Tier</th>
          <th class="py-2 text-center text-xs font-semibold text-gray-mid">Price</th>
          <th class="py-2 text-center text-xs font-semibold text-gray-mid">Backers</th>
          <th class="py-2 text-right text-xs font-semibold text-gray-mid">Revenue</th>
          <th class="py-2 text-center text-xs font-semibold text-gray-mid">Cost/Unit</th>
          <th class="py-2 text-right text-xs font-semibold text-gray-mid">Tier Mfg Cost</th>
          <th class="py-2 text-right text-xs font-semibold text-gray-mid">Tier Margin</th>
        </tr>
      </thead>
      <tbody>
        {#each calc.tierBreakdown as tier, i}
          <tr class="border-b border-gray-light/20 hover:bg-cream/50">
            <td class="py-2 font-semibold">Tier {i + 1}{i === 0 ? ' (Base)' : ''}</td>
            <td class="py-2 text-center">${tier.price}</td>
            <td class="py-2 text-center">{tier.backers.toLocaleString()}</td>
            <td class="py-2 text-right font-semibold text-purple">{fmtFull(tier.revenue)}</td>
            <td class="py-2 text-center">${tier.costPerUnit.toFixed(2)}</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(tier.tierCost)}</td>
            <td class="py-2 text-right {tier.revenue - tier.tierCost >= 0 ? 'text-green-700' : 'text-pink-hot'} font-semibold">{fmtFull(tier.revenue - tier.tierCost)}</td>
          </tr>
        {/each}
        {#if calc.extraUnits > 0}
          <tr class="border-b border-gray-light/20 bg-cream/30">
            <td class="py-2 font-semibold text-gray-mid">Extra (retail stock)</td>
            <td class="py-2 text-center">-</td>
            <td class="py-2 text-center">{calc.extraUnits.toLocaleString()}</td>
            <td class="py-2 text-right">-</td>
            <td class="py-2 text-center">${calc.basePrice > 0 ? (calc.extraMfgCost / calc.extraUnits).toFixed(2) : '0.00'}</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(calc.extraMfgCost)}</td>
            <td class="py-2 text-right text-gray-mid">-</td>
          </tr>
        {/if}
      </tbody>
      <tfoot>
        <tr class="bg-green-50 font-bold">
          <td class="py-2" colspan="3">TOTALS</td>
          <td class="py-2 text-right text-purple">{fmtFull(calc.ksRevenue)}</td>
          <td class="py-2"></td>
          <td class="py-2 text-right text-pink-hot">{fmtFull(calc.mfgCost)}</td>
          <td class="py-2 text-right text-purple">{fmtFull(calc.ksRevenue - calc.mfgCost)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-4 text-xs text-purple leading-relaxed">
    Tier 1 is the base product at PPU cost. For Tiers 2-5, each dollar above the Tier 1 price is 50% additional cost / 50% additional margin. Extra retail units are manufactured at base PPU.
  </div>
</Card>
