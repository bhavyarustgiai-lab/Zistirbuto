export function todayISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toLongDate(dateISO: string) {
  const date = new Date(`${dateISO}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function formatMoney(value?: number) {
  if (value == null) {
    return "-";
  }
  return `$${value}`;
}
