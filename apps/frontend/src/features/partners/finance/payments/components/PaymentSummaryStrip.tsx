import type { PartnerPayment } from "@shared/types/domain";
import { formatCurrency } from "@features/partners/finance/invoices/utils";

export function PaymentSummaryStrip({ payments }: { payments: PartnerPayment[] }) {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const allocated = payments.reduce((sum, payment) => sum + payment.allocatedAmount, 0);
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <Summary label="Payments" value={String(payments.length)} />
      <Summary label="Collected" value={formatCurrency(total)} />
      <Summary label="Allocated" value={formatCurrency(allocated)} />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
