<script>
  import Card from './Card.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { calc } = $props();
</script>

<Card title="Annual P&L Statement">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b-2 border-gray-light/40">
          <th class="py-2 text-left text-xs font-semibold text-gray-mid">Category</th>
          <th class="py-2 text-right text-xs font-semibold text-gray-mid">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr class="bg-green-50 font-bold">
          <td class="py-2.5">KS Revenue</td>
          <td class="py-2.5 text-right text-purple">{fmtFull(calc.ksRevenue)}</td>
        </tr>
        <tr class="bg-green-50/50">
          <td class="py-2">+ Retail Revenue</td>
          <td class="py-2 text-right text-purple">{fmtFull(calc.retailRevenue)}</td>
        </tr>
        <tr class="bg-purple/5 font-bold border-y border-purple/20">
          <td class="py-2.5">= GROSS REVENUE</td>
          <td class="py-2.5 text-right text-purple">{fmtFull(calc.grossRevenue)}</td>
        </tr>
        <tr class="bg-amber-50">
          <td class="py-2">- Dev Cost</td>
          <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.devCost)}</td>
        </tr>
        <tr class="bg-amber-50">
          <td class="py-2">- Marketing Cost</td>
          <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.marketingCost)}</td>
        </tr>
        <tr class="bg-amber-50">
          <td class="py-2">- Manufacturing (all units)</td>
          <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.mfgCost)}</td>
        </tr>
        <tr class="bg-amber-50">
          <td class="py-2">- IP Advance</td>
          <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.ipAdvance)}</td>
        </tr>
        <tr class="bg-amber-50">
          <td class="py-2">- IP Royalties (KS + Retail)</td>
          <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.totalIPRoyalties)}</td>
        </tr>
        <tr class="border-t-2 border-gray-light/40">
          <td class="py-2">- Jordan's Commission</td>
          <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.jordanCommission)}</td>
        </tr>
        <tr class="font-bold text-base border-t-2 {calc.netProfit >= 0 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-pink-hot'}">
          <td class="py-3">= ANTIDOTE NET PROFIT</td>
          <td class="py-3 text-right {calc.netProfit >= 0 ? 'text-green-700' : 'text-pink-hot'}">{fmtFull(calc.netProfit)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  {#if calc.netProfit >= 0}
    <div class="mt-5 p-3 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-800">
      Profitable. Antidote nets {fmt(calc.netProfit)} after all costs, IP, and Jordan's commission.
    </div>
  {:else}
    <div class="mt-5 p-3 bg-amber-50 border-l-4 border-amber-400 rounded text-sm text-amber-800">
      Underwater by {fmt(Math.abs(calc.netProfit))}. Need more backers, higher pledges, or lower costs.
    </div>
  {/if}
</Card>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
  <Metric label="Total Revenue" value={fmt(calc.grossRevenue)} variant="success" />
  <Metric label="Total Costs" value={fmt(calc.totalExpenses)} variant="warning" />
  <Metric label="Jordan's Cut" value={fmt(calc.jordanCommission)} sub="{calc.commissionBasis} ({fmtFull(calc.commissionBase)})" variant="default" />
  <Metric label="Antidote's Net" value={fmt(calc.netProfit)} sub="After all costs" variant={calc.netProfit >= 0 ? 'success' : 'danger'} />
</div>
