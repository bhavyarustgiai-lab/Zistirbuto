import type { PartnerDashboardStats } from "@shared/types/domain";

type PartnerDashboardActivity = PartnerDashboardStats["recentActivity"][number];

export type PartnerRecentActivityCategory =
  | "ORDER"
  | "INVOICE"
  | "PAYMENT"
  | "PURCHASE"
  | "INVENTORY"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE"
  | "OTHER";

export type PartnerRecentActivityViewModel = {
  id: string;
  category: PartnerRecentActivityCategory;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  impactText?: string;
  timestampText: string;
  href?: string;
};

export function mapPartnerRecentActivity(activity: PartnerDashboardActivity): PartnerRecentActivityViewModel {
  const category = inferCategory(activity);
  const reference = activity.reference || extractReference(activity.title) || extractReference(activity.subtitle);
  const status = humanizeLabel(activity.status || extractStatus(activity.title) || extractStatus(activity.impactText));
  const subject = activity.subject || extractSubject(activity.title);
  const party = cleanText(activity.party);
  const location = cleanText(activity.location);
  const fallbackSubtitle = cleanText(activity.subtitle);
  const fallbackImpact = cleanText(activity.impactText);

  let title = cleanText(activity.title) || "Activity updated";
  let subtitle = buildMetadataLine(category, party, location, reference, fallbackSubtitle);
  let impactText = fallbackImpact;

  switch (category) {
    case "ORDER":
      if (reference && status) {
        title = `Order ${reference} marked as ${status}`;
      } else if (reference && activity.action === "CREATE") {
        title = `Order ${reference} created`;
      } else if (reference) {
        title = `Order ${reference} updated`;
      }
      subtitle = buildMetadataLine("ORDER", party, location, reference, fallbackSubtitle);
      impactText = impactText || (status ? `Status changed to ${status}` : "");
      break;
    case "INVOICE":
      if (reference && activity.action === "PAYMENT_RECORDED") {
        title = `Payment recorded for invoice ${reference}`;
      } else if (reference && activity.action === "FINALIZE") {
        title = `Invoice ${reference} finalized`;
      } else if (reference && activity.action === "CANCEL") {
        title = `Invoice ${reference} cancelled`;
      } else if (reference) {
        title = `Invoice ${reference} issued${party ? ` for ${party}` : ""}`;
      }
      subtitle = buildMetadataLine("INVOICE", party, location, reference, fallbackSubtitle);
      break;
    case "PAYMENT":
      title = reference ? `Payment ${reference} recorded` : "Payment recorded";
      subtitle = buildMetadataLine("PAYMENT", party, location, reference, fallbackSubtitle);
      break;
    case "PURCHASE":
      if (reference && activity.action === "POST") {
        title = `Purchase ${reference} posted to stock`;
      } else if (reference) {
        title = `Purchase ${reference} created`;
      }
      subtitle = joinParts([party ? `Supplier: ${party}` : "", location ? `Location: ${location}` : ""]) || fallbackSubtitle;
      break;
    case "INVENTORY":
      title = buildInventoryTitle(activity.action, subject, title);
      subtitle = joinParts([
        activity.reference ? `Ref: ${activity.reference}` : "",
        location ? `Outlet: ${location}` : "",
        !activity.reference && !location ? fallbackSubtitle : "",
      ]);
      impactText = impactText || formatQuantityImpact(activity.quantityDelta);
      break;
    case "CREDIT_NOTE":
      if (reference) title = `Credit note ${reference} issued`;
      subtitle = buildMetadataLine(category, party, location, reference, fallbackSubtitle);
      break;
    case "DEBIT_NOTE":
      if (reference) title = `Debit note ${reference} issued`;
      subtitle = buildMetadataLine(category, party, location, reference, fallbackSubtitle);
      break;
    default:
      title = humanizeFallbackTitle(title);
      impactText = impactText || formatQuantityImpact(activity.quantityDelta);
      break;
  }

  return {
    id: activity.id,
    category,
    categoryLabel: categoryLabelMap[category],
    title,
    subtitle: subtitle || undefined,
    impactText: impactText || undefined,
    timestampText: formatTimestamp(activity.createdAt),
    href: cleanText(activity.href) || undefined,
  };
}

