# CookieNexus Pro

CookieNexus Pro is a Cookie Chain mission-control dashboard for portfolio tracking, swaps, yield, launchpad drafts, ecosystem activity, and creator tooling.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cookie-nexus-pro/src/App.tsx` — responsive application shell and product routes.
- `artifacts/cookie-nexus-pro/src/index.css` — CookieNexus dark amber-glass visual system.
- `lib/api-spec/openapi.yaml` — source of truth for dashboard and chain-adapter endpoints.
- `artifacts/api-server/src/routes/nexus.ts` — API-backed overview, markets, vaults, activity, faucet, swap quote, and launchpad flows.

## Architecture decisions

- Chain-facing actions are isolated behind explicit API routes so live Cookie Chain RPC and wallet adapters can replace the simulator without changing the UI contract.
- The first build uses typed OpenAPI-generated React Query hooks across the web artifact.
- The interface is a single responsive mission-control shell with route-level modules rather than separate branded products.

## Product

- Portfolio overview with COOK balance, staked value, TVL, market pulse, activity, network health, and testnet faucet.
- Swap quote simulator, vault browsing, launchpad draft creation, activity history, interactive community canvas, and safety/network settings.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
