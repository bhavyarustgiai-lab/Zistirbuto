# Zistributo AGENTS.md

These instructions apply to the whole repository unless a more specific AGENTS.md exists in a subfolder.

## 1. Product Context

Zistributo is a business operations web app with two workspaces:

- Client workspace for salons, spas, and fitness businesses.
- Partner workspace for distributor/warehouse operations.

The partner workspace is the most active and feature-rich area.

The app is a monorepo:

txt apps/frontend React + TypeScript frontend apps/backend Go net/http backend packages/contracts Shared Zod/OpenAPI contracts packages/ui-tokens Shared design tokens and Tailwind preset infra Local infrastructure helpers scripts Developer scripts

## 2. Tech Stack

Frontend:

- React 18
- TypeScript
- React Router
- Tailwind CSS
- Rspack
- shadcn-style local UI primitives
- lucide-react
- pnpm workspace

Backend:

- Go 1.22
- net/http
- http.ServeMux
- pgx/v5
- PostgreSQL
- embedded SQL migrations
- cookie-based sessions

## 3. Important Paths

Frontend:

txt apps/frontend/src/main.tsx apps/frontend/src/app/App.tsx apps/frontend/src/app/providers/AppStateProvider.tsx apps/frontend/src/app/routes/AppRoutes.tsx apps/frontend/src/app/routes/PartnersRoutes.tsx apps/frontend/src/app/layout/PartnersLayout.tsx apps/frontend/src/pages apps/frontend/src/features apps/frontend/src/entities apps/frontend/src/shared/api/http.ts apps/frontend/src/shared/types/domain.ts apps/frontend/src/shared/ui

Backend:

txt apps/backend/cmd/server/main.go apps/backend/internal/server/router.go apps/backend/internal/modules/api/handler.go apps/backend/internal/store/store.go apps/backend/internal/db/migrations apps/backend/internal/db/schema.go apps/backend/internal/middleware

Contracts:

txt packages/contracts packages/ui-tokens

## 4. Non-Negotiable Frontend Architecture Rules

Follow Atomic Design.

Preferred structure:

txt apps/frontend/src/shared/ui/ atoms/ molecules/ organisms/ templates/ apps/frontend/src/features/ partners/ orders/ suppliers/ clients/ inventory/ brands/ catalog/ clients/ appointments/ staff/ services/

Rules:

- Pages in apps/frontend/src/pages must be composition-only as much as possible.
- Pages should not contain heavy business logic.
- Pages should not define large reusable UI blocks inline.
- Shared UI belongs in shared/ui.
- Feature-specific UI belongs in features/<workspace>/<feature>.
- API calls must not be made directly from page or UI components.
- Hooks should own data-fetching and feature behavior.
- Shared components must not depend on partner/client business logic.

## 5. shadcn/ui and Design-System Rules

Use shadcn/ui primitives wherever possible.

Prefer these primitives before creating custom UI:

- Button
- Input
- Textarea
- Select
- Checkbox
- Radio Group
- Switch
- Card
- Dialog
- Alert Dialog
- Sheet
- Table
- Tabs
- Badge
- Dropdown Menu
- Popover
- Command
- Toast
- Tooltip
- Form
- Calendar
- Separator
- Skeleton

Do not create raw custom versions of:

- buttons
- inputs
- cards
- dialogs
- modals
- drawers
- tables
- badges
- dropdowns
- tabs
- toasts
- tooltips
- form fields

unless no existing shadcn-style primitive fits.

Create app-level wrappers when needed:

txt shared/ui/atoms/app-button.tsx shared/ui/atoms/app-input.tsx shared/ui/atoms/app-badge.tsx shared/ui/molecules/form-field.tsx shared/ui/molecules/status-badge.tsx shared/ui/molecules/empty-state.tsx shared/ui/molecules/loading-state.tsx shared/ui/molecules/error-state.tsx shared/ui/molecules/confirm-dialog.tsx shared/ui/organisms/data-table.tsx shared/ui/organisms/filter-bar.tsx shared/ui/organisms/page-header.tsx shared/ui/organisms/activity-timeline.tsx shared/ui/templates/resource-list-page.tsx shared/ui/templates/resource-detail-page.tsx shared/ui/templates/resource-form-dialog.tsx

