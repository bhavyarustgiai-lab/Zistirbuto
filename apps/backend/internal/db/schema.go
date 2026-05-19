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
	_, err = pool.Exec(ctx, `
		alter table if exists partner_purchases
			drop constraint if exists partner_purchases_status_check,
			drop column if exists expected_inward_date,
			drop column if exists supplier_invoice_date;

		do $$
		begin
			if to_regclass('public.partner_purchases') is not null then
				update partner_purchases
				set status = 'PLACED'
				where status in ('ORDERED', 'PARTIALLY_RECEIVED');

				update partner_purchases
				set status = 'COMPLETED'
				where status in ('RECEIVED', 'POSTED');
			end if;
		end $$;

		alter table if exists partner_purchases
			add constraint partner_purchases_status_check
				check (status = any (array['DRAFT'::text, 'PLACED'::text, 'COMPLETED'::text, 'CANCELLED'::text]))
	`)
	if err != nil {
		return fmt.Errorf("apply purchase status cleanup: %w", err)
	}
	_, err = pool.Exec(ctx, `
		alter table if exists partner_firm_inventory_items
			drop constraint if exists partner_firm_inventory_items_discount_percentage_check,
			drop constraint if exists partner_firm_inventory_items_mrp_check,
			drop constraint if exists partner_firm_inventory_items_reserved_quantity_check,
			drop constraint if exists partner_firm_inventory_items_tax_percentage_check,
			drop constraint if exists ux_partner_firm_inventory_items_catalog_mrp_discount,
			drop constraint if exists ux_partner_firm_inventory_items_catalog_mrp_discount_tax;

		alter table if exists partner_firm_inventory_items
			add column if not exists tax_percentage numeric(5,2) not null default 0,
			add column if not exists reserved_quantity integer not null default 0;

		drop table if exists tmp_partner_inventory_lot_repair;

		create temporary table tmp_partner_inventory_lot_repair on commit drop as
		with receipt_lots as (
			select
				i.firm_id,
				i.item_id as legacy_item_id,
				i.catalog_item_id,
				round(pi.cost_price)::integer as mrp,
				pi.discount_percentage,
				pi.tax_percentage,
				sum(gri.received_quantity)::integer as received_quantity
			from partner_firm_inventory_items i
			join partner_goods_receipt_items gri on gri.firm_id = i.firm_id and gri.item_id = i.item_id
			join partner_purchase_items pi on pi.firm_id = gri.firm_id and pi.id = gri.purchase_item_id
			where i.quantity > 0
			  and i.mrp = 0
			  and i.discount_percentage = 0
			  and i.tax_percentage = 0
			  and gri.received_quantity > 0
			group by i.firm_id, i.item_id, i.catalog_item_id, round(pi.cost_price)::integer, pi.discount_percentage, pi.tax_percentage
		),
		totals as (
			select
				rl.*,
				i.quantity as current_quantity,
				sum(rl.received_quantity) over (partition by rl.firm_id, rl.legacy_item_id) as total_received
			from receipt_lots rl
			join partner_firm_inventory_items i on i.firm_id = rl.firm_id and i.item_id = rl.legacy_item_id
		),
		allocated as (
			select
				t.*,
				floor((t.current_quantity::numeric * t.received_quantity::numeric) / nullif(t.total_received, 0))::integer as base_quantity,
				((t.current_quantity::numeric * t.received_quantity::numeric) / nullif(t.total_received, 0))
				  - floor((t.current_quantity::numeric * t.received_quantity::numeric) / nullif(t.total_received, 0)) as remainder
			from totals t
			where t.total_received > 0
		),
		ranked as (
			select
				a.*,
				row_number() over (partition by a.firm_id, a.legacy_item_id order by a.remainder desc, a.mrp asc, a.discount_percentage asc, a.tax_percentage asc) as remainder_rank,
				sum(a.base_quantity) over (partition by a.firm_id, a.legacy_item_id) as base_total
			from allocated a
		)
		select
			firm_id,
			legacy_item_id,
			catalog_item_id,
			mrp,
			discount_percentage,
			tax_percentage,
			greatest(base_quantity + case when remainder_rank <= current_quantity - base_total then 1 else 0 end, 0)::integer as quantity
		from ranked
		where base_quantity + case when remainder_rank <= current_quantity - base_total then 1 else 0 end > 0;

		update partner_firm_inventory_items existing
		set quantity = existing.quantity + repair.quantity,
		    status = 'ACTIVE',
		    updated_at = now()
		from tmp_partner_inventory_lot_repair repair
		where existing.firm_id = repair.firm_id
		  and existing.catalog_item_id = repair.catalog_item_id
		  and existing.mrp = repair.mrp
		  and existing.discount_percentage = repair.discount_percentage
		  and existing.tax_percentage = repair.tax_percentage
		  and existing.item_id <> repair.legacy_item_id;

		insert into partner_firm_inventory_items (
			item_id, firm_id, catalog_item_id, mrp, discount_percentage, tax_percentage, status, quantity, created_at, updated_at
		)
		select
			'pfi_repair_' || substr(md5(firm_id::text || ':' || legacy_item_id || ':' || mrp::text || ':' || discount_percentage::text || ':' || tax_percentage::text), 1, 24),
			firm_id,
			catalog_item_id,
			mrp,
			discount_percentage,
			tax_percentage,
			'ACTIVE',
			quantity,
			now(),
			now()
		from tmp_partner_inventory_lot_repair
		where not exists (
			select 1
			from partner_firm_inventory_items existing
			where existing.firm_id = tmp_partner_inventory_lot_repair.firm_id
			  and existing.catalog_item_id = tmp_partner_inventory_lot_repair.catalog_item_id
			  and existing.mrp = tmp_partner_inventory_lot_repair.mrp
			  and existing.discount_percentage = tmp_partner_inventory_lot_repair.discount_percentage
			  and existing.tax_percentage = tmp_partner_inventory_lot_repair.tax_percentage
		);

		update partner_firm_inventory_items i
		set quantity = 0,
		    status = 'INACTIVE',
		    updated_at = now()
		where exists (
			select 1
			from tmp_partner_inventory_lot_repair repair
			where repair.firm_id = i.firm_id
			  and repair.legacy_item_id = i.item_id
		);

		alter table if exists partner_firm_inventory_items
			add constraint partner_firm_inventory_items_discount_percentage_check
				check (discount_percentage >= 0 and discount_percentage <= 100),
			add constraint partner_firm_inventory_items_mrp_check
				check (mrp >= 0),
			add constraint partner_firm_inventory_items_reserved_quantity_check
				check (reserved_quantity >= 0 and reserved_quantity <= quantity),
			add constraint partner_firm_inventory_items_tax_percentage_check
				check (tax_percentage >= 0 and tax_percentage <= 100),
			add constraint ux_partner_firm_inventory_items_catalog_mrp_discount_tax
				unique (firm_id, catalog_item_id, mrp, discount_percentage, tax_percentage);
	`)
	if err != nil {
		return fmt.Errorf("apply inventory pricing cleanup: %w", err)
	}
	_, err = pool.Exec(ctx, `
		create table if not exists partner_supplier_returns (
			id text primary key,
			firm_id bigint not null,
			return_number text not null,
			supplier_id text not null,
			brand_id bigint not null,
			return_date date not null,
			status text not null default 'PLACED',
			note text,
			created_by bigint,
			created_at timestamp with time zone not null default now(),
			updated_at timestamp with time zone not null default now(),
			constraint partner_supplier_returns_status_check
				check (status = any (array['PLACED'::text, 'COMPLETED'::text, 'CANCELLED'::text]))
		);
		create table if not exists partner_supplier_return_items (
			id text primary key,
			firm_id bigint not null,
			supplier_return_id text not null,
			item_id text not null,
			item_name text not null,
			sku text,
			quantity integer not null,
			reason text not null,
			note text,
			created_at timestamp with time zone not null default now(),
			constraint partner_supplier_return_items_quantity_check check (quantity > 0),
			constraint partner_supplier_return_items_reason_check
				check (reason = any (array['DAMAGED'::text, 'WRONG_ITEM'::text, 'EXPIRED'::text, 'EXCESS_STOCK'::text, 'OTHER'::text]))
		);
		create index if not exists idx_partner_supplier_returns_firm_brand_date
			on partner_supplier_returns (firm_id, brand_id, return_date desc, created_at desc);
		create index if not exists idx_partner_supplier_return_items_return
			on partner_supplier_return_items (firm_id, supplier_return_id);

		alter table if exists partner_supplier_returns
			drop constraint if exists partner_supplier_returns_status_check;

		update partner_supplier_returns
		set status = 'COMPLETED'
		where status = 'POSTED';

		update partner_supplier_returns
		set status = 'PLACED'
		where status = 'DRAFT';

		update partner_supplier_returns
		set status = 'COMPLETED'
		where status <> all (array['PLACED'::text, 'COMPLETED'::text, 'CANCELLED'::text]);

		alter table if exists partner_supplier_returns
			alter column status set default 'PLACED',
			add constraint partner_supplier_returns_status_check
				check (status = any (array['PLACED'::text, 'COMPLETED'::text, 'CANCELLED'::text]));
	`)
	if err != nil {
		return fmt.Errorf("apply supplier return cleanup: %w", err)
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
