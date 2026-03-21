<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { appState: state = $bindable(), calc, validations } = $props();
</script>

<!-- Overage / Inventory -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
  <Metric label="Overage Units" value={calc.overageUnits.toLocaleString()} sub="Print run minus backer units" variant="default" />
  <Metric label="Inventory Investment" value={fmt(calc.overageCost)} sub="Overage x base PPU — cash outlay" variant="warning" />
  <Metric label="MSRP" value={'$' + calc.msrp.toFixed(2)} sub="Tier 1 + 15% markup" variant="default" />
  <Metric label="Wholesale Price" value={'$' + Number(state.wholesalePrice).toFixed(2)} sub="~MSRP / 2.5" variant="default" />
</div>

<!-- Sales Channels -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
  <Card title="Wholesale (Retailers & Distribution)">
    <p class="text-xs text-gray-mid mb-3">Sales to game stores and distributors at wholesale price.</p>
    <Slider label="Wholesale Units Sold (Year 1)" bind:value={state.wholesaleUnitsSold} min={0} max={10000} step={50} format={(v) => Number(v).toLocaleString()} />
    <div class="mb-4">
      <label class="text-sm font-medium text-gray-mid block mb-1">Wholesale Price per Unit ($)
        <input type="number" bind:value={state.wholesalePrice} min="0" step="1"
          class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple" />
      </label>
      <p class="text-xs text-gray-mid mt-1">Industry standard: MSRP / 2.5 (${(calc.msrp / 2.5).toFixed(2)} suggested)</p>
    </div>
    <div class="bg-cream rounded-lg p-3 text-center">
      <div class="text-[10px] uppercase text-gray-mid">Wholesale Revenue</div>
      <div class="text-xl font-bold text-purple">{fmt(calc.wholesaleRevenue)}</div>
    </div>
  </Card>

  <Card title="Direct Sales (Conventions, Website, In-Person)">
    <p class="text-xs text-gray-mid mb-3">Sales direct to customers at full MSRP. Higher margin, lower volume.</p>
    <Slider label="Direct Units Sold (Year 1)" bind:value={state.directUnitsSold} min={0} max={5000} step={25} format={(v) => Number(v).toLocaleString()} />
    <div class="mb-4">
      <div class="text-sm font-medium text-gray-mid block mb-1">Sale Price (MSRP)</div>
      <div class="px-3 py-2 bg-cream rounded-lg font-bold text-purple text-sm">
        ${calc.msrp.toFixed(2)} <span class="text-xs font-normal text-gray-mid">(Tier 1 ${calc.basePrice} + 15%)</span>
      </div>
    </div>
    <div class="bg-cream rounded-lg p-3 text-center">
      <div class="text-[10px] uppercase text-gray-mid">Direct Revenue</div>
      <div class="text-xl font-bold text-purple">{fmt(calc.directRevenue)}</div>
    </div>
  </Card>
</div>

{#if validations.retailExceedsExtra}
  <div class="mb-5 text-xs text-pink-hot font-medium bg-pink-hot/10 rounded px-3 py-2">
    Total post-KS sales ({validations.totalRetailUnits.toLocaleString()} units) exceed available overage ({calc.overageUnits.toLocaleString()} units). You'd need a second print run.
  </div>
{/if}

<!-- Combined Post-KS P&L -->
<div class="mb-5">
  <Card title="Post-KS Sales P&L">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-gray-light/40">
            <th class="py-2 text-left text-xs font-semibold text-gray-mid">Line Item</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Wholesale</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Direct</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-light/20">
            <td class="py-2">Units Sold</td>
            <td class="py-2 text-right">{calc.wholesaleUnitsSold.toLocaleString()}</td>
            <td class="py-2 text-right">{calc.directUnitsSold.toLocaleString()}</td>
            <td class="py-2 text-right font-semibold">{calc.totalPostKsUnits.toLocaleString()}</td>
          </tr>
          <tr class="border-b border-gray-light/20">
            <td class="py-2">Price per Unit</td>
            <td class="py-2 text-right">${Number(state.wholesalePrice).toFixed(2)}</td>
            <td class="py-2 text-right">${calc.msrp.toFixed(2)}</td>
            <td class="py-2 text-right text-gray-mid">-</td>
          </tr>
          <tr class="border-b border-gray-light/20 bg-green-50/50">
            <td class="py-2 font-semibold">Revenue</td>
            <td class="py-2 text-right text-purple">{fmtFull(calc.wholesaleRevenue)}</td>
            <td class="py-2 text-right text-purple">{fmtFull(calc.directRevenue)}</td>
            <td class="py-2 text-right font-bold text-purple">{fmtFull(calc.totalPostKsRevenue)}</td>
          </tr>
          <tr class="border-b border-gray-light/20">
            <td class="py-2 text-gray-mid">- IP Royalties ({(calc.ipRoyaltyRate * 100).toFixed(1)}%)</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.wholesaleIPRoyalty)}</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.directIPRoyalty)}</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.totalPostKsIPRoyalty)}</td>
          </tr>
          {#if state.partnerEnabled && calc.partnerRetailBonus > 0}
            <tr class="border-b border-gray-light/20">
              <td class="py-2 text-gray-mid">- Partner Bonus ({calc.partnerRetailBonusRate}%)</td>
              <td class="py-2 text-right" colspan="2"></td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.partnerRetailBonus)}</td>
            </tr>
          {/if}
          <tr class="font-bold border-t-2 {calc.postKsMargin >= 0 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-pink-hot'}">
            <td class="py-2">Net Post-KS Margin</td>
            <td class="py-2" colspan="2"></td>
            <td class="py-2 text-right {calc.postKsMargin >= 0 ? 'text-green-700' : 'text-pink-hot'}">{fmtFull(calc.postKsMargin)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-3 text-xs text-purple leading-relaxed">
      COGS on post-KS units is already paid as part of the overage print run. Revenue here is margin above that sunk cost. Direct sales at MSRP yield significantly higher per-unit margin than wholesale.
    </div>
  </Card>
</div>

<!-- Inventory Recovery -->
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
