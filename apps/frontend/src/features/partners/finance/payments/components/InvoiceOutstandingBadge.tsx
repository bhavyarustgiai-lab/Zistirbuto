import { Badge } from "@components/ui/badge";
import { formatCurrency } from "@features/partners/finance/invoices/utils";

export function InvoiceOutstandingBadge({ amount }: { amount: number }) {
  return <Badge tone={amount > 0 ? "partial" : "paid"}>{amount > 0 ? `${formatCurrency(amount)} due` : "Settled"}</Badge>;
}
