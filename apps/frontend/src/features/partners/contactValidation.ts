import { getPhoneValidationMessage, isValidPhoneValue, parsePhoneValue } from "@shared/lib/phone";
import type { ClientContactFormValue } from "@features/partners/ClientContactFields";

export type ContactFieldError = {
  name?: string;
  phone?: string;
};

export function validateContacts(
  contacts: ClientContactFormValue[],
  options: { requireAtLeastOne: boolean },
): {
  sectionError: string;
  fieldErrors: ContactFieldError[];
  validContacts: ClientContactFormValue[];
} {
  const normalized = contacts.map((contact) => ({
    name: contact.name.trim(),
    phone: contact.phone.trim(),
  }));
  const validContacts = normalized.filter((contact) => contact.name && contact.phone);
  const hasAnyInput = normalized.some((contact) => contact.name || contact.phone);
  const fieldErrors = normalized.map<ContactFieldError>((contact) => {
    if (!contact.name && !contact.phone) {
      return {};
    }

    const rowError: ContactFieldError = {};
    if (!contact.name) {
      rowError.name = "Contact name is required.";
    }
    if (!contact.phone) {
      rowError.phone = "Phone number is required.";
    } else if (!isValidPhoneValue(contact.phone)) {
      rowError.phone = getPhoneValidationMessage(parsePhoneValue(contact.phone).country);
    }
    return rowError;
  });

  if (options.requireAtLeastOne && !validContacts.length && !hasAnyInput) {
    return {
      sectionError: "At least one contact is required.",
      fieldErrors,
      validContacts,
    };
  }

  return {
    sectionError: "",
    fieldErrors,
    validContacts,
  };
}
