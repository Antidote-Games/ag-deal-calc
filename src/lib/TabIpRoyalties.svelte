<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { appState: state = $bindable(), calc } = $props();
</script>

<div class="mb-5">
  <Card title="IP Licensing">
    <div class="flex items-center gap-3 mb-4">
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" bind:checked={state.ipEnabled} class="sr-only peer" />
        <div class="w-11 h-6 bg-gray-light rounded-full peer peer-checked:bg-purple transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
      </label>
      <span class="text-sm font-medium text-gray-mid">{state.ipEnabled ? 'Licensed IP on this campaign' : 'No licensed IP'}</span>
    </div>
  </Card>
</div>

{#if state.ipEnabled}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
    <Card title="IP Licensing Terms">
      <div class="mb-4">
        <label class="text-sm font-medium text-gray-mid block mb-1">IP Advance / MG (upfront)
          <input type="number" bind:value={state.ipAdvance} min="0" step="1000"
            class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple" />
        </label>
        <p class="text-xs text-gray-mid mt-1">Minimum guarantee paid upfront. An advance <strong>against</strong> royalties: earned royalties recoup it first, and you only pay royalties beyond it. Total IP cost is the greater of the MG or total royalties.</p>
      </div>
      <Slider label="IP Royalty Rate (% of sales)" bind:value={state.ipRoyaltyRate} min={0} max={12} step={0.5} format={(v) => Number(v).toFixed(1) + '%'} />
      <p class="text-xs text-gray-mid -mt-2">Applied to KS revenue and retail revenue separately. Industry standard: 5-8% for mid-tier IP.</p>
    </Card>

    <Card title="How the MG Works">
      <div class="text-sm text-gray-mid leading-relaxed space-y-3">
        <div>
          <div class="font-semibold text-purple mb-1">Advance against royalties</div>
          <p>The MG is paid upfront, but it is a <strong>prepayment of royalties</strong>, not a separate fee. As you sell, earned royalties are recouped against it.</p>
        </div>
        <div>
          <div class="font-semibold text-purple mb-1">Earn-out</div>
          <p>You pay <strong>additional</strong> royalties only once cumulative earned royalties exceed the MG. Before that point, royalties just draw down the advance you already paid.</p>
        </div>
        <div>
          <div class="font-semibold text-purple mb-1">The guarantee</div>
          <p>If sales are weak and earned royalties never reach the MG, you forfeit the unrecouped balance — the licensor keeps the full minimum. So total IP cost is <strong>max(MG, total royalties)</strong>.</p>
        </div>
        <div>
          <div class="font-semibold text-purple mb-1">Royalty basis</div>
          <p>Calculated on actual money received (KS funding + wholesale revenue), not MSRP. Shipping is not in the royalty base.</p>
        </div>
      </div>
    </Card>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
    <Metric label="IP Advance / MG" value={fmt(calc.ipAdvance)} sub="Paid upfront" variant="warning" />
    <Metric label="Earned Royalties" value={fmt(calc.earnedRoyaltyTotal)} sub="{(calc.ipRoyaltyRate * 100).toFixed(1)}% of KS + retail" variant="warning" />
    <Metric label="Royalties Due Beyond MG" value={fmt(calc.royaltyDue)} sub={calc.ipEarnedOut ? 'MG earned out' : 'MG not yet recouped'} variant="warning" />
    <Metric label="Total IP Cost" value={fmt(calc.totalIpCost)} sub="Greater of MG or royalties" variant="danger" />
  </div>

  <Card title="IP Cost Breakdown">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <tbody>
          <tr class="border-b border-gray-light/20">
            <td class="py-2">IP Advance / MG (paid upfront)</td>
            <td class="py-2 text-right font-semibold text-pink-hot">{fmtFull(calc.ipAdvance)}</td>
          </tr>
          <tr class="border-b border-gray-light/20 text-gray-mid">
            <td class="py-2 pl-4">Earned royalty — KS ({(calc.ipRoyaltyRate * 100).toFixed(1)}% of {fmtFull(calc.ksRevenue)})</td>
            <td class="py-2 text-right">{fmtFull(calc.earnedRoyaltyKS)}</td>
          </tr>
          <tr class="border-b border-gray-light/20 text-gray-mid">
            <td class="py-2 pl-4">Earned royalty — Post-KS ({(calc.ipRoyaltyRate * 100).toFixed(1)}% of {fmtFull(calc.totalPostKsRevenue)})</td>
            <td class="py-2 text-right">{fmtFull(calc.earnedRoyaltyPostKs)}</td>
          </tr>
          <tr class="border-b border-gray-light/20">
            <td class="py-2">Total earned royalties</td>
            <td class="py-2 text-right font-semibold">{fmtFull(calc.earnedRoyaltyTotal)}</td>
          </tr>
          <tr class="border-b border-gray-light/20 bg-cream/50">
            <td class="py-2 text-gray-mid">Less: recouped against MG</td>
            <td class="py-2 text-right text-gray-mid">-{fmtFull(calc.ipRecouped)}</td>
          </tr>
          <tr class="border-b border-gray-light/20">
            <td class="py-2">Royalties due beyond MG</td>
            <td class="py-2 text-right font-semibold text-pink-hot">{fmtFull(calc.royaltyDue)}</td>
          </tr>
          <tr class="font-bold border-t-2 border-gray-light/40">
            <td class="py-2">Total IP Cost (MG + royalties due)</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(calc.totalIpCost)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    {#if calc.ipAdvance > 0}
      <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-3 text-xs text-purple leading-relaxed">
        {#if calc.ipEarnedOut}
          MG earned out: royalties have fully recouped the {fmtFull(calc.ipAdvance)} advance, and {fmtFull(calc.royaltyDue)} is owed on top.
        {:else}
          MG not recouped: earned royalties ({fmtFull(calc.earnedRoyaltyTotal)}) fall short of the {fmtFull(calc.ipAdvance)} minimum. The {fmtFull(calc.unrecoupedAdvance)} shortfall is forfeited to the licensor — no royalties are owed on top.
        {/if}
      </div>
    {/if}
  </Card>
{:else}
  <div class="bg-cream rounded-xl p-8 text-center">
    <p class="text-gray-mid text-sm">No licensed IP on this campaign. Enable the toggle above if this project uses licensed intellectual property.</p>
    <p class="text-gray-mid text-xs mt-2">When enabled, you can set an IP advance and royalty rate that flow into the P&L.</p>
  </div>
{/if}
