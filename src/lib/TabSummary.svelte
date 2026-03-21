<script>
  import Card from './Card.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { state, calc, saveScenario, loadScenario, deleteScenario } = $props();
</script>

<!-- P&L -->
<div class="mb-5">
  <Card title="Campaign P&L — {state.projectName} {calc.isPartnerProject ? '(Partner Project)' : ''}">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-gray-light/40">
            <th class="py-2 text-left text-xs font-semibold text-gray-mid">Line Item</th>
            <th class="py-2 text-right text-xs font-semibold text-gray-mid">Amount</th>
          </tr>
        </thead>
        <tbody>
          <!-- Revenue -->
          <tr class="bg-green-50 font-bold">
            <td class="py-2.5">KS Revenue</td>
            <td class="py-2.5 text-right text-purple">{fmtFull(calc.ksRevenue)}</td>
          </tr>

          <!-- KS Deductions -->
          <tr class="bg-amber-50/60">
            <td class="py-2">- Dev Cost{calc.isPartnerProject && calc.creatorDevCost > 0 ? ` (Antidote ${fmtFull(calc.antidoteDevCost)} + Creator ${fmtFull(calc.creatorDevCost)})` : ''}</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.devCost)}</td>
          </tr>
          <tr class="bg-amber-50/60">
            <td class="py-2">- Marketing Cost{calc.isPartnerProject && calc.creatorMarketingCost > 0 ? ` (Antidote ${fmtFull(calc.antidoteMarketingCost)} + Creator ${fmtFull(calc.creatorMarketingCost)})` : ''}</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.marketingCost)}</td>
          </tr>
          <tr class="bg-amber-50/60">
            <td class="py-2">- IP Advance</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.ipAdvance)}</td>
          </tr>
          <tr class="bg-amber-50/60">
            <td class="py-2">- Manufacturing (backer units)</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.backerMfgCost)}</td>
          </tr>
          <tr class="bg-amber-50/60">
            <td class="py-2">- Platform Fees ({Number(state.platformFeeRate).toFixed(1)}%)</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.platformFees)}</td>
          </tr>
          <tr class="bg-amber-50/60">
            <td class="py-2">- Shipping & Fulfillment</td>
            <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.shippingCost)}</td>
          </tr>

          <!-- KS Profit -->
          <tr class="font-bold border-y-2 {calc.ksProfit >= 0 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-pink-hot'}">
            <td class="py-2.5">= KS PROFIT</td>
            <td class="py-2.5 text-right {calc.ksProfit >= 0 ? 'text-green-700' : 'text-pink-hot'}">{fmtFull(calc.ksProfit)}</td>
          </tr>

          {#if calc.isPartnerProject}
            <!-- Partner Project: Creator/Antidote split -->
            {#if calc.ksProfit >= 0}
              <tr class="bg-amber-50/30">
                <td class="py-2">- Creator's Share ({(calc.creatorProfitPct * 100).toFixed(0)}%)</td>
                <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.creatorKsShare)}</td>
              </tr>
              <tr class="bg-green-50/50">
                <td class="py-2 font-semibold">= Antidote KS Share ({(calc.antidoteProfitPct * 100).toFixed(0)}%)</td>
                <td class="py-2 text-right font-semibold text-purple">{fmtFull(calc.antidoteKsShare)}</td>
              </tr>
            {:else}
              <tr class="bg-red-50/50">
                <td class="py-2">Antidote absorbs ({(calc.antidoteContribRatio * 100).toFixed(0)}% of loss)</td>
                <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.antidoteLoss)}</td>
              </tr>
              <tr class="bg-red-50/50">
                <td class="py-2">Creator absorbs ({(calc.creatorContribRatio * 100).toFixed(0)}% of loss)</td>
                <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.creatorLoss)}</td>
              </tr>
            {/if}

            <!-- IP Royalties -->
            <tr class="bg-amber-50/30">
              <td class="py-2">- IP Royalties on KS ({(calc.ipRoyaltyRate * 100).toFixed(1)}%)</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.ipRoyaltyKS)}</td>
            </tr>

            <!-- Support contract post-KS -->
            {#if calc.showPostKs}
              <tr class="bg-green-50/50">
                <td class="py-2">+ Wholesale Revenue ({calc.wholesaleUnitsSold.toLocaleString()} units)</td>
                <td class="py-2 text-right text-purple">{fmtFull(calc.wholesaleRevenue)}</td>
              </tr>
              <tr class="bg-green-50/50">
                <td class="py-2">+ Direct Sales Revenue ({calc.directUnitsSold.toLocaleString()} units @ MSRP)</td>
                <td class="py-2 text-right text-purple">{fmtFull(calc.directRevenue)}</td>
              </tr>
              <tr class="bg-amber-50/30">
                <td class="py-2">- Post-KS IP Royalties</td>
                <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.totalPostKsIPRoyalty)}</td>
              </tr>
              <tr class="bg-amber-50/30">
                <td class="py-2">- Creator's Post-KS Share ({(calc.creatorProfitPct * 100).toFixed(0)}%)</td>
                <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.postKsCreatorShare)}</td>
              </tr>
            {/if}

          {:else}
            <!-- Own Title: standard flow -->
            <tr class="bg-amber-50/30">
              <td class="py-2">- IP Royalties on KS ({(calc.ipRoyaltyRate * 100).toFixed(1)}%)</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.ipRoyaltyKS)}</td>
            </tr>
            {#if calc.dealPartnerActive && calc.partnerCommission > 0}
              <tr class="bg-amber-50/30">
                <td class="py-2">- Deal Partner Commission ({calc.partnerCommissionRate}%)</td>
                <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.partnerCommission)}</td>
              </tr>
            {/if}
            <tr class="bg-amber-50/30">
              <td class="py-2">- Overage Manufacturing ({calc.overageUnits.toLocaleString()} units)</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.overageCostAntidote)}</td>
            </tr>

            <!-- Post-KS Sales -->
            <tr class="bg-green-50/50">
              <td class="py-2">+ Wholesale Revenue ({calc.wholesaleUnitsSold.toLocaleString()} units)</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.wholesaleRevenue)}</td>
            </tr>
            <tr class="bg-green-50/50">
              <td class="py-2">+ Direct Sales Revenue ({calc.directUnitsSold.toLocaleString()} units @ MSRP)</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.directRevenue)}</td>
            </tr>
            <tr class="bg-amber-50/30">
              <td class="py-2">- Post-KS IP Royalties</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.totalPostKsIPRoyalty)}</td>
            </tr>
            {#if calc.dealPartnerActive && calc.partnerRetailBonus > 0}
              <tr class="bg-amber-50/30">
                <td class="py-2">- Deal Partner Retail Bonus ({calc.partnerRetailBonusRate}%)</td>
                <td class="py-2 text-right text-pink-hot">{fmtFull(-calc.partnerRetailBonus)}</td>
              </tr>
            {/if}
          {/if}

          <!-- Net -->
          <tr class="font-bold text-base border-t-2 {calc.netProfit >= 0 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-pink-hot'}">
            <td class="py-3">= ANTIDOTE NET PROFIT</td>
            <td class="py-3 text-right {calc.netProfit >= 0 ? 'text-green-700' : 'text-pink-hot'}">{fmtFull(calc.netProfit)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {#if calc.netProfit >= 0}
      <div class="mt-5 p-3 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-800">
        Profitable. Antidote nets {fmt(calc.netProfit)} after all costs{calc.isPartnerProject ? ', creator split,' : ''}{calc.dealPartnerActive ? ', deal partner commission,' : ''} and IP royalties.
      </div>
    {:else}
      <div class="mt-5 p-3 bg-amber-50 border-l-4 border-amber-400 rounded text-sm text-amber-800">
        Underwater by {fmt(Math.abs(calc.netProfit))}. Need more backers, higher pledges, or lower costs.
      </div>
    {/if}
  </Card>
</div>

<!-- Summary Metrics -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
  <Metric label="Gross Revenue" value={fmt(calc.grossRevenue)} variant="success" />
  <Metric label="Total Expenses" value={fmt(calc.totalExpenses)} variant="warning" />
  <Metric label="Antidote Net" value={fmt(calc.netProfit)} variant={calc.netProfit >= 0 ? 'success' : 'danger'} />
  <Metric label="Break-Even" value={calc.breakEvenBackers === Infinity ? 'N/A' : calc.breakEvenBackers.toLocaleString()} sub="backers needed" variant={calc.breakEvenBackers <= state.totalBackers ? 'success' : 'danger'} />
</div>

<!-- Scenario Comparison -->
<Card title="Scenario Comparison">
  <div class="flex items-center gap-3 mb-4">
    <button
      onclick={saveScenario}
      class="px-4 py-2 bg-purple text-white rounded-lg text-sm font-semibold hover:bg-purple-light transition-colors"
    >
      Save Current as Scenario
    </button>
    <span class="text-xs text-gray-mid">Saves "{state.projectName}" with current numbers</span>
  </div>

  {#if state.scenarios.length === 0}
    <p class="text-sm text-gray-mid">No scenarios saved yet. Adjust inputs, then save to compare.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-gray-light/40">
            <th class="py-2 text-left text-xs font-semibold text-gray-mid">Metric</th>
            {#each state.scenarios as scenario}
              <th class="py-2 text-right text-xs font-semibold text-gray-mid">{scenario.name}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each [
            { label: 'KS Revenue', key: 'ksRevenue', format: fmtFull },
            { label: 'KS Costs', key: 'ksCosts', format: fmtFull },
            { label: 'KS Profit', key: 'ksProfit', format: fmtFull },
            { label: 'Break-Even Backers', key: 'breakEvenBackers', format: (v) => v === Infinity ? 'N/A' : v.toLocaleString() },
            { label: 'Partner Commission', key: 'partnerCommission', format: fmtFull },
            { label: 'Overage Investment', key: 'overageCost', format: fmtFull },
            { label: 'Wholesale Revenue', key: 'wholesaleRevenue', format: fmtFull },
            { label: 'Direct Revenue', key: 'directRevenue', format: fmtFull },
            { label: 'Post-KS Margin', key: 'postKsMargin', format: fmtFull },
            { label: 'Net Profit', key: 'netProfit', format: fmtFull },
          ] as row}
            <tr class="border-b border-gray-light/20 hover:bg-cream/50 {row.key === 'netProfit' ? 'font-bold bg-cream' : ''}">
              <td class="py-2">{row.label}</td>
              {#each state.scenarios as scenario}
                <td class="py-2 text-right {row.key === 'netProfit' ? (scenario.results[row.key] >= 0 ? 'text-green-700' : 'text-pink-hot') : 'text-purple'}">
                  {row.format(scenario.results[row.key] ?? 0)}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex flex-wrap gap-2 mt-4">
      {#each state.scenarios as scenario, i}
        <div class="flex items-center gap-1 bg-cream rounded-lg px-3 py-1.5 text-xs">
          <span class="font-semibold text-purple">{scenario.name}</span>
          <span class="text-gray-mid">({scenario.savedAt})</span>
          <button onclick={() => loadScenario(i)} class="ml-2 text-purple hover:text-purple-light font-semibold" title="Load this scenario">Load</button>
          <button onclick={() => deleteScenario(i)} class="ml-1 text-pink-hot hover:text-pink-hot/70 font-semibold" title="Delete this scenario">X</button>
        </div>
      {/each}
    </div>
  {/if}
</Card>
