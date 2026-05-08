export type SupportedPhoneCountry = "IN" | "US";

type CountryMeta = {
  code: SupportedPhoneCountry;
  label: string;
  dialCode: string;
  localLength: number;
  example: string;
  flag: string;
};

const COUNTRY_META: Record<SupportedPhoneCountry, CountryMeta> = {
  IN: {
    code: "IN",
    label: "India (+91)",
    dialCode: "+91",
    localLength: 10,
    example: "9876543210",
    flag: "IN",
  },
  US: {
    code: "US",
    label: "United States (+1)",
    dialCode: "+1",
    localLength: 10,
    example: "4155550123",
    flag: "US",
  },
};

export const PHONE_COUNTRY_OPTIONS = Object.values(COUNTRY_META).map((country) => ({
  value: country.code,
  label: country.label,
}));

export function getPhoneCountryMeta(country: SupportedPhoneCountry) {
  return COUNTRY_META[country];
}

export function formatPhoneLocalNumber(country: SupportedPhoneCountry, value: string) {
  const digits = normalizePhoneLocalNumber(value, country);
  if (country === "US") {
    const first = digits.slice(0, 3);
    const second = digits.slice(3, 6);
    const third = digits.slice(6, 10);
    return [first, second, third].filter(Boolean).join("-");
  }
  const first = digits.slice(0, 5);
  const second = digits.slice(5, 10);
  return [first, second].filter(Boolean).join("-");
}

export function normalizePhoneLocalNumber(value: string, country: SupportedPhoneCountry) {
  return value.replace(/\D/g, "").slice(0, COUNTRY_META[country].localLength);
}

export function buildPhoneValue(country: SupportedPhoneCountry, localNumber: string) {
  const digits = normalizePhoneLocalNumber(localNumber, country);
  return digits ? `${COUNTRY_META[country].dialCode}${digits}` : "";
}

export function isValidPhoneLocalNumber(country: SupportedPhoneCountry, localNumber: string) {
  return normalizePhoneLocalNumber(localNumber, country).length === COUNTRY_META[country].localLength;
}

export function isValidPhoneValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+91") && !trimmed.startsWith("+1")) {
    return false;
  }
  const parsed = parsePhoneValue(value);
  return isValidPhoneLocalNumber(parsed.country, parsed.localNumber);
}

export function getPhoneValidationMessage(country: SupportedPhoneCountry) {
  const meta = COUNTRY_META[country];
  return `${meta.label} numbers must have exactly ${meta.localLength} digits.`;
}

export function parsePhoneValue(value: string): { country: SupportedPhoneCountry; localNumber: string } {
  const trimmed = value.trim();
  if (trimmed.startsWith("+91")) {
    return {
      country: "IN",
      localNumber: normalizePhoneLocalNumber(trimmed.slice(3), "IN"),
    };
  }
  if (trimmed.startsWith("+1")) {
    return {
      country: "US",
      localNumber: normalizePhoneLocalNumber(trimmed.slice(2), "US"),
    };
  }
  return { country: "IN", localNumber: "" };
}

export function formatPhone(value: string) {
  const parsed = parsePhoneValue(value);
  const meta = COUNTRY_META[parsed.country];
  if (!parsed.localNumber) {
    return value;
  }
  return `${meta.dialCode} ${parsed.localNumber}`;
}

export function arePhonesEqual(left: string, right: string) {
  return left.trim() === right.trim();
}
