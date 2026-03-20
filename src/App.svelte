<script>
  import TabInputs from './lib/TabInputs.svelte';
  import TabKsResults from './lib/TabKsResults.svelte';
  import TabIpRetail from './lib/TabIpRetail.svelte';
  import TabSummary from './lib/TabSummary.svelte';

  let unlocked = $state(false);
  let passkey = $state('');
  let passError = $state(false);

  function tryUnlock() {
    if (passkey.trim().toLowerCase() === 'antidote') {
      unlocked = true;
      passError = false;
    } else {
      passError = true;
    }
  }

  let activeTab = $state('inputs');

  let state = $state({
    devCost: 40000,
    marketingCost: 30000,
    ppu: 4.5,
    printRun: 1200,
    totalBackers: 800,
    commissionMode: 'phase1',
    ipAdvance: 10000,
    ipRoyaltyRate: 6,
    retailUnitsSold: 300,
    wholesalePrice: 20,
    tiers: [
      { price: 20, pct: 70 },
      { price: 35, pct: 15 },
      { price: 60, pct: 10 },
      { price: 100, pct: 3 },
      { price: 150, pct: 2 },
    ],
  });

  // Validations
  let validations = $derived(() => {
    const tierPctTotal = state.tiers.reduce((sum, t) => sum + (Number(t.pct) || 0), 0);
    const extraUnits = state.printRun - state.totalBackers;
    return {
      tierPctOff: Math.abs(tierPctTotal - 100) > 0.01,
      tierPctTotal,
      printRunLow: state.printRun < state.totalBackers,
      retailExceedsExtra: state.retailUnitsSold > Math.max(0, extraUnits),
    };
  });

  // All derived calculations
  let calc = $derived(() => {
    const devCost = Number(state.devCost) || 0;
    const marketingCost = Number(state.marketingCost) || 0;
    const ppu = Number(state.ppu) || 0;
    const printRun = Number(state.printRun) || 0;
    const totalBackers = Number(state.totalBackers) || 0;
    const commissionMode = state.commissionMode;
    const ipAdvance = Number(state.ipAdvance) || 0;
    const ipRoyaltyRate = Number(state.ipRoyaltyRate) || 0;
    const retailUnitsSold = Number(state.retailUnitsSold) || 0;
    const wholesalePrice = Number(state.wholesalePrice) || 0;

    // Tier breakdown
    // Tier 1 = base product (cost = PPU). Tiers 2-5 premium above tier 1:
    // 50% of the premium is additional cost, 50% is additional margin.
    const basePrice = Number(state.tiers[0]?.price) || 0;
    const tierBreakdown = state.tiers.map((t, i) => {
      const price = Number(t.price) || 0;
      const pct = Number(t.pct) || 0;
      const backers = Math.round(totalBackers * (pct / 100));
      const revenue = backers * price;
      const premium = i === 0 ? 0 : Math.max(0, price - basePrice);
      const premiumCostPerUnit = premium * 0.50;
      const costPerUnit = ppu + premiumCostPerUnit;
      const tierCost = backers * costPerUnit;
      return { price, pct, backers, revenue, premium, premiumCostPerUnit, costPerUnit, tierCost };
    });

    // KS
    const ksRevenue = tierBreakdown.reduce((sum, t) => sum + t.revenue, 0);
    const avgPledge = totalBackers > 0 ? ksRevenue / totalBackers : 0;
    // Mfg: backer units at tier-specific costs + extra units at base PPU
    const backerMfgCost = tierBreakdown.reduce((sum, t) => sum + t.tierCost, 0);
    const extraUnits = Math.max(0, printRun - totalBackers);
    const extraMfgCost = extraUnits * ppu;
    const mfgCost = backerMfgCost + extraMfgCost;
    const totalCosts = devCost + marketingCost + mfgCost;
    const ksProfit = ksRevenue - totalCosts;

    // IP & Retail
    const ipRoyaltyKS = ksRevenue * (ipRoyaltyRate / 100);
    const retailRevenue = retailUnitsSold * wholesalePrice;
    const retailIPRoyalty = retailRevenue * (ipRoyaltyRate / 100);
    const retailMargin = retailRevenue - retailIPRoyalty;
    const totalIPRoyalties = ipRoyaltyKS + retailIPRoyalty;
    const totalIPCost = ipAdvance + totalIPRoyalties;

    // Jordan's commission — depends on selected mode
    let jordanCommission = 0;
    let commissionRate = 0;
    let commissionBasis = '';
    let commissionBase = 0;
    if (commissionMode === 'phase1') {
      commissionRate = 20;
      commissionBase = ksProfit;
      commissionBasis = '20% of KS Profit';
      jordanCommission = Math.max(0, ksProfit * 0.20);
    } else if (commissionMode === 'phase2') {
      commissionRate = 18;
      commissionBase = ksProfit;
      commissionBasis = '18% of KS Profit';
      jordanCommission = Math.max(0, ksProfit * 0.18);
    } else if (commissionMode === 'jordan-agr') {
      commissionRate = 10;
      const agr = ksRevenue - mfgCost - ipRoyaltyKS;
      commissionBase = agr;
      commissionBasis = '10% of Adjusted Gross Revenue';
      jordanCommission = Math.max(0, agr * 0.10);
    }
    const antidoteKS = ksProfit - jordanCommission;

    // Summary
    const grossRevenue = ksRevenue + retailRevenue;
    const totalExpenses = devCost + marketingCost + mfgCost + ipAdvance + totalIPRoyalties + jordanCommission;
    const netProfit = grossRevenue - totalExpenses;

    return {
      devCost, marketingCost, mfgCost, backerMfgCost, extraMfgCost, totalCosts,
      tierBreakdown, ksRevenue, avgPledge, basePrice,
      ksProfit, jordanCommission, antidoteKS, extraUnits,
      commissionRate, commissionBasis, commissionBase,
      ipAdvance, ipRoyaltyKS, retailRevenue, retailIPRoyalty,
      retailMargin, totalIPRoyalties, totalIPCost,
      grossRevenue, totalExpenses, netProfit,
    };
  });

  const presets = [
    { label: 'Card Game — Low', sub: '~800 backers', values: {
      devCost: 15000, marketingCost: 15000, ppu: 3.5, printRun: 1200, totalBackers: 800,
      ipAdvance: 2000, ipRoyaltyRate: 6, retailUnitsSold: 300, wholesalePrice: 15,
      tiers: [{ price: 20, pct: 70 }, { price: 30, pct: 15 }, { price: 45, pct: 10 }, { price: 75, pct: 3 }, { price: 100, pct: 2 }],
    }},
    { label: 'Card Game — Huge', sub: '~8K backers', values: {
      devCost: 30000, marketingCost: 60000, ppu: 3, printRun: 10000, totalBackers: 8000,
      ipAdvance: 10000, ipRoyaltyRate: 6, retailUnitsSold: 1500, wholesalePrice: 15,
      tiers: [{ price: 20, pct: 60 }, { price: 35, pct: 20 }, { price: 50, pct: 12 }, { price: 80, pct: 5 }, { price: 120, pct: 3 }],
    }},
    { label: 'Big Box — Low', sub: '~800 backers', values: {
      devCost: 40000, marketingCost: 30000, ppu: 8, printRun: 1200, totalBackers: 800,
      ipAdvance: 10000, ipRoyaltyRate: 6, retailUnitsSold: 300, wholesalePrice: 30,
      tiers: [{ price: 50, pct: 65 }, { price: 75, pct: 18 }, { price: 100, pct: 10 }, { price: 150, pct: 5 }, { price: 250, pct: 2 }],
    }},
    { label: 'Big Box — Moderate', sub: '~3K backers', values: {
      devCost: 60000, marketingCost: 60000, ppu: 7, printRun: 4000, totalBackers: 3000,
      ipAdvance: 15000, ipRoyaltyRate: 6, retailUnitsSold: 800, wholesalePrice: 30,
      tiers: [{ price: 50, pct: 60 }, { price: 80, pct: 20 }, { price: 120, pct: 12 }, { price: 175, pct: 5 }, { price: 250, pct: 3 }],
    }},
    { label: 'Minis — Moderate', sub: '~3K backers', values: {
      devCost: 80000, marketingCost: 75000, ppu: 12, printRun: 4000, totalBackers: 3000,
      ipAdvance: 20000, ipRoyaltyRate: 6, retailUnitsSold: 800, wholesalePrice: 40,
      tiers: [{ price: 80, pct: 55 }, { price: 120, pct: 22 }, { price: 175, pct: 13 }, { price: 250, pct: 7 }, { price: 400, pct: 3 }],
    }},
    { label: 'Minis — Huge', sub: '~8K backers', values: {
      devCost: 100000, marketingCost: 150000, ppu: 10, printRun: 10000, totalBackers: 8000,
      ipAdvance: 25000, ipRoyaltyRate: 6, retailUnitsSold: 1500, wholesalePrice: 40,
      tiers: [{ price: 80, pct: 50 }, { price: 130, pct: 25 }, { price: 200, pct: 14 }, { price: 300, pct: 7 }, { price: 500, pct: 4 }],
    }},
    { label: 'Big Box — Blowout', sub: '~15K backers', values: {
      devCost: 100000, marketingCost: 200000, ppu: 6, printRun: 18000, totalBackers: 15000,
      ipAdvance: 50000, ipRoyaltyRate: 5, retailUnitsSold: 2500, wholesalePrice: 30,
      tiers: [{ price: 60, pct: 50 }, { price: 100, pct: 25 }, { price: 150, pct: 14 }, { price: 225, pct: 7 }, { price: 350, pct: 4 }],
    }},
    { label: 'Minis — Blowout', sub: '~15K backers', values: {
      devCost: 150000, marketingCost: 250000, ppu: 9, printRun: 18000, totalBackers: 15000,
      ipAdvance: 75000, ipRoyaltyRate: 5, retailUnitsSold: 2500, wholesalePrice: 45,
      tiers: [{ price: 100, pct: 45 }, { price: 175, pct: 25 }, { price: 250, pct: 16 }, { price: 400, pct: 9 }, { price: 600, pct: 5 }],
    }},
  ];

  function applyPreset(preset) {
    const v = preset.values;
    state.devCost = v.devCost;
    state.marketingCost = v.marketingCost;
    state.ppu = v.ppu;
    state.printRun = v.printRun;
    state.totalBackers = v.totalBackers;
    state.ipAdvance = v.ipAdvance;
    state.ipRoyaltyRate = v.ipRoyaltyRate;
    state.retailUnitsSold = v.retailUnitsSold;
    state.wholesalePrice = v.wholesalePrice;
    state.tiers = v.tiers.map(t => ({ ...t }));
  }

  const tabs = [
    { id: 'inputs', label: 'Inputs' },
    { id: 'ks', label: 'KS Results' },
    { id: 'ip', label: 'IP & Retail' },
    { id: 'summary', label: 'Summary' },
  ];
