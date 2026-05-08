export function ledgerTypeLabel(type: string) {
  switch (type) {
    case "INVOICE":
      return "Invoice";
    case "PAYMENT":
      return "Payment";
    case "CREDIT_NOTE":
      return "Credit note";
    case "CREDIT_NOTE_VOID":
      return "Credit note voided";
    case "DEBIT_NOTE":
      return "Debit note";
    default:
      return type;
  }
}
