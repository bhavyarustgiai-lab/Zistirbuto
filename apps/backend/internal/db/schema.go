package db

import (
	"context"
	"embed"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed schema.sql
var schemaFS embed.FS

func ApplySchema(ctx context.Context, pool *pgxpool.Pool) error {
	empty, err := isDatabaseSchemaEmpty(ctx, pool)
	if err != nil {
		return err
	}
	if !empty {
		return nil
	}
	source, err := schemaFS.ReadFile("schema.sql")
	if err != nil {
		return err
	}
	if err := applySQL(ctx, pool, string(source)); err != nil {
		return fmt.Errorf("apply schema.sql: %w", err)
	}
	return nil
}

func isDatabaseSchemaEmpty(ctx context.Context, pool *pgxpool.Pool) (bool, error) {
	var tableCount int
	err := pool.QueryRow(ctx, `
		select count(*)
		from information_schema.tables
		where table_schema = current_schema()
		  and table_type = 'BASE TABLE'
	`).Scan(&tableCount)
	return tableCount == 0, err
}

func applySQL(ctx context.Context, pool *pgxpool.Pool, source string) error {
	upSQL := source
	if idx := strings.Index(upSQL, "-- +goose Down"); idx >= 0 {
		upSQL = upSQL[:idx]
	}

	lines := strings.Split(upSQL, "\n")
	filtered := make([]string, 0, len(lines))
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "-- +goose") {
			continue
		}
		filtered = append(filtered, line)
	}
	trimmed := strings.TrimSpace(strings.Join(filtered, "\n"))
	if trimmed == "" {
		return nil
	}
	_, err := pool.Exec(ctx, trimmed)
	return err
}
