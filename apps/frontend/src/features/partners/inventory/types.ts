export type InventoryDraftItem = {
  rowId: string;
  catalogItemId: string;
  mrp: string;
  discountPercentage: string;
  quantity: string;
};

export type InventoryFormErrors = Record<string, string>;

export type InventoryFieldName =
  | "catalogItemId"
  | "mrp"
  | "discountPercentage"
  | "quantity";
