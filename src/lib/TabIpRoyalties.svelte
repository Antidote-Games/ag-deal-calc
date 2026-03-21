<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { state = $bindable(), calc } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
  <Card title="IP Licensing Terms">
    <p class="text-xs text-gray-mid mb-3">Set to $0 / 0% if this campaign has no licensed IP.</p>
    <div class="mb-4">
      <label class="text-sm font-medium text-gray-mid block mb-1">IP Advance (upfront)
        <input type="number" bind:value={state.ipAdvance} min="0" step="1000"
          class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple" />
      </label>
      <p class="text-xs text-gray-mid mt-1">Upfront payment to IP holder at deal signing. Deducted from KS Profit.</p>
    </div>
    <Slider label="IP Royalty Rate (% of sales)" bind:value={state.ipRoyaltyRate} min={0} max={12} step={0.5} format={(v) => Number(v).toFixed(1) + '%'} />
    <p class="text-xs text-gray-mid -mt-2">Applied to KS revenue and retail revenue separately. Industry standard: 5-8% for mid-tier IP.</p>
  </Card>

  <Card title="How IP Costs Work">
    <div class="text-sm text-gray-mid leading-relaxed space-y-3">
      <div>
        <div class="font-semibold text-purple mb-1">IP Advance</div>
        <p>Paid upfront at deal signing. This is a <strong>KS Profit deduction</strong> — it comes out before profit is calculated and before any partner commission.</p>
      </div>
      <div>
        <div class="font-semibold text-purple mb-1">IP Royalties</div>
        <p>Paid quarterly post-campaign as a percentage of actual sales revenue (KS + retail). This is a <strong>separate expense</strong> — it does NOT reduce KS Profit or partner commission. It comes off Antidote's bottom line.</p>
      </div>
      <div>
        <div class="font-semibold text-purple mb-1">Royalty Basis</div>
        <p>Calculated on actual money received (KS funding + wholesale revenue), not MSRP. Shipping fees are not included in the royalty base.</p>
      </div>
    </div>
  </Card>
</div>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
  <Metric label="IP Advance" value={fmt(calc.ipAdvance)} sub="Deducted from KS Profit" variant="warning" />
  <Metric label="KS Royalties" value={fmt(calc.ipRoyaltyKS)} sub="{(calc.ipRoyaltyRate * 100).toFixed(1)}% of KS revenue" variant="warning" />
  <Metric label="Post-KS Royalties" value={fmt(calc.totalPostKsIPRoyalty)} sub="{(calc.ipRoyaltyRate * 100).toFixed(1)}% of post-KS revenue" variant="warning" />
  <Metric label="Total IP Cost" value={fmt(calc.ipAdvance + calc.ipRoyaltyKS + calc.totalPostKsIPRoyalty)} sub="Advance + all royalties" variant="danger" />
</div>

<Card title="IP Cost Breakdown">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <tbody>
        <tr class="border-b border-gray-light/20">
          <td class="py-2">IP Advance (upfront)</td>
          <td class="py-2 text-right font-semibold text-pink-hot">{fmtFull(calc.ipAdvance)}</td>
        </tr>
        <tr class="border-b border-gray-light/20">
          <td class="py-2">KS Revenue Royalty ({(calc.ipRoyaltyRate * 100).toFixed(1)}% of {fmtFull(calc.ksRevenue)})</td>
          <td class="py-2 text-right font-semibold text-pink-hot">{fmtFull(calc.ipRoyaltyKS)}</td>
        </tr>
        <tr class="border-b border-gray-light/20">
          <td class="py-2">Wholesale Royalty ({(calc.ipRoyaltyRate * 100).toFixed(1)}% of {fmtFull(calc.wholesaleRevenue)})</td>
          <td class="py-2 text-right font-semibold text-pink-hot">{fmtFull(calc.wholesaleIPRoyalty)}</td>
        </tr>
        <tr class="border-b border-gray-light/20">
          <td class="py-2">Direct Sales Royalty ({(calc.ipRoyaltyRate * 100).toFixed(1)}% of {fmtFull(calc.directRevenue)})</td>
          <td class="py-2 text-right font-semibold text-pink-hot">{fmtFull(calc.directIPRoyalty)}</td>
        </tr>
        <tr class="font-bold border-t-2 border-gray-light/40">
          <td class="py-2">Total IP Cost (Year 1)</td>
          <td class="py-2 text-right text-pink-hot">{fmtFull(calc.ipAdvance + calc.ipRoyaltyKS + calc.totalPostKsIPRoyalty)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</Card>