## 6. Form Rules

Every form must support:

- field-level validation errors
- server-side field errors where applicable
- form-level server error for non-field failures
- loading state during submit
- disabled submit button while submitting
- accessible labels
- clear helper text where useful
- strict input filtering for numeric-only fields instead of relying on inputMode alone
- success toast or success acknowledgement after every successful user-triggered form submission
- error toast where useful

Never show only a generic error when the error belongs to a specific field.

Example expected behavior:

txt GSTIN invalid → show error under GSTIN field Phone invalid → show error under phone field Duplicate SKU → show error under SKU field Network failure → show form-level error/toast

## 7. Page State Rules

Every async page or major data section must handle:

- loading state
- empty state
- error state
- success state where relevant
- permission/unauthorized state where relevant

Use shared components instead of recreating these states.

Preferred components:

txt EmptyState LoadingState ErrorState PageHeader DataTable ConfirmDialog StatusBadge

## 8. Frontend API Rules

Use the centralized HTTP client:

txt apps/frontend/src/shared/api/http.ts

Rules:

- Do not call fetch directly from pages/components.
- Preserve credentials: include.
- Keep API functions in apps/frontend/src/entities/\*/api.ts or feature-level api.ts.
- Keep environment config in apps/frontend/src/shared/config/env.ts.
- Remember VITE_USE_MOCKS defaults to true.
- Any API request must handle exceptions/errors well enough to avoid uncaught runtime errors.
- API failures should show a react-toastify error toast with a relevant user-facing message.
- Use "Something went wrong, please try again later" as the fallback toast message when no better message is available.

## 9. Frontend Feature Module Pattern

For partner features, prefer:

txt apps/frontend/src/features/partners/<feature>/ api.ts hooks.ts types.ts utils.ts components/ <Feature>List.tsx <Feature>Form.tsx <Feature>Detail.tsx <Feature>StatusBadge.tsx

Rules:

- api.ts contains API calls only.
- hooks.ts contains data loading, mutation orchestration, and feature behavior.
- types.ts contains feature-local types only.
- utils.ts contains pure helpers.
- components/ contains presentational and feature UI.
- Page files should import and compose feature-level components/hooks.

## 10. Partner Workspace Rules

Partner data is firm-scoped.

Always preserve and respect:

txt firmId activePartnerFirmId zistributo.partners.activeFirmId

Partner routes include:

txt /partners /partners/settings/firm /partners/settings/access /partners/brands /partners/items /partners/clients /partners/orders /partners/order-history /partners/orders/:orderId /partners/receivables /partners/stock /partners/suppliers /partners/history

Do not break redirects:

txt /partners/dashboard -> /partners /partners/orders/history -> /partners/order-history

Partner sidebar lives in:

txt apps/frontend/src/app/layout/PartnersLayout.tsx

Do not break sidebar localStorage keys:

txt zistributo:partners-sidebar-collapsed zistributo:partners-sidebar-groups

Sidebar groups:

txt General: Dashboard, Manage firm, Users Products: Brands, Catalog Parties: Suppliers, Clients Stock: Inventory, History Orders: Active, History Finance: Receivables

## 11. Backend Architecture Rules

Current backend is Go standard library net/http, not Gin.

Do not add unrelated large logic to:

txt apps/backend/internal/store/store.go

For new or refactored domains, prefer:

txt apps/backend/internal/modules/partners/<feature>/ handler.go service.go repository.go types.go

Responsibilities:

txt handler.go HTTP decode/encode, route validation, request context service.go business rules, authorization, orchestration repository.go SQL and persistence types.go domain/request/response types

Rules:

- Keep SQL out of handlers.
- Keep HTTP concerns out of repositories.
- Validate firm access before partner mutations.
- Validate entity access before client mutations.
- Preserve existing API routes unless explicitly asked to change them.
- Do not bypass session authentication.
- Use existing response/error helper patterns where applicable.

## 12. Backend Auth and Access Rules