const categoryLabelMap: Record<PartnerRecentActivityCategory, string> = {
  ORDER: "Orders",
  INVOICE: "Invoices",
  PAYMENT: "Payments",
  PURCHASE: "Purchases",
  INVENTORY: "Inventory",
  CREDIT_NOTE: "Credit Notes",
  DEBIT_NOTE: "Debit Notes",
  OTHER: "Activity",
};

function inferCategory(activity: PartnerDashboardActivity): PartnerRecentActivityCategory {
  const type = cleanText(activity.type).toUpperCase();
  if (type === "ORDER" || type === "INVOICE" || type === "PAYMENT" || type === "PURCHASE" || type === "INVENTORY" || type === "CREDIT_NOTE" || type === "DEBIT_NOTE") {
    return type;
  }

  const haystack = `${activity.title} ${activity.subtitle} ${activity.action}`.toUpperCase();
  if (haystack.includes("ORDER")) return "ORDER";
  if (haystack.includes("INVOICE")) return "INVOICE";
  if (haystack.includes("PAYMENT")) return "PAYMENT";
  if (haystack.includes("PURCHASE")) return "PURCHASE";
  if (haystack.includes("CREDIT NOTE")) return "CREDIT_NOTE";
  if (haystack.includes("DEBIT NOTE")) return "DEBIT_NOTE";
  if (haystack.includes("STOCK") || haystack.includes("RETURN") || haystack.includes("DAMAGE")) return "INVENTORY";
  return "OTHER";
}

function buildInventoryTitle(action: string | undefined, subject: string | undefined, fallback: string) {
  const item = cleanText(subject);
  const label = item ? ` for ${item}` : "";
  switch ((action || "").toUpperCase()) {
    case "OPENING_STOCK":
      return `Opening stock added${label}`;
    case "RETURN_IN":
      return `Client return received${label}`;
    case "RETURN_OUT":
      return `Return sent out${label}`;
    case "PURCHASE":
      return `Purchase stock added${label}`;
    case "SALE":
      return `Stock issued${label}`;
    case "DAMAGE":
      return `Damaged stock recorded${label}`;
    case "ADJUSTMENT":
      return `Stock adjusted${label}`;
    default:
      return humanizeFallbackTitle(fallback);
  }
}

function buildMetadataLine(
  category: PartnerRecentActivityCategory,
  party: string,
  location: string,
  reference: string,
  fallbackSubtitle: string,
) {
  switch (category) {
    case "ORDER":
      return joinParts([party ? `Client: ${party}` : "", location ? `Outlet: ${location}` : ""]) || fallbackSubtitle;
    case "INVOICE":
    case "PAYMENT":
      return joinParts([party ? `Client: ${party}` : "", location ? `Outlet: ${location}` : ""]) || fallbackSubtitle;
    case "CREDIT_NOTE":
    case "DEBIT_NOTE":
      return joinParts([party ? `Client: ${party}` : "", location ? `Outlet: ${location}` : ""]) || fallbackSubtitle;
    default:
      return joinParts([
        party ? `For: ${party}` : "",
        location ? `Outlet: ${location}` : "",
        !party && !location && reference ? `Ref: ${reference}` : "",
      ]) || fallbackSubtitle;
  }
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function humanizeLabel(value: string) {
  return value
    .trim()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeFallbackTitle(value: string) {
  return humanizeLabel(value).replace(/\bFor\b/g, "for");
}

function extractReference(value?: string) {
  const match = value?.match(/\b[A-Z]{2,}(?:-[A-Z0-9]+|\d+)\b/);
  return match?.[0] || "";
}

function extractStatus(value?: string) {
  const match = value?.match(/\b(DRAFT|PLACED|CONFIRMED|PACKED|DISPATCHED|DELIVERED|PARTIALLY_DELIVERED|CANCELLED|RETURNED|PARTIALLY_RETURNED|FINALIZED|ISSUED|PAID|PARTIALLY_PAID|POSTED|REVERSED|ACTIVE)\b/i);
  return match?.[0] || "";
}

function extractSubject(value?: string) {
  const match = value?.match(/\bfor (.+)$/i);
  return match?.[1]?.trim() || "";
}

function formatQuantityImpact(quantityDelta?: number) {
  if (quantityDelta == null || Number.isNaN(quantityDelta)) return "";
  return `${quantityDelta > 0 ? "+" : ""}${quantityDelta} units`;
}

function joinParts(parts: string[]) {
  return parts.map(cleanText).filter(Boolean).join(" • ");
}

function cleanText(value?: string) {
  return (value || "").trim();
}
