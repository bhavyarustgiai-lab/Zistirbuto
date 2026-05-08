Zistributo Frontend is a React + TypeScript + Tailwind + Rspack SPA for multi-entity operational workflows.

Current stack:
- React 18
- TypeScript
- TailwindCSS
- Rspack
- shadcn/ui primitives
- mock or backend API adapters

Architecture:
- `src/app`: app shell, routing, global bootstrap state, toast provider
- `src/pages`: route-level screens
- `src/entities`: API adapters and hooks
- `src/features`: mutation-heavy UI flows
- `src/shared`: domain types, config, mock DB, shared UI

Current routes:
- `/appointments` -> Today
- `/staff` -> Manage staff capabilities
- `/services` -> Services catalog
- `/stock` -> Coming soon
- `/users` -> Members and invites
- `/invite/:token` -> Accept invite
- `/entities/onboard` -> Entity onboarding

Environment:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_USE_MOCKS=false
```

Run locally:

```bash
pnpm install
pnpm --filter @zistributo/frontend dev
```

Notes:
- `VITE_USE_MOCKS=true` can be enabled for local frontend-only development with `src/shared/api/mockDb.ts`
- mock contracts should stay aligned with backend response shapes
- all UI primitives should remain on shadcn/ui
