export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10);
}

export function remainingQuantity(quantity: number, receivedQuantity: number, damagedQuantity: number) {
  return Math.max(quantity - receivedQuantity - damagedQuantity, 0);
}
