<script>
  import Card from './Card.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { appState: state = $bindable(), calc } = $props();
</script>

{#if calc.isPartnerProject}
  <!-- PARTNER PROJECT: Creator / Antidote Split -->

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
    <Metric label="KS Profit" value={fmt(calc.ksProfit)} sub={calc.ksProfit >= 0 ? 'Split by profit %' : 'Split by contribution ratio'} variant={calc.ksProfit >= 0 ? 'success' : 'danger'} />
    <Metric label="Antidote's Share" value={calc.ksProfit >= 0 ? fmt(calc.antidoteKsShare) : '-' + fmt(calc.antidoteLoss)} sub="{(calc.antidoteProfitPct * 100).toFixed(0)}% of profit" variant={calc.ksProfit >= 0 ? 'success' : 'danger'} />
    <Metric label="Creator's Share" value={calc.ksProfit >= 0 ? fmt(calc.creatorKsShare) : '-' + fmt(calc.creatorLoss)} sub="{(calc.creatorProfitPct * 100).toFixed(0)}% of profit" variant={calc.ksProfit >= 0 ? 'success' : 'danger'} />
    <Metric label="Budget Contrib Ratio" value="{(calc.antidoteContribRatio * 100).toFixed(0)}% / {(calc.creatorContribRatio * 100).toFixed(0)}%" sub="Antidote / Creator" variant="default" />
  </div>

  <!-- Budget Contributions -->
  <div class="mb-5">
    <Card title="Budget Contributions">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b-2 border-gray-light/40">
              <th class="py-2 text-left text-xs font-semibold text-gray-mid">Cost Item</th>
              <th class="py-2 text-right text-xs font-semibold text-gray-mid">Total</th>
              <th class="py-2 text-right text-xs font-semibold text-purple">Antidote</th>
              <th class="py-2 text-right text-xs font-semibold text-pink-hot">Creator</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-light/20">
              <td class="py-2">Dev Cost</td>
              <td class="py-2 text-right">{fmtFull(calc.devCost)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.antidoteDevCost)}</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(calc.creatorDevCost)}</td>
            </tr>
            <tr class="border-b border-gray-light/20">
              <td class="py-2">Marketing Cost</td>
              <td class="py-2 text-right">{fmtFull(calc.marketingCost)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.antidoteMarketingCost)}</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(calc.creatorMarketingCost)}</td>
            </tr>
            <tr class="border-b border-gray-light/20">
              <td class="py-2">IP Advance</td>
              <td class="py-2 text-right">{fmtFull(calc.ipAdvance)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.antidoteIpAdvance)}</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(calc.creatorIpAdvance)}</td>
            </tr>
            <tr class="border-b border-gray-light/20 bg-cream/50">
              <td class="py-2 text-gray-mid">Manufacturing (backer)</td>
              <td class="py-2 text-right">{fmtFull(calc.backerMfgCost)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.backerMfgCost)}</td>
              <td class="py-2 text-right text-gray-mid">$0</td>
            </tr>
            <tr class="border-b border-gray-light/20 bg-cream/50">
              <td class="py-2 text-gray-mid">Platform Fees</td>
              <td class="py-2 text-right">{fmtFull(calc.platformFees)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.platformFees)}</td>
              <td class="py-2 text-right text-gray-mid">$0</td>
            </tr>
            <tr class="border-b border-gray-light/20 bg-cream/50">
              <td class="py-2 text-gray-mid">Shipping & Fulfillment</td>
              <td class="py-2 text-right">{fmtFull(calc.shippingCost)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.shippingCost)}</td>
              <td class="py-2 text-right text-gray-mid">$0</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-bold border-t-2 border-gray-light/40">
              <td class="py-2">Total</td>
              <td class="py-2 text-right">{fmtFull(calc.totalBudget)}</td>
              <td class="py-2 text-right text-purple">{fmtFull(calc.antidoteTotalContribution)}</td>
              <td class="py-2 text-right text-pink-hot">{fmtFull(calc.creatorTotalContribution)}</td>
            </tr>
            <tr class="text-xs text-gray-mid">
              <td class="py-1">Contribution %</td>
              <td class="py-1"></td>
              <td class="py-1 text-right">{(calc.antidoteContribRatio * 100).toFixed(1)}%</td>
              <td class="py-1 text-right">{(calc.creatorContribRatio * 100).toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="bg-blue-light/10 border-l-4 border-l-blue-light rounded p-3 mt-3 text-xs text-purple leading-relaxed">
        Operational costs (manufacturing, platform fees, shipping) are always fronted by Antidote. Contribution ratio is used to share losses proportionally if the campaign underperforms.
      </div>
    </Card>
  </div>

  <!-- Profit/Loss Split Visualization -->
  <div class="mb-5">
    <Card title={calc.ksProfit >= 0 ? 'Profit Split' : 'Loss Sharing'}>
      {#if calc.ksProfit >= 0}
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-mid">KS Profit</span>
          <span class="font-bold text-purple">{fmtFull(calc.ksProfit)}</span>
        </div>
        <div class="w-full bg-gray-light/30 rounded-full h-8 overflow-hidden flex mb-3">
          <div class="h-8 bg-purple flex items-center justify-center text-xs font-bold text-white"
            style="width: {calc.antidoteProfitPct * 100}%">
            Antidote {(calc.antidoteProfitPct * 100).toFixed(0)}%
          </div>
          <div class="h-8 bg-pink flex items-center justify-center text-xs font-bold text-white"
            style="width: {calc.creatorProfitPct * 100}%">
            Creator {(calc.creatorProfitPct * 100).toFixed(0)}%
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-center text-sm">
          <div>
            <div class="text-[10px] uppercase text-gray-mid">Antidote Gets</div>
            <div class="font-bold text-purple">{fmtFull(calc.antidoteKsShare)}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-gray-mid">Creator Gets</div>
            <div class="font-bold text-pink-hot">{fmtFull(calc.creatorKsShare)}</div>
          </div>
        </div>
      {:else}
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-mid">KS Loss</span>
          <span class="font-bold text-pink-hot">{fmtFull(calc.ksProfit)}</span>
        </div>
        <div class="w-full bg-gray-light/30 rounded-full h-8 overflow-hidden flex mb-3">
          <div class="h-8 bg-purple/70 flex items-center justify-center text-xs font-bold text-white"
            style="width: {calc.antidoteContribRatio * 100}%">
            Antidote {(calc.antidoteContribRatio * 100).toFixed(0)}%
          </div>
          <div class="h-8 bg-pink-hot/70 flex items-center justify-center text-xs font-bold text-white"
            style="width: {calc.creatorContribRatio * 100}%">
            Creator {(calc.creatorContribRatio * 100).toFixed(0)}%
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-center text-sm">
          <div>
            <div class="text-[10px] uppercase text-gray-mid">Antidote Absorbs</div>
            <div class="font-bold text-pink-hot">{fmtFull(-calc.antidoteLoss)}</div>
          </div>
          <div>
            <div class="text-[10px] uppercase text-gray-mid">Creator Absorbs</div>
            <div class="font-bold text-pink-hot">{fmtFull(-calc.creatorLoss)}</div>
          </div>
        </div>
        <div class="bg-amber-50 border-l-4 border-amber-400 rounded p-3 mt-3 text-xs text-amber-800">
          Losses are shared by budget contribution ratio ({(calc.antidoteContribRatio * 100).toFixed(0)}% Antidote / {(calc.creatorContribRatio * 100).toFixed(0)}% Creator), not by profit split percentage.
        </div>
      {/if}
    </Card>
  </div>

  <!-- Support Contract Post-KS -->
  {#if state.supportContract && calc.showPostKs}
    <Card title="Post-KS Revenue Split (Support Contract)">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm text-gray-mid">Post-KS Revenue</span>
        <span class="font-bold text-purple">{fmtFull(calc.totalPostKsRevenue)}</span>
      </div>
      <div class="grid grid-cols-2 gap-3 text-center text-sm">
        <div>
          <div class="text-[10px] uppercase text-gray-mid">Antidote ({(calc.antidoteProfitPct * 100).toFixed(0)}%)</div>
          <div class="font-bold text-purple">{fmtFull(calc.postKsAntidoteShare)}</div>
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid">Creator ({(calc.creatorProfitPct * 100).toFixed(0)}%)</div>
          <div class="font-bold text-pink-hot">{fmtFull(calc.postKsCreatorShare)}</div>
        </div>
      </div>
    </Card>
  {/if}

  <!-- How It Works -->
  <div class="mt-5">
    <Card title="How Partner Projects Work">
      <div class="text-sm text-gray-mid leading-relaxed space-y-3">
        <div>
          <div class="font-semibold text-purple mb-1">Cost Reimbursement</div>
          <p>Both Antidote and the creator contribute to the project budget. After a successful campaign, each party is reimbursed from KS revenue for their fronted costs before profit is split.</p>
        </div>
        <div>
          <div class="font-semibold text-purple mb-1">Profit Split</div>
          <p>Remaining profit after all costs splits at the agreed percentage. Creator keeps their IP.</p>
        </div>
        <div>
          <div class="font-semibold text-purple mb-1">Loss Sharing</div>
          <p>If the campaign loses money, losses are shared <strong>proportionally by budget contribution</strong>, not by profit split %. If Antidote contributed 80% of the budget, Antidote absorbs 80% of the loss.</p>
        </div>
        <div>
          <div class="font-semibold text-purple mb-1">Overage</div>
          <p>Overage manufacturing is the <strong>creator's cost</strong> — it's their inventory for post-KS sales. Unless a long-term support contract is in place, post-KS sales are the creator's responsibility.</p>
        </div>
      </div>
    </Card>
  </div>

{:else}
  <!-- OWN TITLE: Deal Partner Commission -->

  <div class="mb-5">
    <Card title="Deal Partner">
      <div class="flex items-center gap-3 mb-4">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" bind:checked={state.partnerEnabled} class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-light rounded-full peer peer-checked:bg-purple transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
        <span class="text-sm font-medium text-gray-mid">{state.partnerEnabled ? 'Deal partner active' : 'No deal partner on this campaign'}</span>
      </div>

      {#if state.partnerEnabled}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-mid block mb-1">KS Profit Commission %
              <input type="number" bind:value={state.partnerCommissionRate} min="0" max="50" step="1"
                class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple" />
            </label>
            <p class="text-xs text-gray-mid mt-1">Percentage of KS Profit paid to deal partner.</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-mid block mb-1">Retail Bonus %
              <input type="number" bind:value={state.partnerRetailBonusRate} min="0" max="20" step="0.5"
                class="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:border-purple" />
            </label>
            <p class="text-xs text-gray-mid mt-1">Percentage of post-KS retail revenue paid to deal partner on qualifying products.</p>
          </div>
        </div>
      {/if}
    </Card>
  </div>

  {#if state.partnerEnabled}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      <Metric label="KS Profit" value={fmt(calc.ksProfit)} sub="Commission basis" variant={calc.ksProfit > 0 ? 'success' : 'danger'} />
      <Metric label="Partner Commission" value={fmt(calc.partnerCommission)} sub="{calc.partnerCommissionRate}% of KS Profit" variant="warning" />
      <Metric label="Partner Retail Bonus" value={fmt(calc.partnerRetailBonus)} sub="{calc.partnerRetailBonusRate}% of {fmtFull(calc.totalPostKsRevenue)}" variant="warning" />
      <Metric label="Total Partner Comp" value={fmt(calc.partnerCommission + calc.partnerRetailBonus)} sub="Commission + retail bonus" variant="warning" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
      <Card title="KS Profit Split">
        {@const antidoteKSShare = calc.ksProfit - calc.partnerCommission}
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-mid">KS Profit</span>
            <span class="font-bold text-purple">{fmtFull(calc.ksProfit)}</span>
          </div>
          <div class="w-full bg-gray-light/30 rounded-full h-8 overflow-hidden flex">
            {#if calc.ksProfit > 0}
              <div class="h-8 bg-purple flex items-center justify-center text-xs font-bold text-white"
                style="width: {100 - calc.partnerCommissionRate}%">
                Antidote {100 - calc.partnerCommissionRate}%
              </div>
              <div class="h-8 bg-pink flex items-center justify-center text-xs font-bold text-white"
                style="width: {calc.partnerCommissionRate}%">
                Partner {calc.partnerCommissionRate}%
              </div>
            {:else}
              <div class="h-8 bg-gray-light flex items-center justify-center text-xs font-bold text-gray-mid w-full">
                No profit to split
              </div>
            {/if}
          </div>
          <div class="grid grid-cols-2 gap-3 text-center text-sm">
            <div>
              <div class="text-[10px] uppercase text-gray-mid">Antidote</div>
              <div class="font-bold text-purple">{fmtFull(antidoteKSShare)}</div>
            </div>
            <div>
              <div class="text-[10px] uppercase text-gray-mid">Partner</div>
              <div class="font-bold text-pink-hot">{fmtFull(calc.partnerCommission)}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Post-KS Revenue Split">
        {@const antidoteRetail = calc.totalPostKsRevenue - calc.partnerRetailBonus}
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-mid">Post-KS Revenue (Wholesale + Direct)</span>
            <span class="font-bold text-purple">{fmtFull(calc.totalPostKsRevenue)}</span>
          </div>
          <div class="w-full bg-gray-light/30 rounded-full h-8 overflow-hidden flex">
            {#if calc.totalPostKsRevenue > 0}
              <div class="h-8 bg-purple flex items-center justify-center text-xs font-bold text-white"
                style="width: {100 - calc.partnerRetailBonusRate}%">
                Antidote {100 - calc.partnerRetailBonusRate}%
              </div>
              <div class="h-8 bg-pink flex items-center justify-center text-xs font-bold text-white"
                style="width: {calc.partnerRetailBonusRate}%">
                Partner {calc.partnerRetailBonusRate}%
              </div>
            {:else}
              <div class="h-8 bg-gray-light flex items-center justify-center text-xs font-bold text-gray-mid w-full">
                No post-KS revenue
              </div>
            {/if}
          </div>
          <div class="grid grid-cols-2 gap-3 text-center text-sm">
            <div>
              <div class="text-[10px] uppercase text-gray-mid">Antidote</div>
              <div class="font-bold text-purple">{fmtFull(antidoteRetail)}</div>
            </div>
            <div>
              <div class="text-[10px] uppercase text-gray-mid">Partner</div>
              <div class="font-bold text-pink-hot">{fmtFull(calc.partnerRetailBonus)}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <Card title="How Deal Partner Works">
      <div class="text-sm text-gray-mid leading-relaxed space-y-3">
        <div>
          <div class="font-semibold text-purple mb-1">KS Commission</div>
          <p>Partner receives a percentage of <strong>KS Profit</strong> (revenue minus all 6 deductions). Commission only applies when profit is positive.</p>
        </div>
        <div>
          <div class="font-semibold text-purple mb-1">Retail Bonus</div>
          <p>Partner receives a percentage of post-KS <strong>retail revenue</strong> on qualifying products.</p>
        </div>
        <div>
          <div class="font-semibold text-purple mb-1">IP Royalties</div>
          <p>IP royalties are a separate expense and do <strong>not</strong> reduce the partner's commission basis.</p>
        </div>
      </div>
    </Card>
  {:else}
    <div class="bg-cream rounded-xl p-8 text-center">
      <p class="text-gray-mid text-sm">Enable the deal partner toggle above to configure profit sharing for this campaign.</p>
      <p class="text-gray-mid text-xs mt-2">When enabled, you can set a KS Profit commission percentage and an optional retail revenue bonus.</p>
    </div>
  {/if}
{/if}
