package db

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed schema.sql
var schemaFS embed.FS

func ApplySchema(ctx context.Context, pool *pgxpool.Pool) error {
	empty, err := isDatabaseSchemaEmpty(ctx, pool)
	if err != nil {
		return err
	}
	needsBaselineRepair := false
	if !empty {
		needsBaselineRepair, err = isTableMissing(ctx, pool, "partner_firms")
		if err != nil {
			return err
		}
	}
	if !empty && !needsBaselineRepair {
		return applySchemaCleanups(ctx, pool)
	}
	source, err := schemaFS.ReadFile("schema.sql")
	if err != nil {
		return err
	}
	if err := applySQL(ctx, pool, string(source), needsBaselineRepair); err != nil {
		return fmt.Errorf("apply schema.sql: %w", err)
	}
	if err := applySchemaCleanups(ctx, pool); err != nil {
		return err
	}
	return nil
}

func applySchemaCleanups(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
		alter table if exists partner_product_catalog
			drop constraint if exists chk_partner_product_catalog_default_pricing,
			drop column if exists default_mrp,
			drop column if exists default_discount_percentage
	`)
	if err != nil {
		return fmt.Errorf("apply schema cleanups: %w", err)
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

func isTableMissing(ctx context.Context, pool *pgxpool.Pool, tableName string) (bool, error) {
	var missing bool
	err := pool.QueryRow(ctx, `select to_regclass($1) is null`, "public."+tableName).Scan(&missing)
	return missing, err
}

func applySQL(ctx context.Context, pool *pgxpool.Pool, source string, ignoreDuplicateObjects bool) error {
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
	if !ignoreDuplicateObjects {
		_, err := pool.Exec(ctx, trimmed)
		return err
	}
	for _, statement := range strings.Split(trimmed, ";") {
		sql := strings.TrimSpace(statement)
		if sql == "" {
			continue
		}
		if _, err := pool.Exec(ctx, sql); err != nil && !isIgnorableBaselineRepairError(err) {
			return err
		}
	}
	return nil
}

func isIgnorableBaselineRepairError(err error) bool {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return false
	}
	switch pgErr.Code {
	case "42P07", // duplicate_table
		"42710", // duplicate_object
		"42P16": // invalid_table_definition, e.g. adding a second primary key
		return true
	default:
		return false
	}
}
