## Zistributo Backend

Current backend runtime:
- Go 1.22
- stdlib `net/http`
- Postgres persistence via `pgx/v5`
- REST API at `/api/v1`

Run locally:

```bash
cd apps/backend
docker compose up -d
set -a; source .env; set +a
go run ./cmd/server
```

Default env:

```env
APP_PORT=8080
CORS_ORIGINS=http://localhost:3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=zistributo
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSLMODE=disable
APP_CURRENT_USER_ID=usr_1
APP_CURRENT_USER_NAME=Kevin Arora
APP_CURRENT_USER_PHONE=9876500000
```

Implemented routes:
- `GET /api/v1/health`
- `GET /api/v1/me`
- `POST /api/v1/entities`
- `GET /api/v1/members`
- `DELETE /api/v1/members/{userId}`
- `GET /api/v1/invites`
- `POST /api/v1/invites`
- `POST /api/v1/invites/accept`
- `POST /api/v1/invites/{inviteId}/revoke`
- `GET /api/v1/services`
- `POST /api/v1/services`
- `PATCH /api/v1/services/{id}`
- `GET /api/v1/staff-capabilities`
- `PUT /api/v1/staff-capabilities/{userId}`
- `GET /api/v1/day-entries`
- `POST /api/v1/day-entries`
- `PATCH /api/v1/day-entries/{id}`
- `DELETE /api/v1/day-entries/{id}`
- `POST /api/v1/payments`

Notes:
- The server requires Postgres at startup.
- `DATABASE_URL` is supported, but if omitted the backend builds it from `DB_*` env vars.
- `internal/db/schema.sql` is the current baseline schema and is auto-applied to an empty database on boot.
- A current user is resolved from `APP_CURRENT_USER_ID`; this is the temporary stand-in until real auth is added.
- On a fresh database, demo entity/member/service/day-entry data is seeded automatically so the frontend is usable immediately.
