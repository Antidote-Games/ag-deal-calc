<script>
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import RateCalculator from './RateCalculator.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { appState: inputState = $bindable(), validations } = $props();

  let isPartner = $derived(inputState.projectType === 'partner');
  let totalFixed = $derived(Number(inputState.devCost) + Number(inputState.marketingCost));
  let antidoteFixed = $derived(totalFixed - (Number(inputState.creatorDevCost) || 0) - (Number(inputState.creatorMarketingCost) || 0));

  let devExpanded = $state(false);
  let marketingExpanded = $state(false);

  let devLineTotal = $derived(inputState.devLineItems.reduce((sum, li) => sum + (Number(li.cost) || 0), 0));
  let marketingLineTotal = $derived(inputState.marketingLineItems.reduce((sum, li) => sum + (Number(li.cost) || 0), 0));

  function syncDevFromLines() { inputState.devCost = devLineTotal; }
  function syncMarketingFromLines() { inputState.marketingCost = marketingLineTotal; }

  function addDevLine() {
    inputState.devLineItems = [...inputState.devLineItems, { name: '', cost: 0 }];
    devExpanded = true;
  }
  function removeDevLine(i) {
    inputState.devLineItems = inputState.devLineItems.filter((_, idx) => idx !== i);
    syncDevFromLines();
  }

  function addMarketingLine() {
    inputState.marketingLineItems = [...inputState.marketingLineItems, { name: '', cost: 0 }];
    marketingExpanded = true;
  }
  function removeMarketingLine(i) {
    inputState.marketingLineItems = inputState.marketingLineItems.filter((_, idx) => idx !== i);
    syncMarketingFromLines();
  }

  const devPresets = [
    'Illustration', 'Layout', 'Editing', 'Art Direction',
    'Trade Dress', 'Writing', 'Game Design', 'Graphic Design',
    'Sculpting', 'Cartography', 'Proofreading', 'Playtesting',
  ];
  const marketingPresets = [
    'Social Media Ads', 'KS Ad Campaign', 'Influencer / Reviewer',
    'Convention Booth', 'Print Materials', 'Video Production',
    'Email Marketing', 'Community Management',
  ];
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
  <Card title="Development Budget">
    <p class="text-xs text-gray-mid mb-3">Fixed development costs. Use the slider for quick estimates, or expand to plan line items.</p>
    <Slider label="Dev Cost (Total)" bind:value={inputState.devCost} min={0} max={200000} step={1000} format={(v) => fmt(v)} />

    {#if isPartner}
      <div class="ml-4 mb-4 pl-3 border-l-2 border-pink/30">
        <label class="text-xs font-medium text-gray-mid flex-1">Creator Contribution
          <input type="number" bind:value={inputState.creatorDevCost} min="0" max={inputState.devCost} step="500"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-sm focus:outline-none focus:border-purple" />
        </label>
        <div class="text-xs text-gray-mid mt-1">Antidote: {fmt(Math.max(0, inputState.devCost - (Number(inputState.creatorDevCost) || 0)))}</div>
      </div>
    {/if}

    <!-- Line item breakdown -->
    <button onclick={() => devExpanded = !devExpanded}
      class="text-xs font-semibold text-purple hover:text-purple-light transition-colors mb-2">
      {devExpanded ? 'Hide' : 'Show'} budget breakdown {inputState.devLineItems.length > 0 ? `(${inputState.devLineItems.length} items)` : ''}
    </button>

    {#if devExpanded}
      {#if inputState.devLineItems.length > 0}
        <div class="overflow-x-auto mb-2">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-light/40">
                <th class="py-1 text-left text-xs font-semibold text-gray-mid">Line Item</th>
                <th class="py-1 text-right text-xs font-semibold text-gray-mid">Cost</th>
                <th class="py-1 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {#each inputState.devLineItems as li, i}
                <tr class="border-b border-gray-light/20">
                  <td class="py-1">
                    <input type="text" bind:value={li.name} placeholder="e.g., Illustration"
                      class="w-full px-2 py-1 border border-gray-light rounded text-sm focus:outline-none focus:border-purple" />
                  </td>
                  <td class="py-1">
                    <input type="number" bind:value={li.cost} min="0" step="50"
                      oninput={syncDevFromLines}
                      class="w-28 block ml-auto px-2 py-1 border border-gray-light rounded text-sm text-right focus:outline-none focus:border-purple" />
                  </td>
                  <td class="py-1 text-center">
                    <button onclick={() => removeDevLine(i)} class="text-pink-hot hover:text-pink-hot/70 font-bold text-xs">X</button>
                  </td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="border-t border-gray-light/40">
                <td class="py-1 text-xs font-semibold text-gray-mid">Line Item Total</td>
                <td class="py-1 text-right font-bold text-purple">{fmtFull(devLineTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {#if devLineTotal !== inputState.devCost}
          <button onclick={syncDevFromLines}
            class="mb-2 w-full py-1.5 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors">
            Set total to line items ({fmtFull(devLineTotal)})
          </button>
        {/if}
      {/if}

      <div class="flex flex-wrap gap-1 mb-2">
        {#each devPresets as preset}
          <button onclick={() => { inputState.devLineItems = [...inputState.devLineItems, { name: preset, cost: 0 }]; }}
            class="px-2 py-1 text-[10px] font-medium rounded border border-purple/15 text-purple hover:bg-purple hover:text-white transition-colors">
            + {preset}
          </button>
        {/each}
      </div>
      <div class="flex gap-2">
        <button onclick={addDevLine}
          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors">
          + Add Line Item
        </button>
        <RateCalculator onAdd={(item) => { inputState.devLineItems = [...inputState.devLineItems, item]; syncDevFromLines(); }} />
      </div>
    {/if}
  </Card>

  <Card title="Marketing Budget">
    <p class="text-xs text-gray-mid mb-3">Marketing and promotion costs. Use the slider for quick estimates, or expand to plan line items.</p>
    <Slider label="Marketing Cost (Total)" bind:value={inputState.marketingCost} min={0} max={300000} step={1000} format={(v) => fmt(v)} />

    {#if isPartner}
      <div class="ml-4 mb-4 pl-3 border-l-2 border-pink/30">
        <label class="text-xs font-medium text-gray-mid flex-1">Creator Contribution
          <input type="number" bind:value={inputState.creatorMarketingCost} min="0" max={inputState.marketingCost} step="500"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-sm focus:outline-none focus:border-purple" />
        </label>
        <div class="text-xs text-gray-mid mt-1">Antidote: {fmt(Math.max(0, inputState.marketingCost - (Number(inputState.creatorMarketingCost) || 0)))}</div>
      </div>
    {/if}

    <!-- Line item breakdown -->
    <button onclick={() => marketingExpanded = !marketingExpanded}
      class="text-xs font-semibold text-purple hover:text-purple-light transition-colors mb-2">
      {marketingExpanded ? 'Hide' : 'Show'} budget breakdown {inputState.marketingLineItems.length > 0 ? `(${inputState.marketingLineItems.length} items)` : ''}
    </button>

    {#if marketingExpanded}
      {#if inputState.marketingLineItems.length > 0}
        <div class="overflow-x-auto mb-2">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-light/40">
                <th class="py-1 text-left text-xs font-semibold text-gray-mid">Line Item</th>
                <th class="py-1 text-right text-xs font-semibold text-gray-mid">Cost</th>
                <th class="py-1 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {#each inputState.marketingLineItems as li, i}
                <tr class="border-b border-gray-light/20">
                  <td class="py-1">
                    <input type="text" bind:value={li.name} placeholder="e.g., Social Ads"
                      class="w-full px-2 py-1 border border-gray-light rounded text-sm focus:outline-none focus:border-purple" />
                  </td>
                  <td class="py-1">
                    <input type="number" bind:value={li.cost} min="0" step="50"
                      oninput={syncMarketingFromLines}
                      class="w-28 block ml-auto px-2 py-1 border border-gray-light rounded text-sm text-right focus:outline-none focus:border-purple" />
                  </td>
                  <td class="py-1 text-center">
                    <button onclick={() => removeMarketingLine(i)} class="text-pink-hot hover:text-pink-hot/70 font-bold text-xs">X</button>
                  </td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="border-t border-gray-light/40">
                <td class="py-1 text-xs font-semibold text-gray-mid">Line Item Total</td>
                <td class="py-1 text-right font-bold text-purple">{fmtFull(marketingLineTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {#if marketingLineTotal !== inputState.marketingCost}
          <button onclick={syncMarketingFromLines}
            class="mb-2 w-full py-1.5 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors">
            Set total to line items ({fmtFull(marketingLineTotal)})
          </button>
        {/if}
      {/if}

      <div class="flex flex-wrap gap-1 mb-2">
        {#each marketingPresets as preset}
          <button onclick={() => { inputState.marketingLineItems = [...inputState.marketingLineItems, { name: preset, cost: 0 }]; }}
            class="px-2 py-1 text-[10px] font-medium rounded border border-purple/15 text-purple hover:bg-purple hover:text-white transition-colors">
            + {preset}
          </button>
        {/each}
      </div>
      <div class="flex gap-2">
        <button onclick={addMarketingLine}
          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors">
          + Add Line Item
        </button>
        <RateCalculator onAdd={(item) => { inputState.marketingLineItems = [...inputState.marketingLineItems, item]; syncMarketingFromLines(); }} />
      </div>
    {/if}
  </Card>
</div>

<div class="mb-5">
  <Card title="Manufacturing & Fees">
    <p class="text-xs text-gray-mid mb-3">PPU per tier is auto-calculated from products assigned on the Campaign tab. Set print run and platform fees here.</p>
    <Slider label="Print Run (total units)" bind:value={inputState.printRun} min={100} max={25000} step={100} format={(v) => Number(v).toLocaleString()} />
    {#if validations.printRunLow}
      <div class="mt-2 text-xs text-pink-hot font-medium bg-pink-hot/10 rounded px-3 py-2">
        Print run ({Number(inputState.printRun).toLocaleString()}) is less than total backers ({Number(inputState.totalBackers).toLocaleString()}). You won't have enough units.
      </div>
    {/if}

    {@const overage = Math.max(0, inputState.printRun - inputState.totalBackers)}
    {@const postKsPlanned = (inputState.postKsSales || []).reduce((sum, s) => sum + (Number(s.directUnits) || 0) + (Number(s.wholesaleUnits) || 0), 0)}
    {@const suggestedRun = inputState.totalBackers + postKsPlanned}
    {@const unallocated = overage - postKsPlanned}

    <div class="mt-2 mb-4 bg-cream rounded-lg p-3 text-xs">
      <div class="grid grid-cols-2 gap-x-4 gap-y-1">
        <span class="text-gray-mid">Backer units</span>
        <span class="text-right font-semibold text-purple">{Number(inputState.totalBackers).toLocaleString()}</span>
        <span class="text-gray-mid">Overage</span>
        <span class="text-right font-semibold text-purple">{overage.toLocaleString()}</span>
        {#if inputState.projectType === 'own' || inputState.supportContract}
          <span class="text-gray-mid">Post-KS planned</span>
          {@const directTotal = (inputState.postKsSales || []).reduce((sum, s) => sum + (Number(s.directUnits) || 0), 0)}
          {@const wholesaleTotal = (inputState.postKsSales || []).reduce((sum, s) => sum + (Number(s.wholesaleUnits) || 0), 0)}
          <span class="text-right font-semibold">{postKsPlanned.toLocaleString()} <span class="font-normal text-gray-mid">({wholesaleTotal.toLocaleString()}W + {directTotal.toLocaleString()}D)</span></span>
          <span class="text-gray-mid">Unallocated</span>
          <span class="text-right font-semibold {unallocated < 0 ? 'text-pink-hot' : unallocated === 0 ? 'text-green-700' : 'text-amber-600'}">{unallocated.toLocaleString()}{unallocated < 0 ? ' (short!)' : ''}</span>
        {:else}
          <span class="text-gray-mid">Overage owner</span>
          <span class="text-right font-semibold text-pink-hot">Creator's cost</span>
        {/if}
      </div>
      {#if inputState.projectType === 'own' || inputState.supportContract}
        <button
          onclick={() => inputState.printRun = suggestedRun}
          class="mt-2 w-full py-1.5 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors"
        >
          Match to post-KS plan ({suggestedRun.toLocaleString()} units)
        </button>
      {/if}
    </div>

    <Slider label="Platform Fee %" bind:value={inputState.platformFeeRate} min={0} max={15} step={0.5} format={(v) => Number(v).toFixed(1) + '%'} />
    <p class="text-xs text-gray-mid -mt-2">Kickstarter + payment processing. Industry standard ~8%.</p>
  </Card>
</div>

<!-- Fixed cost summary -->
<div class="bg-cream rounded-xl p-4 text-center">
  {#if isPartner}
    <div class="grid grid-cols-2 gap-4">
      <div>
        <div class="text-xs uppercase text-gray-mid mb-1">Antidote Fronts</div>
        <div class="text-2xl font-bold text-purple">{fmt(antidoteFixed)}</div>
      </div>
      <div>
        <div class="text-xs uppercase text-gray-mid mb-1">Creator Fronts</div>
        <div class="text-2xl font-bold text-pink-hot">{fmt((Number(inputState.creatorDevCost) || 0) + (Number(inputState.creatorMarketingCost) || 0))}</div>
      </div>
    </div>
  {:else}
    <div class="text-xs uppercase text-gray-mid mb-1">Total Fixed Costs (Dev + Marketing)</div>
    <div class="text-2xl font-bold text-purple">{fmt(totalFixed)}</div>
  {/if}
</div>
