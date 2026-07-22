<script>
  import Card from './Card.svelte';
  import Metric from './Metric.svelte';
  import { fmt, fmtFull } from './utils.js';

  let { appState: state = $bindable(), calc } = $props();

  function addBracket() {
    const brackets = state.ipBrackets;
    const prevCap = brackets.length > 1 ? Number(brackets[brackets.length - 2].upTo) || 0 : 0;
    const last = brackets[brackets.length - 1];
    state.ipBrackets = [
      ...brackets.slice(0, -1),
      { upTo: prevCap > 0 ? prevCap * 2 : 200000, rate: Number(last?.rate) || 10 },
      last,
    ];
  }

  function removeBracket(i) {
    if (state.ipBrackets.length <= 1) return;
    state.ipBrackets = state.ipBrackets.filter((_, idx) => idx !== i);
  }

  const channelBases = {
    ks: (c) => c.royaltyBaseKS,
    direct: (c) => c.royaltyBaseDirect,
    wholesale: (c) => c.royaltyBaseWholesale,
  };
  const channelRoyalties = {
    ks: (c) => c.earnedRoyaltyKS,
    direct: (c) => c.earnedRoyaltyDirect,
    wholesale: (c) => c.earnedRoyaltyWholesale,
  };
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

      <div class="mb-4">
        <div class="text-sm font-medium text-gray-mid mb-2">Rate Structure</div>
        <div class="flex gap-2">
          <button
            class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors {state.ipRoyaltyStructure === 'flat' ? 'bg-purple text-white' : 'bg-cream text-gray-mid border border-gray-light/30 hover:border-purple'}"
            onclick={() => state.ipRoyaltyStructure = 'flat'}
          >
            Flat
          </button>
          <button
            class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors {state.ipRoyaltyStructure === 'brackets' ? 'bg-purple text-white' : 'bg-cream text-gray-mid border border-gray-light/30 hover:border-purple'}"
            onclick={() => state.ipRoyaltyStructure = 'brackets'}
          >
            Progressive Brackets
          </button>
        </div>
        <p class="text-xs text-gray-mid mt-2">
          {#if state.ipRoyaltyStructure === 'brackets'}
            Marginal rates by cumulative royalty-base revenue across the whole deal (KS first, then post-KS) — like tax brackets. Each bracket's rate applies only to revenue within that bracket.
          {:else}
            A single rate per channel, applied to that channel's royalty base.
          {/if}
        </p>
      </div>

      {#if state.ipRoyaltyStructure === 'brackets'}
        <div class="mb-4">
          <div class="text-xs font-semibold text-gray-mid uppercase mb-2">Brackets (cumulative revenue)</div>
          {#each state.ipBrackets as bracket, i}
            <div class="flex items-center gap-2 mb-2">
              {#if bracket.upTo == null}
                <span class="w-40 text-sm text-gray-mid">Above previous</span>
              {:else}
                <span class="text-sm text-gray-mid">Up to $</span>
                <input type="number" bind:value={bracket.upTo} min="0" step="50000"
                  class="w-28 px-2 py-1.5 border border-gray-light rounded text-sm text-right focus:outline-none focus:border-purple" />
              {/if}
              <input type="number" bind:value={bracket.rate} min="0" max="100" step="0.5"
                class="w-20 px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
              <span class="text-sm text-gray-mid">%</span>
              {#if bracket.upTo != null}
                <button onclick={() => removeBracket(i)}
                  class="text-pink-hot hover:text-pink-hot/70 font-bold text-sm" title="Remove bracket">X</button>
              {/if}
            </div>
          {/each}
          <button onclick={addBracket}
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple/30 text-purple hover:bg-purple hover:text-white transition-colors">
            + Add Bracket
          </button>
        </div>
      {/if}

      <div>
        <div class="text-xs font-semibold text-gray-mid uppercase mb-2">Channels</div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-light/40">
              <th class="py-1.5 text-left text-xs font-semibold text-gray-mid">Channel</th>
              {#if state.ipRoyaltyStructure === 'flat'}
                <th class="py-1.5 text-center text-xs font-semibold text-gray-mid">Rate %</th>
              {/if}
              <th class="py-1.5 text-center text-xs font-semibold text-gray-mid">Basis</th>
            </tr>
          </thead>
          <tbody>
            {#each state.ipChannels as channel}
              <tr class="border-b border-gray-light/20">
                <td class="py-1.5 font-medium text-purple">{channel.label}</td>
                {#if state.ipRoyaltyStructure === 'flat'}
                  <td class="py-1.5">
                    <input type="number" bind:value={channel.rate} min="0" max="100" step="0.5"
                      class="w-20 mx-auto block px-2 py-1.5 border border-gray-light rounded text-sm text-center focus:outline-none focus:border-purple" />
                  </td>
                {/if}
                <td class="py-1.5 text-center">
                  {#if channel.key === 'ks'}
                    <span class="text-xs text-gray-mid">Net collected</span>
                  {:else}
                    <select bind:value={channel.basis}
                      class="px-2 py-1.5 border border-gray-light rounded text-xs bg-white focus:outline-none focus:border-purple">
                      <option value="net">% of net revenue</option>
                      <option value="msrp">% of MSRP (units x MSRP)</option>
                    </select>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="text-xs text-gray-mid mt-2">MSRP basis: royalty = units x MSRP x rate regardless of realized price — for deals structured off sticker price. In brackets mode the schedule sets the rates; basis still controls each channel's base.</p>
      </div>
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
          <p>Net basis is actual money received; MSRP basis is units x sticker price. Shipping is not in the royalty base either way.</p>
        </div>
      </div>
    </Card>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
    <Metric label="IP Advance / MG" value={fmt(calc.ipAdvance)} sub="Paid upfront" variant="warning" />
    <Metric label="Earned Royalties" value={fmt(calc.earnedRoyaltyTotal)} sub={calc.ipRoyaltyStructure === 'brackets' ? 'Marginal brackets on cumulative base' : 'Flat per-channel rates'} variant="warning" />
    <Metric label="Royalties Due Beyond MG" value={fmt(calc.royaltyDue)} sub={calc.ipEarnedOut ? 'MG earned out' : 'MG not yet recouped'} variant="warning" />
    <Metric label="Total IP Cost" value={fmt(calc.totalIpCost)} sub="Greater of MG or royalties" variant="danger" />
    <Metric label="Effective / Unit" value={'$' + calc.effectiveRoyaltyPerUnit.toFixed(2)} sub="{calc.royaltyUnits.toLocaleString()} units across the deal" variant="default" />
    <Metric label="Effective % of Net" value={(calc.effectiveRoyaltyPctNet * 100).toFixed(2) + '%'} sub="Of {fmt(calc.netCollected)} collected" variant="default" />
  </div>

  <Card title="IP Cost Breakdown">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <tbody>
          <tr class="border-b border-gray-light/20">
            <td class="py-2">IP Advance / MG (paid upfront)</td>
            <td class="py-2 text-right font-semibold text-pink-hot">{fmtFull(calc.ipAdvance)}</td>
          </tr>
          {#each state.ipChannels as channel}
            {@const base = channelBases[channel.key]?.(calc) ?? 0}
            {@const royalty = channelRoyalties[channel.key]?.(calc) ?? 0}
            <tr class="border-b border-gray-light/20 text-gray-mid">
              <td class="py-2 pl-4">
                Earned royalty — {channel.label}
                ({#if state.ipRoyaltyStructure === 'flat'}{Number(channel.rate).toFixed(1)}% of {/if}{fmtFull(base)}{channel.basis === 'msrp' ? ' MSRP base' : ''})
              </td>
              <td class="py-2 text-right">{fmtFull(royalty)}</td>
            </tr>
          {/each}
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
    <p class="text-gray-mid text-xs mt-2">When enabled, you can set an IP advance and royalty rates (flat per channel, or progressive brackets) that flow into the P&L.</p>
  </div>
{/if}
