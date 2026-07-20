# Antidote Games — Campaign Planner (`ag-deal-calc`)

An internal deal calculator for modeling crowdfunding (Kickstarter-style) tabletop
campaigns. Plan campaigns, model revenue, and validate the economics of a deal
before committing to it.

**Live:** https://antidote-games.github.io/ag-deal-calc/

> The app is gated behind a client-side passkey. Note this is a soft gate for
> convenience, not real security — the app and its data ship in the public JS
> bundle. Don't treat anything here as confidential.

## What it does

The planner takes campaign inputs and derives a full P&L across several tabs:

- **Campaign** — backers, print run, pledge tiers (with per-tier product mixes,
  pricing, backer %, and shipping), and add-ons.
- **Products** — a catalog of products with per-unit cost (PPU), weight, and
  suggested price, referenced by tiers and add-ons.
- **Budget** — dev and marketing costs as itemized line items.
- **IP & Royalties** — IP advances treated as a minimum guarantee (MG) recoupable
  against royalties, royalty rates, earn-out, and unrecouped advance.
- **KS Analysis** — KS revenue, the six cost deductions, KS profit, and
  break-even backer count.
- **Retail & Inventory** — post-KS direct and wholesale sales, overage/inventory.
- **Profit Share** — own-title deal-partner commissions/retail bonuses, or
  partner-project splits (Antidote vs. creator) including loss-sharing by
  contribution ratio.
- **Summary** — combined P&L from Antidote's perspective, plus save/load of
  named scenarios.

### Scenarios

The **Scenarios** picker loads preset campaigns (by product type and size) from
JSON files in [`src/examples/`](src/examples/). Each preset is a self-contained
snapshot of inputs — add a new `.json` file there and it appears automatically
(they're loaded via `import.meta.glob`).

## Tech stack

- [Svelte 5](https://svelte.dev/) (runes) + [Vite 6](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- Deployed to GitHub Pages

## Development

With Node (22+ recommended):

```bash
npm install     # runs a postinstall step to fix native bindings on Node 24+
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

Deno is also supported:

```bash
deno task dev
deno task build
deno task preview
```

> `scripts/fix-bindings.js` runs on `postinstall` to work around an
> [npm optional-dependencies bug](https://github.com/npm/cli/issues/4828) on
> Node 24+ by installing the platform-specific Rollup/Tailwind/LightningCSS
> native bindings.

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the app and publishes `dist/` to GitHub Pages. `vite.config.js` sets
`base: '/ag-deal-calc/'` to match the Pages subpath, so the build only works
correctly under that path.
