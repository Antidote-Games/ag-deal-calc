<script>
  import TabCampaign from './lib/TabCampaign.svelte';
  import TabBudget from './lib/TabBudget.svelte';
  import TabIpRoyalties from './lib/TabIpRoyalties.svelte';
  import TabKsAnalysis from './lib/TabKsAnalysis.svelte';
  import TabRetailInventory from './lib/TabRetailInventory.svelte';
  import TabProfitShare from './lib/TabProfitShare.svelte';
  import TabSummary from './lib/TabSummary.svelte';

  // Import example scenarios from JSON files
  const exampleModules = import.meta.glob('./examples/*.json', { eager: true });
  const presets = Object.values(exampleModules).map(m => m.default).sort((a, b) => a.label.localeCompare(b.label));

  const base = import.meta.env.BASE_URL;

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

  let activeTab = $state('campaign');

  let state = $state({
    projectName: 'Untitled Campaign',
    projectType: 'own', // 'own' or 'partner'
    antidoteProfitPct: 24,
    supportContract: false,
    // Creator budget contributions (partner projects only)
    creatorDevCost: 0,
    creatorMarketingCost: 0,
    creatorIpAdvance: 0,
    // Campaign
    totalBackers: 800,
    ppu: 4.5,
    printRun: 1200,
    devCost: 40000,
    marketingCost: 30000,
    platformFeeRate: 8,
    ipAdvance: 10000,
    ipRoyaltyRate: 6,
    // Deal partner (own titles only)
    partnerEnabled: false,
    partnerCommissionRate: 20,
    partnerRetailBonusRate: 3,
    // Post-KS sales
    wholesaleUnitsSold: 200,
    wholesalePrice: 20,
    directUnitsSold: 100,
    tiers: [
      { name: 'Base Game', price: 20, pct: 70, shippingCost: 6 },
      { name: 'Deluxe', price: 35, pct: 15, shippingCost: 8 },
      { name: 'Collector', price: 60, pct: 10, shippingCost: 10 },
      { name: 'All-In', price: 100, pct: 3, shippingCost: 12 },
      { name: 'Ultimate', price: 150, pct: 2, shippingCost: 15 },
    ],
    scenarios: [],
  });

  // Validations
  let validations = $derived(() => {
    const tierPctTotal = state.tiers.reduce((sum, t) => sum + (Number(t.pct) || 0), 0);
    const overageUnits = Math.max(0, state.printRun - state.totalBackers);
    const totalRetailUnits = (Number(state.wholesaleUnitsSold) || 0) + (Number(state.directUnitsSold) || 0);
    return {
      tierPctOff: Math.abs(tierPctTotal - 100) > 0.01,
      tierPctTotal,
      printRunLow: state.printRun < state.totalBackers,
      retailExceedsExtra: totalRetailUnits > overageUnits,
      totalRetailUnits,
    };
  });

  // All derived calculations
  let calc = $derived(() => {
    const totalBackers = Number(state.totalBackers) || 0;
    const ppu = Number(state.ppu) || 0;
    const printRun = Number(state.printRun) || 0;
    const devCost = Number(state.devCost) || 0;
    const marketingCost = Number(state.marketingCost) || 0;
    const platformFeeRate = (Number(state.platformFeeRate) || 0) / 100;
    const ipAdvance = Number(state.ipAdvance) || 0;
    const ipRoyaltyRate = (Number(state.ipRoyaltyRate) || 0) / 100;
    const wholesaleUnitsSold = Number(state.wholesaleUnitsSold) || 0;
    const wholesalePrice = Number(state.wholesalePrice) || 0;
    const directUnitsSold = Number(state.directUnitsSold) || 0;

    // Tier breakdown
    const basePrice = Number(state.tiers[0]?.price) || 0;
    const tierBreakdown = state.tiers.map((t, i) => {
      const name = t.name || `Tier ${i + 1}`;
      const price = Number(t.price) || 0;
      const pct = Number(t.pct) || 0;
      const shipping = Number(t.shippingCost) || 0;
      const backers = Math.round(totalBackers * (pct / 100));
      const revenue = backers * price;
      const premium = i === 0 ? 0 : Math.max(0, price - basePrice);
      const premiumCostPerUnit = premium * 0.50;
      const costPerUnit = ppu + premiumCostPerUnit;
      const mfgCost = backers * costPerUnit;
      const shippingTotal = backers * shipping;
      return { name, price, pct, backers, revenue, premium, premiumCostPerUnit, costPerUnit, mfgCost, shipping, shippingTotal };
    });

    // KS Revenue
    const ksRevenue = tierBreakdown.reduce((sum, t) => sum + t.revenue, 0);
    const avgPledge = totalBackers > 0 ? ksRevenue / totalBackers : 0;

    // KS Costs — all 6 deductions (backer units only for mfg)
    const backerMfgCost = tierBreakdown.reduce((sum, t) => sum + t.mfgCost, 0);
    const platformFees = ksRevenue * platformFeeRate;
    const shippingCost = tierBreakdown.reduce((sum, t) => sum + t.shippingTotal, 0);
    const ksCosts = devCost + marketingCost + ipAdvance + backerMfgCost + platformFees + shippingCost;
    const ksProfit = ksRevenue - ksCosts;

    // Break-even backers
    const avgMfgPerBacker = totalBackers > 0 ? backerMfgCost / totalBackers : 0;
    const avgShipPerBacker = totalBackers > 0 ? shippingCost / totalBackers : 0;
    const fixedCosts = devCost + marketingCost + ipAdvance;
    const revenuePerBacker = avgPledge * (1 - platformFeeRate) - avgMfgPerBacker - avgShipPerBacker;
    const breakEvenBackers = revenuePerBacker > 0 ? Math.ceil(fixedCosts / revenuePerBacker) : Infinity;

    // Overage / Inventory (separate from KS costs)
    const overageUnits = Math.max(0, printRun - totalBackers);
    const overageCost = overageUnits * ppu;

    // IP Royalties (not a KS Profit deduction — separate expense)
    const ipRoyaltyKS = ksRevenue * ipRoyaltyRate;

    // MSRP = Tier 1 price + 15%
    const msrp = Math.round(basePrice * 1.15 * 100) / 100;

    const isPartnerProject = state.projectType === 'partner';
    const antidoteProfitPct = (Number(state.antidoteProfitPct) || 0) / 100;
    const creatorProfitPct = 1 - antidoteProfitPct;

    // Creator budget contributions (partner projects)
    const creatorDevCost = isPartnerProject ? (Number(state.creatorDevCost) || 0) : 0;
    const creatorMarketingCost = isPartnerProject ? (Number(state.creatorMarketingCost) || 0) : 0;
    const creatorIpAdvance = isPartnerProject ? (Number(state.creatorIpAdvance) || 0) : 0;
    const creatorTotalContribution = creatorDevCost + creatorMarketingCost + creatorIpAdvance;

    // Antidote's contributions (total minus creator's share)
    const antidoteDevCost = devCost - creatorDevCost;
    const antidoteMarketingCost = marketingCost - creatorMarketingCost;
    const antidoteIpAdvance = ipAdvance - creatorIpAdvance;
    // Antidote always fronts operational costs (mfg, platform, shipping)
    const antidoteTotalContribution = antidoteDevCost + antidoteMarketingCost + antidoteIpAdvance + backerMfgCost + platformFees + shippingCost;
    const totalBudget = antidoteTotalContribution + creatorTotalContribution;
    const antidoteContribRatio = totalBudget > 0 ? antidoteTotalContribution / totalBudget : 1;
    const creatorContribRatio = totalBudget > 0 ? creatorTotalContribution / totalBudget : 0;

    // Partner project splits
    let creatorKsShare = 0;
    let antidoteKsShare = 0;
    let creatorLoss = 0;
    let antidoteLoss = 0;
    if (isPartnerProject) {
      if (ksProfit >= 0) {
        creatorKsShare = ksProfit * creatorProfitPct;
        antidoteKsShare = ksProfit * antidoteProfitPct;
      } else {
        // Losses shared by contribution ratio
        creatorLoss = Math.abs(ksProfit) * creatorContribRatio;
        antidoteLoss = Math.abs(ksProfit) * antidoteContribRatio;
      }
    }

    // Deal partner commission (own titles only)
    const dealPartnerActive = !isPartnerProject && state.partnerEnabled;
    const partnerCommissionRate = dealPartnerActive ? (Number(state.partnerCommissionRate) || 0) : 0;
    const partnerRetailBonusRate = dealPartnerActive ? (Number(state.partnerRetailBonusRate) || 0) : 0;
    const partnerCommission = Math.max(0, ksProfit * (partnerCommissionRate / 100));
    const antidoteKS = isPartnerProject
      ? antidoteKsShare - ipRoyaltyKS
      : ksProfit - partnerCommission - ipRoyaltyKS;

    // Overage — creator's cost on partner projects, Antidote's on own titles
    const overageCostAntidote = isPartnerProject ? 0 : overageCost;

    // Wholesale (retailer/distribution sales)
    const wholesaleRevenue = wholesaleUnitsSold * wholesalePrice;
    const wholesaleIPRoyalty = wholesaleRevenue * ipRoyaltyRate;

    // Direct sales (conventions, website — sold at MSRP)
    const directRevenue = directUnitsSold * msrp;
    const directIPRoyalty = directRevenue * ipRoyaltyRate;

    // Combined post-KS sales
    const showPostKs = !isPartnerProject || state.supportContract;
    const totalPostKsRevenue = showPostKs ? wholesaleRevenue + directRevenue : 0;
    const totalPostKsIPRoyalty = showPostKs ? wholesaleIPRoyalty + directIPRoyalty : 0;
    const totalPostKsUnits = showPostKs ? wholesaleUnitsSold + directUnitsSold : 0;
    const partnerRetailBonus = totalPostKsRevenue * (partnerRetailBonusRate / 100);

    // Post-KS split for partner projects with support contract
    let postKsCreatorShare = 0;
    let postKsAntidoteShare = 0;
    const postKsNetBeforeSplit = totalPostKsRevenue - totalPostKsIPRoyalty;
    if (isPartnerProject && state.supportContract) {
      postKsCreatorShare = postKsNetBeforeSplit * creatorProfitPct;
      postKsAntidoteShare = postKsNetBeforeSplit * antidoteProfitPct;
    }
    const postKsMargin = showPostKs
      ? (isPartnerProject ? postKsAntidoteShare : postKsNetBeforeSplit - partnerRetailBonus)
      : 0;

    // Summary P&L
    const grossRevenue = ksRevenue + totalPostKsRevenue;
    const totalExpenses = isPartnerProject
      ? ksCosts + ipRoyaltyKS + creatorKsShare + (state.supportContract ? totalPostKsIPRoyalty + postKsCreatorShare : 0)
      : ksCosts + ipRoyaltyKS + partnerCommission + overageCostAntidote + totalPostKsIPRoyalty + partnerRetailBonus;
    const netProfit = grossRevenue - totalExpenses;

    return {
      // Tier
      tierBreakdown, basePrice, msrp,
      // KS
      ksRevenue, avgPledge, backerMfgCost, platformFees, shippingCost,
      ksCosts, ksProfit, fixedCosts, revenuePerBacker, breakEvenBackers,
      // Costs
      devCost, marketingCost, ipAdvance,
      // Overage
      overageUnits, overageCost, overageCostAntidote,
      // IP
      ipRoyaltyKS, ipRoyaltyRate,
      // Project type
      isPartnerProject, showPostKs,
      // Partner project splits
      antidoteProfitPct, creatorProfitPct,
      creatorDevCost, creatorMarketingCost, creatorIpAdvance, creatorTotalContribution,
      antidoteDevCost, antidoteMarketingCost, antidoteIpAdvance, antidoteTotalContribution,
      totalBudget, antidoteContribRatio, creatorContribRatio,
      creatorKsShare, antidoteKsShare, creatorLoss, antidoteLoss,
      postKsCreatorShare, postKsAntidoteShare,
      // Deal partner (own titles)
      dealPartnerActive, partnerCommission, partnerCommissionRate, partnerRetailBonusRate, partnerRetailBonus, antidoteKS,
      // Wholesale
      wholesaleRevenue, wholesaleIPRoyalty, wholesaleUnitsSold,
      // Direct
      directRevenue, directIPRoyalty, directUnitsSold,
      // Combined post-KS
      totalPostKsRevenue, totalPostKsIPRoyalty, totalPostKsUnits, postKsMargin,
      // Summary
      grossRevenue, totalExpenses, netProfit,
    };
  });

  function applyPreset(preset) {
    const v = preset.values;
    state.projectName = v.projectName;
    state.devCost = v.devCost;
    state.marketingCost = v.marketingCost;
    state.ppu = v.ppu;
    state.printRun = v.printRun;
    state.totalBackers = v.totalBackers;
    state.platformFeeRate = v.platformFeeRate;
    state.ipAdvance = v.ipAdvance;
    state.ipRoyaltyRate = v.ipRoyaltyRate;
    state.wholesaleUnitsSold = v.wholesaleUnitsSold ?? v.retailUnitsSold ?? 200;
    state.wholesalePrice = v.wholesalePrice;
    state.directUnitsSold = v.directUnitsSold ?? Math.round((v.wholesaleUnitsSold ?? v.retailUnitsSold ?? 200) * 0.5);
    state.tiers = v.tiers.map((t, i) => ({ name: t.name || `Tier ${i + 1}`, ...t }));
  }

  function saveScenario() {
    const snapshot = {
      name: state.projectName,
      savedAt: new Date().toLocaleString(),
      inputs: JSON.parse(JSON.stringify({
        projectName: state.projectName,
        projectType: state.projectType,
        antidoteProfitPct: state.antidoteProfitPct,
        supportContract: state.supportContract,
        creatorDevCost: state.creatorDevCost,
        creatorMarketingCost: state.creatorMarketingCost,
        creatorIpAdvance: state.creatorIpAdvance,
        totalBackers: state.totalBackers,
        ppu: state.ppu,
        printRun: state.printRun,
        devCost: state.devCost,
        marketingCost: state.marketingCost,
        platformFeeRate: state.platformFeeRate,
        ipAdvance: state.ipAdvance,
        ipRoyaltyRate: state.ipRoyaltyRate,
        partnerEnabled: state.partnerEnabled,
        partnerCommissionRate: state.partnerCommissionRate,
        partnerRetailBonusRate: state.partnerRetailBonusRate,
        wholesaleUnitsSold: state.wholesaleUnitsSold,
        wholesalePrice: state.wholesalePrice,
        directUnitsSold: state.directUnitsSold,
        tiers: state.tiers,
      })),
      results: {
        ksRevenue: calc().ksRevenue,
        ksCosts: calc().ksCosts,
        ksProfit: calc().ksProfit,
        breakEvenBackers: calc().breakEvenBackers,
        partnerCommission: calc().partnerCommission,
        overageCost: calc().overageCost,
        postKsMargin: calc().postKsMargin,
        wholesaleRevenue: calc().wholesaleRevenue,
        directRevenue: calc().directRevenue,
        netProfit: calc().netProfit,
      },
    };
    state.scenarios = [...state.scenarios, snapshot];
  }

  function loadScenario(index) {
    const s = state.scenarios[index].inputs;
    Object.assign(state, JSON.parse(JSON.stringify(s)));
  }

  function deleteScenario(index) {
    state.scenarios = state.scenarios.filter((_, i) => i !== index);
  }

  let tabs = $derived((() => {
    const base = [
      { id: 'campaign', label: 'Campaign' },
      { id: 'budget', label: 'Budget' },
      { id: 'ip', label: 'IP & Royalties' },
      { id: 'ks', label: 'KS Analysis' },
    ];
    if (state.projectType === 'own' || state.supportContract) {
      base.push({ id: 'retail', label: 'Retail & Inventory' });
    }
    base.push({ id: 'profit', label: 'Profit Share' });
    base.push({ id: 'summary', label: 'Summary' });
    return base;
  })());
