<script>
  import ratesData from '../product-presets/rates.json';
  import { fmtFull } from './utils.js';

  let { onAdd } = $props();

  let category = $state('illustration');
  let showCalc = $state(false);

  // Illustration
  let illusType = $state('bw_simple');
  let illusQty = $state(1);
  let illusRate = $state(80);

  // Writing / Editing
  let textTier = $state('new');
  let wordCount = $state(1000);

  // Layout
  let layoutTier = $state('new');
  let pageCount = $state(30);

  // Graphic Design
  let gdType = $state('logo');
  let gdRate = $state(300);

  let illusItem = $derived(ratesData.illustration.find(i => i.id === illusType));
  let gdItem = $derived(ratesData.graphicDesign.find(i => i.id === gdType));

  function calcWritingCost() {
    const rate = textTier === 'new' ? ratesData.writing.newRate : ratesData.writing.establishedRate;
    const base = wordCount * rate;
    return Math.round(base * (1 + ratesData.writing.markup));
  }

  function calcEditingCost() {
    const rate = textTier === 'new' ? ratesData.editing.newRate : ratesData.editing.establishedRate;
    const base = wordCount * rate;
    return Math.round(base * (1 + ratesData.editing.markup));
  }

  function calcLayoutCost() {
    const rate = layoutTier === 'new' ? ratesData.layout.newRate : ratesData.layout.establishedRate;
    return pageCount * rate;
  }

  function addItem() {
    let name, cost;
    if (category === 'illustration') {
      name = `${illusItem?.label || 'Illustration'} x${illusQty}`;
      cost = illusQty * illusRate;
    } else if (category === 'writing') {
      name = `Writing (${wordCount.toLocaleString()} words, ${textTier})`;
      cost = calcWritingCost();
    } else if (category === 'editing') {
      name = `Editing (${wordCount.toLocaleString()} words, ${textTier})`;
      cost = calcEditingCost();
    } else if (category === 'layout') {
      name = `Layout (${pageCount} pages, ${layoutTier})`;
      cost = calcLayoutCost();
    } else if (category === 'graphicDesign') {
      name = gdItem?.label || 'Graphic Design';
      cost = gdRate;
    }
    onAdd({ name, cost });
    showCalc = false;
  }
</script>

<button onclick={() => showCalc = !showCalc}
  class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-pink/30 text-pink hover:bg-pink hover:text-white transition-colors">
  Rate Calculator
</button>

{#if showCalc}
  <div class="mt-2 bg-cream rounded-lg p-3 border border-gray-light/30">
    <div class="flex gap-2 mb-3">
      {#each [['illustration', 'Illustration'], ['writing', 'Writing'], ['editing', 'Editing'], ['layout', 'Layout'], ['graphicDesign', 'Graphic Design']] as [val, label]}
        <button onclick={() => category = val}
          class="px-2 py-1 text-[10px] font-semibold rounded transition-colors {category === val ? 'bg-purple text-white' : 'bg-white text-gray-mid border border-gray-light/30 hover:border-purple'}">
          {label}
        </button>
      {/each}
    </div>

    {#if category === 'illustration'}
      <div class="grid grid-cols-3 gap-2 mb-2">
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Type</div>
          <select bind:value={illusType} onchange={() => { illusRate = ratesData.illustration.find(i => i.id === illusType)?.low || 80; }}
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs focus:outline-none focus:border-purple">
            {#each ratesData.illustration as item}
              <option value={item.id}>{item.label} (${item.low}-${item.high})</option>
            {/each}
          </select>
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Qty</div>
          <input type="number" bind:value={illusQty} min="1" step="1"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs text-center focus:outline-none focus:border-purple" />
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Rate ($)</div>
          <input type="number" bind:value={illusRate} min="0" step="10"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs text-center focus:outline-none focus:border-purple" />
        </div>
      </div>
      <div class="text-xs text-gray-mid mb-2">Total: <span class="font-bold text-purple">{fmtFull(illusQty * illusRate)}</span></div>

    {:else if category === 'writing' || category === 'editing'}
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Contractor Tier</div>
          <select bind:value={textTier}
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs focus:outline-none focus:border-purple">
            <option value="new">New (${category === 'writing' ? ratesData.writing.newRate : ratesData.editing.newRate}/word)</option>
            <option value="established">Established (${category === 'writing' ? ratesData.writing.establishedRate : ratesData.editing.establishedRate}/word)</option>
          </select>
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Est. Word Count</div>
          <input type="number" bind:value={wordCount} min="0" step="500"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs text-center focus:outline-none focus:border-purple" />
        </div>
      </div>
      {@const rate = category === 'writing'
        ? (textTier === 'new' ? ratesData.writing.newRate : ratesData.writing.establishedRate)
        : (textTier === 'new' ? ratesData.editing.newRate : ratesData.editing.establishedRate)}
      <div class="text-xs text-gray-mid mb-2">
        {wordCount.toLocaleString()} words x ${rate}/word + 2% =
        <span class="font-bold text-purple">{fmtFull(category === 'writing' ? calcWritingCost() : calcEditingCost())}</span>
        <span class="text-gray-mid">(flat rate)</span>
      </div>

    {:else if category === 'layout'}
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Contractor Tier</div>
          <select bind:value={layoutTier}
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs focus:outline-none focus:border-purple">
            <option value="new">New (${ratesData.layout.newRate}/page)</option>
            <option value="established">Established (${ratesData.layout.establishedRate}/page)</option>
          </select>
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Page Count</div>
          <input type="number" bind:value={pageCount} min="1" step="1"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs text-center focus:outline-none focus:border-purple" />
        </div>
      </div>
      <div class="text-xs text-gray-mid mb-2">
        {pageCount} pages x ${layoutTier === 'new' ? ratesData.layout.newRate : ratesData.layout.establishedRate}/page =
        <span class="font-bold text-purple">{fmtFull(calcLayoutCost())}</span>
      </div>

    {:else if category === 'graphicDesign'}
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Deliverable</div>
          <select bind:value={gdType} onchange={() => { gdRate = ratesData.graphicDesign.find(i => i.id === gdType)?.low || 300; }}
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs focus:outline-none focus:border-purple">
            {#each ratesData.graphicDesign as item}
              <option value={item.id}>{item.label} (${item.low}-${item.high})</option>
            {/each}
          </select>
        </div>
        <div>
          <div class="text-[10px] uppercase text-gray-mid mb-1">Rate ($)</div>
          <input type="number" bind:value={gdRate} min="0" step="50"
            class="w-full px-2 py-1.5 border border-gray-light rounded text-xs text-center focus:outline-none focus:border-purple" />
        </div>
      </div>
      <div class="text-xs text-gray-mid mb-2">Total: <span class="font-bold text-purple">{fmtFull(gdRate)}</span></div>
    {/if}

    <button onclick={addItem}
      class="w-full py-1.5 text-xs font-semibold rounded-lg bg-purple text-white hover:bg-purple-light transition-colors">
      Add to Budget
    </button>
  </div>
{/if}
