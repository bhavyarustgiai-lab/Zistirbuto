import { ApiError } from "@shared/api/http";
import type { PartnerInventoryCreateInput } from "@shared/types/domain";
import type {
  InventoryDraftItem,
  InventoryFieldName,
  InventoryFormErrors,
} from "./types";

const rowFieldNames = new Set<InventoryFieldName>([
  "catalogItemId",
  "mrp",
  "discountPercentage",
  "quantity",
]);

export function makeInventoryDraft(): InventoryDraftItem {
  return {
    rowId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    catalogItemId: "",
    mrp: "",
    discountPercentage: "",
    quantity: "",
  };
}

export function fieldKey(rowId: string, field: InventoryFieldName) {
  return `${rowId}.${field}`;
}

export function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

export function decimalNumberOnly(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = cleaned.split(".");
  return decimalParts.length > 0
    ? `${integerPart}.${decimalParts.join("")}`
    : integerPart;
}

export function formatReceiveDate(value: string) {
  if (!value) {
    return "today";
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "the selected date";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function validateInventoryDraft(
  rows: InventoryDraftItem[],
  supplierId: string,
  receivedAt: string,
  note: string,
) {
  const errors: InventoryFormErrors = {};
  const payload: PartnerInventoryCreateInput[] = [];

  if (!supplierId) {
    errors.supplierId = "Supplier is required.";
  }

  if (rows.length === 0) {
    errors.submit = "Add at least one inventory row.";
  }

  rows.forEach((row) => {
    const mrp = Number.parseInt(row.mrp, 10);
    const discountPercentage = Number.parseFloat(row.discountPercentage);
    const quantity = Number.parseInt(row.quantity, 10);

    if (!row.catalogItemId) {
      errors[fieldKey(row.rowId, "catalogItemId")] = "Catalog item is required.";
    }
    if (!Number.isInteger(mrp) || mrp <= 0) {
      errors[fieldKey(row.rowId, "mrp")] = "MRP must be a non-zero integer.";
    }
    if (
      !Number.isFinite(discountPercentage) ||
      discountPercentage < 0 ||
      discountPercentage > 100
    ) {
      errors[fieldKey(row.rowId, "discountPercentage")] =
        "Buy Margin must be between 0 and 100.";
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors[fieldKey(row.rowId, "quantity")] =
        "Quantity must be a non-zero integer.";
    }

    if (
      !errors[fieldKey(row.rowId, "catalogItemId")] &&
      !errors[fieldKey(row.rowId, "mrp")] &&
      !errors[fieldKey(row.rowId, "discountPercentage")] &&
      !errors[fieldKey(row.rowId, "quantity")]
    ) {
      payload.push({
        supplierId,
        receivedAt: receivedAt || undefined,
        catalogItemId: row.catalogItemId,
        mrp,
        discountPercentage,
        quantity,
        note: note.trim() || undefined,
      });
    }
  });

  return {
    errors,
    payload,
    valid: Object.keys(errors).length === 0,
  };
}

export function inventoryErrorsFromApiError(
  error: unknown,
  rows: InventoryDraftItem[],
) {
  const errors: InventoryFormErrors = {};

  if (!(error instanceof ApiError) || error.fieldErrors.length === 0) {
    return errors;
  }

  for (const item of error.fieldErrors) {
    const rowField = parseApiRowField(item.field);
    if (rowField) {
      const row = rows[rowField.index];
      if (row) {
        errors[fieldKey(row.rowId, rowField.field)] = item.message;
      }
      continue;
    }

    if (item.field === "supplierId" || item.field === "receivedAt") {
      errors[item.field] = item.message;
      continue;
    }

    errors.submit = item.message;
  }

  return errors;
}

export function userFacingInventoryError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Something went wrong, please try again later";
}

function parseApiRowField(field: string) {
  const match = field.match(/^items(?:\.|\[)(\d+)(?:\]\.)?\.?([A-Za-z]+)$/);
  if (!match) {
    return null;
  }

  const fieldName = match[2] as InventoryFieldName;
  if (!rowFieldNames.has(fieldName)) {
    return null;
  }

  return {
    index: Number.parseInt(match[1], 10),
    field: fieldName,
  };
}
