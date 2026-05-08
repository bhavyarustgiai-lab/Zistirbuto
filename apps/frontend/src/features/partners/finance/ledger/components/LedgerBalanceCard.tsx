import { Card, CardContent } from "@components/ui/card";
import { formatCurrency } from "@features/partners/finance/invoices/utils";

export function LedgerBalanceCard({ balance }: { balance: number }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">Current balance</p>
        <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(balance)}</p>
      </CardContent>
    </Card>
  );
}
