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

  // Get unique product types for scenario selection
  const productTypes = [...new Set(presets.map(p => p.type))].sort();
  let selectedType = $state(productTypes[0] || '');

  // Get available sizes for the selected type
  let availableSizes = $derived(
    presets
      .filter(p => p.type === selectedType)
      .sort((a, b) => {
        const sizeOrder = { Small: 1, Moderate: 2, Large: 3 };
        return (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99);
      })
  );

  let nextProductId = $state(10);
  function genProductId() { return 'p' + (nextProductId++); }

  let state = $state({
    projectName: 'Untitled Campaign',
    projectType: 'own', // 'own' or 'partner'
    antidoteProfitPct: 25,
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
    // Backers pay shipping via the pledge manager, so it's not a campaign cost.
    // This is the optional net amount Antidote chooses to eat (free-shipping
    // promos, under-collection buffer). Usually 0.
    shippingSubsidy: 0,
    platformFeeRate: 13.5,
    ipEnabled: false,
    ipAdvance: 0,
    // Royalty structure: 'flat' uses each channel's own rate; 'brackets' uses a
    // marginal schedule over cumulative royalty-base revenue across the whole
    // deal (KS first, then post-KS), like tax brackets.
    ipRoyaltyStructure: 'flat',
    // Per-channel royalty config. basis 'net' = % of revenue collected;
    // 'msrp' = units x MSRP x rate regardless of realized price (post-KS
    // channels only — KS is always on money collected).
    ipChannels: [
      { key: 'ks', label: 'Kickstarter', rate: 0, basis: 'net' },
      { key: 'direct', label: 'D2C', rate: 0, basis: 'net' },
      { key: 'wholesale', label: 'Wholesale', rate: 0, basis: 'net' },
    ],
    // Brackets in ascending order; upTo null = everything above the last threshold.
    ipBrackets: [
      { upTo: 200000, rate: 8 },
      { upTo: 500000, rate: 10 },
      { upTo: null, rate: 12 },
    ],
    // Deal partners (own titles only) — list of { name, commissionRate, retailBonusRate }
    // Each partner takes a % of KS profit and a % of post-KS retail revenue.
    dealPartners: [],
    // Post-KS sales (per product)
    postKsSales: [],
    // Auto D2C: post-KS plan follows the print run — the entire overage is sold
    // direct, split across products by backer-demand mix. Manual unit entries
    // are kept but ignored while this is on.
    autoOverageD2C: false,
    tiers: [],
    // Addons — products backers can add to any tier
    addons: [],
    scenarios: [],
  });

  // Validations
  let validations = $derived(() => {
    const tierPctTotal = state.tiers.reduce((sum, t) => sum + (Number(t.pct) || 0), 0);
    return {
      tierPctOff: Math.abs(tierPctTotal - 100) > 0.01,
      tierPctTotal,
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
    const shippingSubsidy = Number(state.shippingSubsidy) || 0;
    const platformFeeRate = (Number(state.platformFeeRate) || 0) / 100;
    const ipAdvance = state.ipEnabled ? (Number(state.ipAdvance) || 0) : 0;
    const royStructure = state.ipRoyaltyStructure || 'flat';
    const royChannels = state.ipChannels || [];
    const chan = key => royChannels.find(c => c.key === key) || { rate: 0, basis: 'net' };
    const chanRate = key => state.ipEnabled ? (Number(chan(key).rate) || 0) / 100 : 0;

    // Tier breakdown — cost per unit from products
    const basePrice = Number(state.tiers[0]?.price) || 0;
    const tierBreakdown = state.tiers.map((t, i) => {
      const name = t.name || `Tier ${i + 1}`;
      const price = Number(t.price) || 0;
      const pct = Number(t.pct) || 0;
      const backers = Math.round(totalBackers * (pct / 100));
      const revenue = backers * price;
      const costPerUnit = tierPpu(t);
      const weight = tierWeight(t);
      const mfgCost = backers * costPerUnit;
      const productList = (t.products || []).map(tp => {
        const p = getProduct(tp.productId);
        return { name: p?.name || '?', qty: tp.qty, ppu: p ? Number(p.ppu) || 0 : 0 };
      });
      return { name, price, pct, backers, revenue, costPerUnit, weight, mfgCost, productList };
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
      return { name, price, ppu, attachRate: a.attachRate, unitsSold, revenue, mfgCost };
    });

    const addonRevenue = addonBreakdown.reduce((sum, a) => sum + a.revenue, 0);
    const addonMfgCost = addonBreakdown.reduce((sum, a) => sum + a.mfgCost, 0);

    // KS Revenue (tiers + addons)
    const tierRevenue = tierBreakdown.reduce((sum, t) => sum + t.revenue, 0);
    const ksRevenue = tierRevenue + addonRevenue;
    const avgPledge = totalBackers > 0 ? ksRevenue / totalBackers : 0;

    // KS Costs — 5 deductions plus any shipping subsidy (backer units only for mfg).
    // Shipping itself is backer-paid via the pledge manager, so it never appears here.
    const backerMfgCost = tierBreakdown.reduce((sum, t) => sum + t.mfgCost, 0) + addonMfgCost;
    const platformFees = ksRevenue * platformFeeRate;
    const ksCosts = devCost + marketingCost + ipAdvance + backerMfgCost + platformFees + shippingSubsidy;
    const ksProfit = ksRevenue - ksCosts;

    // Break-even backers
    const avgMfgPerBacker = totalBackers > 0 ? backerMfgCost / totalBackers : 0;
    const fixedCosts = devCost + marketingCost + ipAdvance + shippingSubsidy;
    const revenuePerBacker = avgPledge * (1 - platformFeeRate) - avgMfgPerBacker;
    const breakEvenBackers = revenuePerBacker > 0 ? Math.ceil(fixedCosts / revenuePerBacker) : Infinity;

    // Overage / Inventory (separate from KS costs)
    // Only backers receiving physical products need manufactured units
    const physicalBackers = tierBreakdown
      .filter(t => t.costPerUnit > 0)
      .reduce((sum, t) => sum + t.backers, 0);
    const overageUnits = Math.max(0, printRun - physicalBackers);

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
    // Antidote always fronts operational costs (mfg, platform, any shipping subsidy)
    const antidoteTotalContribution = antidoteDevCost + antidoteMarketingCost + antidoteIpAdvance + backerMfgCost + platformFees + shippingSubsidy;
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

    // Post-KS sales — per product
    const showPostKs = !isPartnerProject || state.supportContract;

    // Auto D2C: allocate the entire overage as direct sales, split across the
    // post-KS products proportionally to their share of backer demand.
    const autoOverage = !!state.autoOverageD2C;
    const autoDirectByProduct = {};
    if (autoOverage) {
      const entries = state.postKsSales || [];
      const backerUnitsByProduct = {};
      state.tiers.forEach((t, i) => {
        (t.products || []).forEach(tp => {
          backerUnitsByProduct[tp.productId] = (backerUnitsByProduct[tp.productId] || 0) + tierBreakdown[i].backers * (Number(tp.qty) || 0);
        });
      });
      (state.addons || []).forEach((a, i) => {
        backerUnitsByProduct[a.productId] = (backerUnitsByProduct[a.productId] || 0) + addonBreakdown[i].unitsSold;
      });
      const weights = entries.map(s => backerUnitsByProduct[s.productId] || 0);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let remaining = overageUnits;
      entries.forEach((s, i) => {
        const share = i === entries.length - 1
          ? remaining
          : Math.min(remaining, totalWeight > 0
              ? Math.round(overageUnits * (weights[i] / totalWeight))
              : Math.round(overageUnits / entries.length));
        remaining -= share;
        autoDirectByProduct[s.productId] = share;
      });
    }

    const postKsSalesBreakdown = (state.postKsSales || []).map(s => {
      const product = getProduct(s.productId);
      const name = product?.name || '?';
      const ppu = product ? Number(product.ppu) || 0 : 0;
      const msrpPrice = Math.round((Number(s.msrp) || 0) * 100) / 100;
      const wholesalePrice = Math.round((Number(s.wholesalePrice) || 0) * 100) / 100;
      const directUnits = showPostKs ? (autoOverage ? (autoDirectByProduct[s.productId] || 0) : Number(s.directUnits) || 0) : 0;
      const wholesaleUnits = (showPostKs && !autoOverage) ? (Number(s.wholesaleUnits) || 0) : 0;
      const directRevenue = directUnits * msrpPrice;
      const wholesaleRevenue = wholesaleUnits * wholesalePrice;
      const totalRevenue = directRevenue + wholesaleRevenue;
      const totalUnits = directUnits + wholesaleUnits;
      return { productId: s.productId, name, ppu, msrpPrice, wholesalePrice, directUnits, wholesaleUnits, directRevenue, wholesaleRevenue, totalRevenue, totalUnits };
    });

    const wholesaleRevenue = postKsSalesBreakdown.reduce((sum, s) => sum + s.wholesaleRevenue, 0);
    const directRevenue = postKsSalesBreakdown.reduce((sum, s) => sum + s.directRevenue, 0);
    const wholesaleUnitsSold = postKsSalesBreakdown.reduce((sum, s) => sum + s.wholesaleUnits, 0);
    const directUnitsSold = postKsSalesBreakdown.reduce((sum, s) => sum + s.directUnits, 0);
    const totalPostKsRevenue = wholesaleRevenue + directRevenue;
    const totalPostKsUnits = wholesaleUnitsSold + directUnitsSold;

    // Overage cost — every printed unit is paid for. Planned post-KS units are
    // costed at their product's PPU; unallocated overage (printed but not planned
    // for sale anywhere) at the average cost of a physical backer bundle.
    const plannedOverageCost = postKsSalesBreakdown.reduce((sum, s) => sum + s.totalUnits * s.ppu, 0);
    const unallocatedUnits = Math.max(0, overageUnits - totalPostKsUnits);
    const physicalTierMfgCost = tierBreakdown.filter(t => t.costPerUnit > 0).reduce((sum, t) => sum + t.mfgCost, 0);
    const avgUnitPpu = physicalBackers > 0 ? physicalTierMfgCost / physicalBackers : 0;
    const unallocatedCost = unallocatedUnits * avgUnitPpu;
    const overageCost = plannedOverageCost + unallocatedCost;
    // Overage — creator's cost on partner projects, Antidote's on own titles
    const overageCostAntidote = isPartnerProject ? 0 : overageCost;

    // Royalty base per channel. 'net' = revenue actually collected; 'msrp' =
    // units x MSRP regardless of realized price (matters mostly for wholesale,
    // where money collected is well below sticker).
    const royaltyBaseKS = ksRevenue;
    const royaltyBaseDirect = chan('direct').basis === 'msrp'
      ? postKsSalesBreakdown.reduce((sum, s) => sum + s.directUnits * s.msrpPrice, 0)
      : directRevenue;
    const royaltyBaseWholesale = chan('wholesale').basis === 'msrp'
      ? postKsSalesBreakdown.reduce((sum, s) => sum + s.wholesaleUnits * s.msrpPrice, 0)
      : wholesaleRevenue;
    const royaltyBasePostKs = royaltyBaseDirect + royaltyBaseWholesale;
    const royaltyBaseTotal = royaltyBaseKS + royaltyBasePostKs;

    // Marginal bracket schedule over cumulative base, like tax brackets.
    // Revenue above the last finite threshold pays the last bracket's rate.
    const royBrackets = state.ipBrackets || [];
    function bracketRoyalty(x) {
      let royalty = 0, prev = 0, lastRate = 0;
      for (const b of royBrackets) {
        const cap = (b.upTo == null || b.upTo === '') ? Infinity : Number(b.upTo) || 0;
        lastRate = (Number(b.rate) || 0) / 100;
        royalty += Math.max(0, Math.min(x, cap) - prev) * lastRate;
        prev = cap;
        if (x <= cap) return royalty;
      }
      return royalty + Math.max(0, x - prev) * lastRate;
    }

    let earnedRoyaltyKS = 0, earnedRoyaltyDirect = 0, earnedRoyaltyWholesale = 0;
    if (state.ipEnabled && royStructure === 'brackets') {
      // Brackets consume cumulative base across the whole deal: KS revenue
      // first, then post-KS. Post-KS royalty is attributed pro-rata by base.
      earnedRoyaltyKS = bracketRoyalty(royaltyBaseKS);
      const postKsRoyalty = bracketRoyalty(royaltyBaseTotal) - earnedRoyaltyKS;
      earnedRoyaltyDirect = royaltyBasePostKs > 0 ? postKsRoyalty * (royaltyBaseDirect / royaltyBasePostKs) : 0;
      earnedRoyaltyWholesale = royaltyBasePostKs > 0 ? postKsRoyalty * (royaltyBaseWholesale / royaltyBasePostKs) : 0;
    } else if (state.ipEnabled) {
      earnedRoyaltyKS = royaltyBaseKS * chanRate('ks');
      earnedRoyaltyDirect = royaltyBaseDirect * chanRate('direct');
      earnedRoyaltyWholesale = royaltyBaseWholesale * chanRate('wholesale');
    }
    const earnedRoyaltyPostKs = earnedRoyaltyDirect + earnedRoyaltyWholesale;

    // IP Advance / MG: the advance is a minimum guarantee against royalties, not a fee on top.
    // Earned royalties recoup the advance first (KS sales chronologically first, then post-KS);
    // only royalties beyond the advance are paid on top. Total IP cost = max(advance, earned royalties).
    const earnedRoyaltyTotal = earnedRoyaltyKS + earnedRoyaltyPostKs;
    const royaltyDueKS = Math.max(0, earnedRoyaltyKS - ipAdvance);
    const advanceRemainingAfterKS = Math.max(0, ipAdvance - earnedRoyaltyKS);
    const royaltyDuePostKs = Math.max(0, earnedRoyaltyPostKs - advanceRemainingAfterKS);
    const royaltyDue = royaltyDueKS + royaltyDuePostKs;          // = max(0, earnedRoyaltyTotal - ipAdvance)
    const ipRecouped = Math.min(ipAdvance, earnedRoyaltyTotal);  // advance paid down by royalties
    const unrecoupedAdvance = ipAdvance - ipRecouped;            // forfeited minimum when sales are weak
    const ipEarnedOut = ipAdvance > 0 && earnedRoyaltyTotal >= ipAdvance;
    const totalIpCost = ipAdvance + royaltyDue;                  // = max(ipAdvance, earnedRoyaltyTotal)

    // Effective royalty rates for sanity checks / deal comparison. Per-unit and
    // %-of-net are on actual units sold and money collected, whatever the basis.
    const royaltyUnits = state.tiers.reduce((sum, t, i) =>
      sum + tierBreakdown[i].backers * (t.products || []).reduce((s, tp) => s + (Number(tp.qty) || 0), 0), 0)
      + addonBreakdown.reduce((s, a) => s + a.unitsSold, 0)
      + totalPostKsUnits;
    const netCollected = ksRevenue + totalPostKsRevenue;
    const effectiveRoyaltyPerUnit = royaltyUnits > 0 ? earnedRoyaltyTotal / royaltyUnits : 0;
    const effectiveRoyaltyPctNet = netCollected > 0 ? earnedRoyaltyTotal / netCollected : 0;
    // Deal partners (own titles only). Each partner's rate is stacked: it applies to the
    // same base (KS profit / post-KS revenue) as every other partner, not cascaded.
    const dealPartnerBreakdown = (isPartnerProject ? [] : (state.dealPartners || [])).map((p, i) => {
      const name = (p.name || '').trim() || `Partner ${i + 1}`;
      const commissionRate = Number(p.commissionRate) || 0;
      const retailBonusRate = Number(p.retailBonusRate) || 0;
      const commission = Math.max(0, ksProfit * (commissionRate / 100));
      const retailBonus = totalPostKsRevenue * (retailBonusRate / 100);
      return { name, commissionRate, retailBonusRate, commission, retailBonus, total: commission + retailBonus };
    });
    const dealPartnerActive = dealPartnerBreakdown.length > 0;
    const partnerCommission = dealPartnerBreakdown.reduce((sum, p) => sum + p.commission, 0);
    const partnerRetailBonus = dealPartnerBreakdown.reduce((sum, p) => sum + p.retailBonus, 0);
    const totalPartnerCommissionRate = dealPartnerBreakdown.reduce((sum, p) => sum + p.commissionRate, 0);
    const totalPartnerRetailBonusRate = dealPartnerBreakdown.reduce((sum, p) => sum + p.retailBonusRate, 0);
    const antidoteKS = isPartnerProject
      ? antidoteKsShare - royaltyDueKS
      : ksProfit - partnerCommission - royaltyDueKS;

    // Post-KS split for partner projects with support contract
    let postKsCreatorShare = 0;
    let postKsAntidoteShare = 0;
    const postKsNetBeforeSplit = totalPostKsRevenue - royaltyDuePostKs;
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
        // Antidote gets their share of profit minus IP royalties due (after MG recoupment)
        netProfit = antidoteKsShare - royaltyDueKS + (state.supportContract ? postKsAntidoteShare : 0);
      } else {
        // Antidote absorbs their share of loss plus IP royalties due
        netProfit = -antidoteLoss - royaltyDueKS + (state.supportContract ? postKsAntidoteShare : 0);
      }
      totalExpenses = grossRevenue - netProfit;
    } else {
      totalExpenses = ksCosts + royaltyDueKS + partnerCommission + overageCostAntidote + royaltyDuePostKs + partnerRetailBonus;
      netProfit = grossRevenue - totalExpenses;
    }

    return {
      // Tier
      tierBreakdown, basePrice, tierRevenue,
      // Addons
      addonBreakdown, addonRevenue, addonMfgCost,
      // KS
      ksRevenue, avgPledge, backerMfgCost, platformFees, shippingSubsidy,
      ksCosts, ksProfit, fixedCosts, revenuePerBacker, breakEvenBackers,
      // Costs
      devCost, marketingCost, ipAdvance,
      // Overage
      physicalBackers, overageUnits, overageCost, overageCostAntidote,
      plannedOverageCost, unallocatedUnits, unallocatedCost, autoOverage,
      // IP
      ipEnabled: state.ipEnabled, ipRoyaltyStructure: royStructure,
      royaltyBaseKS, royaltyBaseDirect, royaltyBaseWholesale, royaltyBasePostKs, royaltyBaseTotal,
      royaltyUnits, netCollected, effectiveRoyaltyPerUnit, effectiveRoyaltyPctNet,
      // IP Advance / MG recoupment
      earnedRoyaltyKS, earnedRoyaltyDirect, earnedRoyaltyWholesale, earnedRoyaltyPostKs, earnedRoyaltyTotal,
      royaltyDueKS, royaltyDuePostKs, royaltyDue,
      ipRecouped, unrecoupedAdvance, ipEarnedOut, totalIpCost,
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
      dealPartnerActive, dealPartnerBreakdown, partnerCommission, partnerRetailBonus, totalPartnerCommissionRate, totalPartnerRetailBonusRate, antidoteKS,
      // Post-KS sales
      postKsSalesBreakdown, wholesaleRevenue, directRevenue, wholesaleUnitsSold, directUnitsSold,
      // Combined post-KS
      totalPostKsRevenue, totalPostKsUnits, postKsMargin,
      // Summary
      grossRevenue, totalExpenses, netProfit,
    };
  });

  // Normalize royalty config from either the new structured form or the legacy
  // single flat rate (applied to every channel).
  function migrateRoyalty(src) {
    const legacy = Number(src.ipRoyaltyRate) || 0;
    return {
      structure: src.ipRoyaltyStructure ?? 'flat',
      channels: Array.isArray(src.ipChannels)
        ? src.ipChannels.map(c => ({ basis: 'net', ...c }))
        : [
            { key: 'ks', label: 'Kickstarter', rate: legacy, basis: 'net' },
            { key: 'direct', label: 'D2C', rate: legacy, basis: 'net' },
            { key: 'wholesale', label: 'Wholesale', rate: legacy, basis: 'net' },
          ],
      brackets: Array.isArray(src.ipBrackets)
        ? src.ipBrackets.map(b => ({ ...b }))
        : [
            { upTo: 200000, rate: 8 },
            { upTo: 500000, rate: 10 },
            { upTo: null, rate: 12 },
          ],
    };
  }

  // Normalize deal partners from either the new list form or legacy single-partner fields.
  function migrateDealPartners(src) {
    if (Array.isArray(src.dealPartners)) {
      return src.dealPartners.map(p => ({
        name: p.name ?? '',
        commissionRate: p.commissionRate ?? 0,
        retailBonusRate: p.retailBonusRate ?? 0,
      }));
    }
    if (src.partnerEnabled) {
      return [{
        name: 'Deal Partner',
        commissionRate: src.partnerCommissionRate ?? 20,
        retailBonusRate: src.partnerRetailBonusRate ?? 3,
      }];
    }
    return [];
  }

  function applyPreset(preset) {
    const v = preset.values;
    // Preserve user's project type selection, only apply preset values for product-specific settings
    // state.projectType is NOT reset here — user controls this separately
    state.antidoteProfitPct = v.antidoteProfitPct ?? 25;
    state.supportContract = v.supportContract ?? false;
    state.creatorDevCost = v.creatorDevCost ?? 0;
    state.creatorMarketingCost = v.creatorMarketingCost ?? 0;
    state.creatorIpAdvance = v.creatorIpAdvance ?? 0;
    state.ipEnabled = v.ipEnabled ?? false;
    state.dealPartners = migrateDealPartners(v);
    // Core values
    state.projectName = v.projectName;
    state.devCost = v.devCost;
    state.marketingCost = v.marketingCost;
    state.shippingSubsidy = v.shippingSubsidy ?? 0;
    state.printRun = v.printRun;
    state.totalBackers = v.totalBackers;
    state.platformFeeRate = v.platformFeeRate;
    state.ipAdvance = v.ipAdvance;
    const royalty = migrateRoyalty(v);
    state.ipRoyaltyStructure = royalty.structure;
    state.ipChannels = royalty.channels;
    state.ipBrackets = royalty.brackets;
    if (v.postKsSales) {
      state.postKsSales = v.postKsSales.map(s => ({ ...s }));
    } else {
      // Legacy preset — no post-KS sales
      state.postKsSales = [];
    }
    state.autoOverageD2C = v.autoOverageD2C ?? false;
    if (v.products) {
      state.products = v.products.map(p => ({ ...p }));
      state.tiers = v.tiers.map((t, i) => ({
        name: t.name || `Tier ${i + 1}`,
        products: (t.products || []).map(tp => ({ ...tp })),
        price: t.price, pct: t.pct,
      }));
    } else {
      // Legacy preset without products — create a single product from old PPU
      const legacyPpu = v.ppu || 4.5;
      state.products = [{ id: 'p1', name: 'Core Game', ppu: legacyPpu, weight: 1.0, suggestedPrice: v.tiers[0]?.price || 20 }];
      state.tiers = v.tiers.map((t, i) => ({
        name: t.name || `Tier ${i + 1}`,
        products: [{ productId: 'p1', qty: 1 }],
        price: t.price, pct: t.pct,
      }));
    }
    state.addons = (v.addons || []).map(a => ({ ...a }));
    state.devLineItems = (v.devLineItems || []).map(li => ({ ...li }));
    state.marketingLineItems = (v.marketingLineItems || []).map(li => ({ ...li }));
  }

  function saveScenario(name) {
    const c = calc();
    const snapshot = {
      name: (typeof name === 'string' && name.trim()) || state.projectName,
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
        shippingSubsidy: state.shippingSubsidy,
        platformFeeRate: state.platformFeeRate,
        ipEnabled: state.ipEnabled,
        ipAdvance: state.ipAdvance,
        ipRoyaltyStructure: state.ipRoyaltyStructure,
        ipChannels: state.ipChannels,
        ipBrackets: state.ipBrackets,
        dealPartners: state.dealPartners,
        postKsSales: state.postKsSales,
        autoOverageD2C: state.autoOverageD2C,
        tiers: state.tiers,
        addons: state.addons,
      })),
      results: {
        totalBackers: Number(state.totalBackers) || 0,
        ksRevenue: c.ksRevenue,
        ksCosts: c.ksCosts,
        ksProfit: c.ksProfit,
        breakEvenBackers: c.breakEvenBackers,
        partnerCommission: c.partnerCommission,
        overageCost: c.overageCost,
        postKsMargin: c.postKsMargin,
        wholesaleRevenue: c.wholesaleRevenue,
        directRevenue: c.directRevenue,
        directUnitsSold: c.directUnitsSold,
        wholesaleUnitsSold: c.wholesaleUnitsSold,
        netProfit: c.netProfit,
      },
    };
    state.scenarios = [...state.scenarios, snapshot];
  }

  function loadScenario(index) {
    const s = JSON.parse(JSON.stringify(state.scenarios[index].inputs));
    // Apply with defaults for any missing fields
    state.projectName = s.projectName ?? 'Untitled Campaign';
    state.projectType = s.projectType ?? 'own';
    state.antidoteProfitPct = s.antidoteProfitPct ?? 25;
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
    state.shippingSubsidy = s.shippingSubsidy ?? 0;
    state.platformFeeRate = s.platformFeeRate ?? 13.5;
    state.ipEnabled = s.ipEnabled ?? false;
    state.ipAdvance = s.ipAdvance ?? 0;
    const royalty = migrateRoyalty(s);
    state.ipRoyaltyStructure = royalty.structure;
    state.ipChannels = royalty.channels;
    state.ipBrackets = royalty.brackets;
    state.dealPartners = migrateDealPartners(s);
    state.postKsSales = s.postKsSales ?? [];
    state.autoOverageD2C = s.autoOverageD2C ?? false;
    state.tiers = s.tiers ?? [];
    state.addons = s.addons ?? [];
  }

  function deleteScenario(index) {
    state.scenarios = state.scenarios.filter((_, i) => i !== index);
  }

  function moveScenario(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= state.scenarios.length) return;
    const next = [...state.scenarios];
    [next[index], next[target]] = [next[target], next[index]];
    state.scenarios = next;
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
    <div class="flex flex-wrap items-center gap-4">
      <!-- Product Type Selector -->
      <div class="flex items-center gap-2">
        <label for="product-type" class="text-sm text-gray-mid">Type:</label>
        <select
          id="product-type"
          bind:value={selectedType}
          class="px-3 py-1.5 text-sm font-medium rounded-lg border border-purple/20 bg-white focus:outline-none focus:border-purple"
        >
          {#each productTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </div>
      <!-- Size Buttons -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-mid">Size:</span>
        {#each availableSizes as preset}
          <button
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple/20 bg-white hover:bg-purple hover:text-white transition-colors"
            onclick={() => applyPreset(preset)}
          >
            {preset.size} <span class="opacity-60">{preset.sub}</span>
          </button>
        {/each}
      </div>
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
    <TabRetailInventory bind:appState={state} calc={calc()} />
  {:else if activeTab === 'profit'}
    <TabProfitShare bind:appState={state} calc={calc()} />
  {:else if activeTab === 'summary'}
    <TabSummary appState={state} calc={calc()} {saveScenario} {loadScenario} {deleteScenario} {moveScenario} />
  {/if}
</div>
{/if}