</script>

{#if !unlocked}
<div class="min-h-screen flex items-center justify-center px-4">
  <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm text-center">
    <img src="/logo.png" alt="Antidote Games" class="h-16 mx-auto mb-4" />
    <h1 class="text-xl font-bold text-purple mb-1">Deal Calculator</h1>
    <p class="text-sm text-gray-mid mb-6">Enter passkey to continue</p>
    <form onsubmit={(e) => { e.preventDefault(); tryUnlock(); }}>
      <input
        type="password"
        bind:value={passkey}
        placeholder="Passkey"
        class="w-full px-4 py-2.5 border border-gray-light rounded-lg text-sm text-center focus:outline-none focus:border-purple mb-3"
      />
      {#if passError}
        <p class="text-xs text-pink-hot mb-3">Incorrect passkey. Try again.</p>
      {/if}
      <button type="submit" class="w-full py-2.5 bg-purple text-white rounded-lg text-sm font-semibold hover:bg-purple-light transition-colors">
        Unlock
      </button>
    </form>
  </div>
</div>
{:else}
<div class="max-w-6xl mx-auto px-4 py-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-purple to-purple-light rounded-xl p-6 mb-6 flex items-center gap-4">
    <img src="/logo.png" alt="Antidote Games" class="h-12 w-auto" />
    <div>
      <h1 class="text-xl font-bold text-white">Deal Calculator</h1>
      <p class="text-sm text-white/80">Define tiers. Model KS revenue. Validate the deal.</p>
    </div>
  </div>

  <!-- Presets -->
  <div class="mb-6">
    <div class="text-xs font-semibold text-gray-mid uppercase tracking-wider mb-2">Scenarios</div>
    <div class="flex flex-wrap gap-2">
      {#each presets as preset}
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple/20 bg-white hover:bg-purple hover:text-white transition-colors"
          onclick={() => applyPreset(preset)}
        >
          {preset.label} <span class="opacity-60">{preset.sub}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 mb-6 border-b-2 border-gray-light/30 overflow-x-auto">
    {#each tabs as tab}
      <button
        class="px-5 py-2.5 text-sm font-semibold border-b-3 transition-colors {activeTab === tab.id ? 'text-purple border-pink' : 'text-gray-mid border-transparent hover:text-purple'}"
        onclick={() => activeTab = tab.id}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'inputs'}
    <TabInputs bind:state validations={validations()} />
  {:else if activeTab === 'ks'}
    <TabKsResults calc={calc()} />
  {:else if activeTab === 'ip'}
    <TabIpRetail bind:state calc={calc()} validations={validations()} />
  {:else if activeTab === 'summary'}
    <TabSummary calc={calc()} />
  {/if}
</div>
{/if}
