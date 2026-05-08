import type { ComponentType } from "react";
import { CheckCircle2, CreditCard, Factory, FileText, Package, RotateCcw, Truck } from "lucide-react";
import type { PartnerAuditLog } from "@shared/types/domain";
import { EmptyState } from "@shared/ui/molecules/empty-state";
import { ActivityTimelineItem } from "./ActivityTimelineItem";

type ActivityDescriptor = {
  title: string;
  meta: string;
  icon: ComponentType<{ className?: string }>;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function parseState(value?: string) {
  if (!value) return {} as Record<string, unknown>;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function referenceFor(log: PartnerAuditLog, afterState: Record<string, unknown>) {
  return (
    log.referenceLabel ||
    text(afterState.orderNumber) ||
    text(afterState.invoiceNumber) ||
    text(afterState.paymentNumber) ||
    text(afterState.creditNoteNumber) ||
    text(afterState.purchaseNumber) ||
    text(afterState.grnNumber) ||
    text(afterState.returnNumber)
  );
}

function describeOrderStatus(actor: string, reference: string, status: string): ActivityDescriptor {
  const suffix = reference ? ` ${reference}` : "";
  if (status === "CONFIRMED") return { title: `${actor} confirmed order${suffix}`, meta: "Order confirmed for packing.", icon: CheckCircle2 };
  if (status === "PACKED") return { title: `${actor} packed order${suffix}`, meta: "Items moved through packing.", icon: Package };
  if (status === "DISPATCHED") return { title: `${actor} dispatched order${suffix}`, meta: "Goods left the warehouse.", icon: Truck };
  if (status === "DELIVERED") return { title: `${actor} marked order${suffix} delivered`, meta: "Delivery completed.", icon: CheckCircle2 };
  if (status === "CANCELLED") return { title: `${actor} cancelled order${suffix}`, meta: "Order was cancelled.", icon: RotateCcw };
  return { title: `${actor} updated order${suffix} to ${humanize(status)}`, meta: "Order status changed.", icon: CheckCircle2 };
}

function describeActivity(log: PartnerAuditLog): ActivityDescriptor {
  const actor = log.userName || "System";
  const afterState = parseState(log.afterState);
  const reference = referenceFor(log, afterState);
  const suffix = reference ? ` ${reference}` : "";
  const entityType = String(log.entityType);

  if (entityType === "ORDER") {
    if (log.action === "STATUS_CHANGE") return describeOrderStatus(actor, reference, text(afterState.status) || "UPDATED");
    if (log.action === "CREATE") return { title: `${actor} created order${suffix}`, meta: "Order was created.", icon: FileText };
    if (log.action === "RETURN") return { title: `${actor} created a return for order${suffix}`, meta: "Returned goods were recorded.", icon: RotateCcw };
    if (log.action === "RETURN_REVERSED") return { title: `${actor} reversed a return for order${suffix}`, meta: "Return impact was reversed.", icon: RotateCcw };
  }

  if (entityType === "INVOICE") {
    if (log.action === "FINALIZE") return { title: `${actor} finalized invoice${suffix}`, meta: "Invoice totals and taxes were locked.", icon: FileText };
    if (log.action === "PAYMENT_RECORDED") return { title: `${actor} recorded payment for invoice${suffix}`, meta: "Receivable balance was updated.", icon: CreditCard };
    if (log.action === "CANCEL") return { title: `${actor} cancelled invoice${suffix}`, meta: "Invoice was cancelled.", icon: RotateCcw };
    if (log.action === "CREATE") return { title: `${actor} created invoice${suffix}`, meta: "Invoice was generated from operations.", icon: FileText };
  }

  if (entityType === "PAYMENT" || entityType === "SUPPLIER_PAYMENT") {
    return { title: `${actor} recorded payment${suffix}`, meta: "Payment was posted to the ledger.", icon: CreditCard };
  }

  if (entityType === "SALES_RETURN") {
    if (log.action === "VOID") return { title: `${actor} voided return${suffix}`, meta: "Return was reversed.", icon: RotateCcw };
    return { title: `${actor} created return${suffix}`, meta: "Returned items were accepted.", icon: RotateCcw };
  }

  if (entityType === "CREDIT_NOTE") {
    if (log.action === "VOID") return { title: `${actor} voided credit note${suffix}`, meta: "Credit note was reversed.", icon: RotateCcw };
    return { title: `${actor} issued credit note${suffix}`, meta: "Client balance was reduced.", icon: FileText };
  }

  if (entityType === "PURCHASE") {
    if (log.action === "RECEIVE") return { title: `${actor} received GRN${suffix}`, meta: "Stock receipt was recorded.", icon: Factory };
    if (log.action === "ORDER") return { title: `${actor} ordered purchase${suffix}`, meta: "Purchase order moved to ordered.", icon: FileText };
  }

  if (entityType === "SUPPLIER_INVOICE") {
    if (log.action === "PAYMENT_RECORDED") return { title: `${actor} recorded supplier payment${suffix}`, meta: "Supplier balance was updated.", icon: CreditCard };
    if (log.action === "FINALIZE") return { title: `${actor} finalized supplier invoice${suffix}`, meta: "Payable balance was posted.", icon: FileText };
  }

  return {
    title: `${actor} ${humanize(log.action)}${suffix}`,
    meta: `${humanize(entityType)} activity`,
    icon: ClockFallback,
  };
}

function ClockFallback({ className }: { className?: string }) {
  return <CheckCircle2 className={className} />;
}

type Props = {
  items: PartnerAuditLog[];
  emptyLabel?: string;
};

export function ActivityTimeline({ items, emptyLabel = "No activity has been recorded yet." }: Props) {
  if (items.length === 0) {
    return <EmptyState>{emptyLabel}</EmptyState>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const descriptor = describeActivity(item);
        return (
          <ActivityTimelineItem
            key={item.id}
            icon={descriptor.icon}
            title={descriptor.title}
            meta={descriptor.meta}
            time={formatTime(item.createdAt)}
          />
        );
      })}
    </div>
  );
}
