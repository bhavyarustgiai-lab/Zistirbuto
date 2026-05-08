const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;

export function normalizeGSTINInput(value: string) {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
}

export function isValidGSTIN(value: string) {
  const normalized = normalizeGSTINInput(value);
  return normalized.length === 15 && GSTIN_REGEX.test(normalized);
}

export function getGSTINValidationMessage() {
  return "GSTIN must be a valid 15-character GSTIN.";
}