</script>

{#if !unlocked}
<div class="min-h-screen flex items-center justify-center px-4">
  <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm text-center">
    <img src="{base}logo.png" alt="Antidote Games" class="h-16 mx-auto mb-4" />
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
    <img src="{base}logo.png" alt="Antidote Games" class="h-12 w-auto" />
    <div>
      <h1 class="text-xl font-bold text-white">Campaign Planner</h1>
      <p class="text-sm text-white/80">Plan campaigns. Model revenue. Validate the deal.</p>
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
        class="px-5 py-2.5 text-sm font-semibold border-b-3 transition-colors whitespace-nowrap {activeTab === tab.id ? 'text-purple border-pink' : 'text-gray-mid border-transparent hover:text-purple'}"
        onclick={() => activeTab = tab.id}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'campaign'}
    <TabCampaign bind:state validations={validations()} />
  {:else if activeTab === 'budget'}
    <TabBudget bind:state validations={validations()} />
  {:else if activeTab === 'ip'}
    <TabIpRoyalties bind:state calc={calc()} />
  {:else if activeTab === 'ks'}
    <TabKsAnalysis bind:state calc={calc()} />
  {:else if activeTab === 'retail'}
    <TabRetailInventory bind:state calc={calc()} validations={validations()} />
  {:else if activeTab === 'profit'}
    <TabProfitShare bind:state calc={calc()} />
  {:else if activeTab === 'summary'}
    <TabSummary {state} calc={calc()} {saveScenario} {loadScenario} {deleteScenario} />
  {/if}
</div>
{/if}
