.PHONY: dev dev-web dev-api tidy test

dev-web:
	pnpm --filter @zistributo/frontend dev

dev-api:
	cd apps/backend && set -a && source .env && set +a && env GOCACHE=../../.cache/go-build go run ./cmd/server

dev:
	./scripts/dev.sh

tidy:
	cd apps/backend && go mod tidy

test:
	cd apps/backend && go test ./...
