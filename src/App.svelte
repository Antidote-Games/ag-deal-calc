<script>
  import TabCampaign from './lib/TabCampaign.svelte';
  import TabProducts from './lib/TabProducts.svelte';
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

  let nextProductId = $state(10);
  function genProductId() { return 'p' + (nextProductId++); }

  let state = $state({
    projectName: 'Untitled Campaign',
    projectType: 'own', // 'own' or 'partner'
    antidoteProfitPct: 24,
    supportContract: false,
    // Creator budget contributions (partner projects only)
    creatorDevCost: 0,
    creatorMarketingCost: 0,
    creatorIpAdvance: 0,
    // Products
    products: [],
    // Budget line items
    devLineItems: [],
    marketingLineItems: [],
    // Campaign
    totalBackers: 0,
    printRun: 0,
    devCost: 0,
    marketingCost: 0,
    platformFeeRate: 8,
    ipEnabled: false,
    ipAdvance: 0,
    ipRoyaltyRate: 0,
    // Deal partner (own titles only)
    partnerEnabled: false,
    partnerCommissionRate: 20,
    partnerRetailBonusRate: 3,
    // Post-KS sales (per product)
    postKsSales: [],
    tiers: [],
    // Addons — products backers can add to any tier
    addons: [],
    scenarios: [],
  });

  // Validations
  let validations = $derived(() => {
    const tierPctTotal = state.tiers.reduce((sum, t) => sum + (Number(t.pct) || 0), 0);
    const totalRetailUnits = (state.postKsSales || []).reduce((sum, s) => sum + (Number(s.directUnits) || 0) + (Number(s.wholesaleUnits) || 0), 0);
    return {
      tierPctOff: Math.abs(tierPctTotal - 100) > 0.01,
      tierPctTotal,
      printRunLow: false, // checked via calc.physicalBackers now
      retailExceedsExtra: totalRetailUnits > overageUnits,
      totalRetailUnits,
    };
  });

  // Product lookup helper
  function getProduct(id) {
    return state.products.find(p => p.id === id);
  }

  function tierPpu(tier) {
    return (tier.products || []).reduce((sum, tp) => {
      const p = getProduct(tp.productId);
      return sum + ((p ? Number(p.ppu) || 0 : 0) * (Number(tp.qty) || 0));
    }, 0);
  }

  function tierWeight(tier) {
    return (tier.products || []).reduce((sum, tp) => {
      const p = getProduct(tp.productId);
      return sum + ((p ? Number(p.weight) || 0 : 0) * (Number(tp.qty) || 0));
    }, 0);
  }

  function tierSuggestedPrice(tier) {
    return (tier.products || []).reduce((sum, tp) => {
      const p = getProduct(tp.productId);
      return sum + ((p ? Number(p.suggestedPrice) || 0 : 0) * (Number(tp.qty) || 0));
    }, 0);
  }

  // All derived calculations
  let calc = $derived(() => {
    const totalBackers = Number(state.totalBackers) || 0;
    const printRun = Number(state.printRun) || 0;
    const devCost = Number(state.devCost) || 0;
    const marketingCost = Number(state.marketingCost) || 0;
    const platformFeeRate = (Number(state.platformFeeRate) || 0) / 100;
    const ipAdvance = state.ipEnabled ? (Number(state.ipAdvance) || 0) : 0;
    const ipRoyaltyRate = state.ipEnabled ? (Number(state.ipRoyaltyRate) || 0) / 100 : 0;

    // Tier breakdown — cost per unit from products
    const basePrice = Number(state.tiers[0]?.price) || 0;
    const tierBreakdown = state.tiers.map((t, i) => {
      const name = t.name || `Tier ${i + 1}`;
      const price = Number(t.price) || 0;
      const pct = Number(t.pct) || 0;
      const shipping = Number(t.shippingCost) || 0;
      const backers = Math.round(totalBackers * (pct / 100));
      const revenue = backers * price;
      const costPerUnit = tierPpu(t);
      const weight = tierWeight(t);
      const mfgCost = backers * costPerUnit;
      const shippingTotal = backers * shipping;
      const productList = (t.products || []).map(tp => {
        const p = getProduct(tp.productId);
        return { name: p?.name || '?', qty: tp.qty, ppu: p ? Number(p.ppu) || 0 : 0 };
      });
      return { name, price, pct, backers, revenue, costPerUnit, weight, mfgCost, shipping, shippingTotal, productList };
    });

    // Addon breakdown
    const addonBreakdown = (state.addons || []).map(a => {
      const product = getProduct(a.productId);
      const name = product?.name || '?';
      const price = Number(a.price) || 0;
      const ppu = product ? Number(product.ppu) || 0 : 0;
      const attachRate = (Number(a.attachRate) || 0) / 100;
      const unitsSold = Math.round(totalBackers * attachRate);
      const revenue = unitsSold * price;
      const mfgCost = unitsSold * ppu;
      const shippingPerUnit = Number(a.shippingCost) || 0;
      const shippingTotal = unitsSold * shippingPerUnit;
      return { name, price, ppu, attachRate: a.attachRate, unitsSold, revenue, mfgCost, shippingPerUnit, shippingTotal };
    });

    const addonRevenue = addonBreakdown.reduce((sum, a) => sum + a.revenue, 0);
    const addonMfgCost = addonBreakdown.reduce((sum, a) => sum + a.mfgCost, 0);
    const addonShippingCost = addonBreakdown.reduce((sum, a) => sum + a.shippingTotal, 0);

    // KS Revenue (tiers + addons)
    const tierRevenue = tierBreakdown.reduce((sum, t) => sum + t.revenue, 0);
    const ksRevenue = tierRevenue + addonRevenue;
    const avgPledge = totalBackers > 0 ? ksRevenue / totalBackers : 0;

    // KS Costs — all 6 deductions (backer units only for mfg)
    const backerMfgCost = tierBreakdown.reduce((sum, t) => sum + t.mfgCost, 0) + addonMfgCost;
    const platformFees = ksRevenue * platformFeeRate;
    const shippingCost = tierBreakdown.reduce((sum, t) => sum + t.shippingTotal, 0) + addonShippingCost;
    const ksCosts = devCost + marketingCost + ipAdvance + backerMfgCost + platformFees + shippingCost;
    const ksProfit = ksRevenue - ksCosts;

    // Break-even backers
    const avgMfgPerBacker = totalBackers > 0 ? backerMfgCost / totalBackers : 0;
    const avgShipPerBacker = totalBackers > 0 ? shippingCost / totalBackers : 0;
    const fixedCosts = devCost + marketingCost + ipAdvance;
    const revenuePerBacker = avgPledge * (1 - platformFeeRate) - avgMfgPerBacker - avgShipPerBacker;
    const breakEvenBackers = revenuePerBacker > 0 ? Math.ceil(fixedCosts / revenuePerBacker) : Infinity;

    // Overage / Inventory (separate from KS costs)
    // Only backers receiving physical products need manufactured units
    const physicalBackers = tierBreakdown
      .filter(t => t.costPerUnit > 0)
      .reduce((sum, t) => sum + t.backers, 0);
    const overageUnits = Math.max(0, printRun - physicalBackers);
    const overageCost = (state.postKsSales || []).reduce((sum, s) => {
      const product = getProduct(s.productId);
      const ppu = product ? Number(product.ppu) || 0 : 0;
      const units = (Number(s.directUnits) || 0) + (Number(s.wholesaleUnits) || 0);
      return sum + (units * ppu);
    }, 0);

    // IP Royalties (not a KS Profit deduction — separate expense)
    const ipRoyaltyKS = ksRevenue * ipRoyaltyRate;

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

    // Post-KS sales — per product
    const showPostKs = !isPartnerProject || state.supportContract;
    const postKsSalesBreakdown = (state.postKsSales || []).map(s => {
      const product = getProduct(s.productId);
      const name = product?.name || '?';
      const ppu = product ? Number(product.ppu) || 0 : 0;
      const msrpPrice = Math.round((Number(s.msrp) || 0) * 100) / 100;
      const wholesalePrice = Math.round((Number(s.wholesalePrice) || 0) * 100) / 100;
      const directUnits = showPostKs ? (Number(s.directUnits) || 0) : 0;
      const wholesaleUnits = showPostKs ? (Number(s.wholesaleUnits) || 0) : 0;
      const directRevenue = directUnits * msrpPrice;
      const wholesaleRevenue = wholesaleUnits * wholesalePrice;
      const totalRevenue = directRevenue + wholesaleRevenue;
      const totalUnits = directUnits + wholesaleUnits;
      const totalIPRoyalty = totalRevenue * ipRoyaltyRate;
      return { productId: s.productId, name, ppu, msrpPrice, wholesalePrice, directUnits, wholesaleUnits, directRevenue, wholesaleRevenue, totalRevenue, totalUnits, totalIPRoyalty };
    });

    const wholesaleRevenue = postKsSalesBreakdown.reduce((sum, s) => sum + s.wholesaleRevenue, 0);
    const directRevenue = postKsSalesBreakdown.reduce((sum, s) => sum + s.directRevenue, 0);
    const wholesaleUnitsSold = postKsSalesBreakdown.reduce((sum, s) => sum + s.wholesaleUnits, 0);
    const directUnitsSold = postKsSalesBreakdown.reduce((sum, s) => sum + s.directUnits, 0);
    const totalPostKsRevenue = wholesaleRevenue + directRevenue;
    const totalPostKsIPRoyalty = totalPostKsRevenue * ipRoyaltyRate;
    const totalPostKsUnits = wholesaleUnitsSold + directUnitsSold;
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

    // Summary P&L — always from Antidote's perspective
    const grossRevenue = ksRevenue + totalPostKsRevenue;
    let netProfit;
    let totalExpenses;
    if (isPartnerProject) {
      if (ksProfit >= 0) {
        // Antidote gets their share of profit minus IP royalties
        netProfit = antidoteKsShare - ipRoyaltyKS + (state.supportContract ? postKsAntidoteShare : 0);
      } else {
        // Antidote absorbs their share of loss plus IP royalties
        netProfit = -antidoteLoss - ipRoyaltyKS + (state.supportContract ? postKsAntidoteShare : 0);
      }
      totalExpenses = grossRevenue - netProfit;
    } else {
      totalExpenses = ksCosts + ipRoyaltyKS + partnerCommission + overageCostAntidote + totalPostKsIPRoyalty + partnerRetailBonus;
      netProfit = grossRevenue - totalExpenses;
    }

    return {
      // Tier
      tierBreakdown, basePrice, tierRevenue,
      // Addons
      addonBreakdown, addonRevenue, addonMfgCost, addonShippingCost,
      // KS
      ksRevenue, avgPledge, backerMfgCost, platformFees, shippingCost,
      ksCosts, ksProfit, fixedCosts, revenuePerBacker, breakEvenBackers,
      // Costs
      devCost, marketingCost, ipAdvance,
      // Overage
      physicalBackers, overageUnits, overageCost, overageCostAntidote,
      // IP
      ipEnabled: state.ipEnabled, ipRoyaltyKS, ipRoyaltyRate,
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
      // Post-KS sales
      postKsSalesBreakdown, wholesaleRevenue, directRevenue, wholesaleUnitsSold, directUnitsSold,
      // Combined post-KS
      totalPostKsRevenue, totalPostKsIPRoyalty, totalPostKsUnits, postKsMargin,
      // Summary
      grossRevenue, totalExpenses, netProfit,
    };
  });

  function applyPreset(preset) {
    const v = preset.values;
    // Reset all toggles/modes to defaults
    state.projectType = v.projectType || 'own';
    state.antidoteProfitPct = v.antidoteProfitPct ?? 24;
    state.supportContract = v.supportContract ?? false;
    state.creatorDevCost = v.creatorDevCost ?? 0;
    state.creatorMarketingCost = v.creatorMarketingCost ?? 0;
    state.creatorIpAdvance = v.creatorIpAdvance ?? 0;
    state.ipEnabled = v.ipEnabled ?? false;
    state.partnerEnabled = v.partnerEnabled ?? false;
    state.partnerCommissionRate = v.partnerCommissionRate ?? 20;
    state.partnerRetailBonusRate = v.partnerRetailBonusRate ?? 3;
    // Core values
    state.projectName = v.projectName;
    state.devCost = v.devCost;
    state.marketingCost = v.marketingCost;
    state.printRun = v.printRun;
    state.totalBackers = v.totalBackers;
    state.platformFeeRate = v.platformFeeRate;
    state.ipAdvance = v.ipAdvance;
    state.ipRoyaltyRate = v.ipRoyaltyRate;
    if (v.postKsSales) {
      state.postKsSales = v.postKsSales.map(s => ({ ...s }));
    } else {
      // Legacy preset — no post-KS sales
      state.postKsSales = [];
    }
    if (v.products) {
      state.products = v.products.map(p => ({ ...p }));
      state.tiers = v.tiers.map((t, i) => ({
        name: t.name || `Tier ${i + 1}`,
        products: (t.products || []).map(tp => ({ ...tp })),
        price: t.price, pct: t.pct, shippingCost: t.shippingCost,
      }));
    } else {
      // Legacy preset without products — create a single product from old PPU
      const legacyPpu = v.ppu || 4.5;
      state.products = [{ id: 'p1', name: 'Core Game', ppu: legacyPpu, weight: 1.0, suggestedPrice: v.tiers[0]?.price || 20 }];
      state.tiers = v.tiers.map((t, i) => ({
        name: t.name || `Tier ${i + 1}`,
        products: [{ productId: 'p1', qty: 1 }],
        price: t.price, pct: t.pct, shippingCost: t.shippingCost,
      }));
    }
    state.addons = (v.addons || []).map(a => ({ ...a }));
    state.devLineItems = (v.devLineItems || []).map(li => ({ ...li }));
    state.marketingLineItems = (v.marketingLineItems || []).map(li => ({ ...li }));
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
        products: state.products,
        devLineItems: state.devLineItems,
        marketingLineItems: state.marketingLineItems,
        totalBackers: state.totalBackers,
        printRun: state.printRun,
        devCost: state.devCost,
        marketingCost: state.marketingCost,
        platformFeeRate: state.platformFeeRate,
        ipEnabled: state.ipEnabled,
        ipAdvance: state.ipAdvance,
        ipRoyaltyRate: state.ipRoyaltyRate,
        partnerEnabled: state.partnerEnabled,
        partnerCommissionRate: state.partnerCommissionRate,
        partnerRetailBonusRate: state.partnerRetailBonusRate,
        postKsSales: state.postKsSales,
        tiers: state.tiers,
        addons: state.addons,
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
    const s = JSON.parse(JSON.stringify(state.scenarios[index].inputs));
    // Apply with defaults for any missing fields
    state.projectName = s.projectName ?? 'Untitled Campaign';
    state.projectType = s.projectType ?? 'own';
    state.antidoteProfitPct = s.antidoteProfitPct ?? 24;
    state.supportContract = s.supportContract ?? false;
    state.creatorDevCost = s.creatorDevCost ?? 0;
    state.creatorMarketingCost = s.creatorMarketingCost ?? 0;
    state.creatorIpAdvance = s.creatorIpAdvance ?? 0;
    state.products = s.products ?? [];
    state.devLineItems = s.devLineItems ?? [];
    state.marketingLineItems = s.marketingLineItems ?? [];
    state.totalBackers = s.totalBackers ?? 0;
    state.printRun = s.printRun ?? 0;
    state.devCost = s.devCost ?? 0;
    state.marketingCost = s.marketingCost ?? 0;
    state.platformFeeRate = s.platformFeeRate ?? 8;
    state.ipEnabled = s.ipEnabled ?? false;
    state.ipAdvance = s.ipAdvance ?? 0;
    state.ipRoyaltyRate = s.ipRoyaltyRate ?? 0;
    state.partnerEnabled = s.partnerEnabled ?? false;
    state.partnerCommissionRate = s.partnerCommissionRate ?? 20;
    state.partnerRetailBonusRate = s.partnerRetailBonusRate ?? 3;
    state.postKsSales = s.postKsSales ?? [];
    state.tiers = s.tiers ?? [];
    state.addons = s.addons ?? [];
  }

  function deleteScenario(index) {
    state.scenarios = state.scenarios.filter((_, i) => i !== index);
  }

  let tabs = $derived((() => {
    const base = [
      { id: 'campaign', label: 'Campaign' },
      { id: 'products', label: 'Products' },
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
    <TabCampaign bind:appState={state} validations={validations()} {tierPpu} {tierWeight} {tierSuggestedPrice} />
  {:else if activeTab === 'products'}
    <TabProducts bind:appState={state} {genProductId} />
  {:else if activeTab === 'budget'}
    <TabBudget bind:appState={state} validations={validations()} calc={calc()} />
  {:else if activeTab === 'ip'}
    <TabIpRoyalties bind:appState={state} calc={calc()} />
  {:else if activeTab === 'ks'}
    <TabKsAnalysis bind:appState={state} calc={calc()} />
  {:else if activeTab === 'retail'}
    <TabRetailInventory bind:appState={state} calc={calc()} validations={validations()} />
  {:else if activeTab === 'profit'}
    <TabProfitShare bind:appState={state} calc={calc()} />
  {:else if activeTab === 'summary'}
    <TabSummary appState={state} calc={calc()} {saveScenario} {loadScenario} {deleteScenario} />
  {/if}
</div>
{/if}
