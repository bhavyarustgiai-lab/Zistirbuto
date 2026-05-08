# Zistributo Monorepo

## Structure

- `apps/frontend`: React + TypeScript + Tailwind + Rspack
- `apps/backend`: Go + Gin API
- `packages/contracts`: Shared Zod schemas + OpenAPI spec
- `packages/ui-tokens`: Shared design tokens / Tailwind preset
- `infra`: Local infra helpers

## Quick start

1. Copy envs:
   - `cp .env.example apps/backend/.env`
   - `cp .env.example apps/frontend/.env`
2. Install JS deps: `pnpm install`
3. Run frontend: `pnpm dev`
4. Run backend: `make dev-api`

## Frontend UI conventions

- Use `shadcn/ui` components from `apps/frontend/src/components/ui/*` as the default UI layer.
- Do not introduce additional component libraries (MUI, Ant, Chakra, etc.) unless explicitly approved.
- Build app-specific composition with Tailwind utilities around `shadcn/ui` primitives.

## API

- Base URL: `/api/v1`
- Health: `GET /api/v1/health`