Authentication uses an HttpOnly cookie:

txt zistributo_session

Rules:

- Do not move auth state to localStorage.
- Do not remove cookie-based auth.
- Do not break credentials: include.
- Partner operations must check firm access.
- Client operations must check entity/client access.
- Role-based protections must be preserved.

Partner roles:

txt OWNER STAFF ACCOUNTANT DELIVERY_PARTNER

Client roles:

txt OWNER MANAGER STAFF ACCOUNT_MANAGER

## 13. Database and Migration Rules

Migrations live in:

txt apps/backend/internal/db/migrations

Rules:

- Database migrations are the source of truth for schema changes.
- Do not edit already-applied migrations unless explicitly instructed.
- Add a new migration for schema changes.
- Keep migrations backward-safe where possible.
- Ensure new tables/columns support existing seed/demo flows if needed.

## 14. Contracts Rules

packages/contracts contains shared Zod schemas and OpenAPI contract files.

Long-term goal: contracts should become the source of truth.

When adding or changing API shapes:

- update Zod schemas where applicable
- update OpenAPI docs where applicable
- avoid duplicate frontend/backend type drift
- reuse contract-aligned types where possible

For partner features, prefer contract files like:

txt packages/contracts/src/partners/orders.ts packages/contracts/src/partners/suppliers.ts packages/contracts/src/partners/clients.ts packages/contracts/src/partners/inventory.ts

Define schemas for:

- list response
- detail response
- create request
- update request
- status/action request
- field-level error response shape

## 15. Error Handling Rules

Backend should return predictable errors.

Frontend should display errors in the correct place.

Use this mapping:

txt Validation error on a field -> field-level error Permission error -> unauthorized/forbidden state Not found -> not-found or empty state Network/server failure -> form-level error/toast

Do not swallow errors silently.

Do not show raw technical errors to end users unless in development/debug context.

Any user-triggered API failure should surface through an appropriate UI state and a react-toastify error toast. Prefer field-level or form-level errors when the backend identifies a specific field, and use "Something went wrong, please try again later" as the fallback message.

## 16. Reusable Partner Patterns

Before building new partner UI, check whether these patterns already exist:

- resource list page
- resource detail page
- create/edit dialog
- archive/cancel confirmation
- status badge
- filter/search bar
- activity timeline
- stat/metric card
- empty state
- loading skeleton
- error state

Extract reusable templates only when the pattern is clearly repeated.

Do not over-abstract too early.

## 17. Accessibility and UX Rules

All interactive controls must have:

- accessible label or visible text
- keyboard-friendly behavior
- visible focus state
- disabled/loading state where applicable

Tables should have clear headers.

Dialogs/sheets should have titles.

Icon-only buttons must have accessible labels/tooltips.

## 18. Styling Rules

Use:

- Tailwind CSS
- shared UI tokens from packages/ui-tokens
- existing shadcn-style design patterns

Avoid:

- inline styles unless necessary
- one-off colors
- duplicated spacing systems
- custom CSS when Tailwind/shadcn patterns work

## 19. Testing and Validation Commands

Before considering work complete, run the relevant checks when possible:

bash pnpm typecheck pnpm build

For backend changes, also run appropriate Go checks from apps/backend:

bash go test ./... go build ./cmd/server

If a command fails, document:

- command run
- failure summary
- likely cause
- whether it is related to the current change

## 20. Before Making Changes Checklist

Before coding, check:

1. Can existing shared UI be reused?
2. Can a shadcn/ui primitive solve this?
3. Is this page composition-only?
4. Are loading, empty, error, and success states handled?
5. Are form errors shown at field level?
6. Is API logic outside UI components?
7. Is partner data properly firm-scoped?
8. Is client data properly entity-scoped?
9. Does this require contract updates?
10. Does this avoid growing store.go unnecessarily?

## 21. Output Expectations

When making changes, summarize:

- files changed
- why the structure fits the architecture
- shared UI/shadcn components used
- state handling added
- form validation behavior added
- backend access checks preserved
- tests/checks run

Do not claim tests passed unless they were actually run.
