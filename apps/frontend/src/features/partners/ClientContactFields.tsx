import { Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { FormMessage } from "@components/ui/form-message";
import { PartnerFieldLabel } from "@features/partners/PartnerFieldLabel";
import { Input } from "@components/ui/input";
import { PhoneInput } from "@shared/ui/molecules/PhoneInput";
import { cn } from "@shared/lib/cn";
import type { ContactFieldError } from "@features/partners/contactValidation";

export type ClientContactFormValue = {
  name: string;
  phone: string;
};

type Props = {
  contacts: ClientContactFormValue[];
  onChange: (contacts: ClientContactFormValue[]) => void;
  title?: string;
  description?: string;
  error?: string;
  fieldErrors?: ContactFieldError[];
  allowRemoveFirst?: boolean;
  requireIfPresent?: boolean;
  onAddBlocked?: () => void;
};

export function ClientContactFields({
  contacts,
  onChange,
  title = "Contact Details",
  description,
  error = "",
  fieldErrors = [],
  allowRemoveFirst = false,
  requireIfPresent = false,
  onAddBlocked,
}: Props) {
  const updateContact = (index: number, patch: Partial<ClientContactFormValue>) => {
    onChange(contacts.map((contact, currentIndex) => (
      currentIndex === index ? { ...contact, ...patch } : contact
    )));
  };

  const addContact = () => {
    if (
      requireIfPresent &&
      contacts.some((contact) => !contact.name.trim() || !contact.phone.trim())
    ) {
      onAddBlocked?.();
      return;
    }
    onChange([...contacts, { name: "", phone: "" }]);
  };

  const removeContact = (index: number) => {
    onChange(contacts.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-slate-50/60 p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 whitespace-nowrap rounded-2xl border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm"
          onClick={addContact}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {contacts.map((contact, index) => {
          const rowErrors = fieldErrors[index] ?? {};
          return (
          <Card key={index} className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Contact {index + 1}</p>
                  </div>
                </div>
                {index > 0 || allowRemoveFirst ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-xl px-2.5 text-slate-500"
                    onClick={() => removeContact(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1.5 text-sm">Delete</span>
                  </Button>
                ) : null}
              </div>

              <div className="space-y-4 p-4">
              <div>
                <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={requireIfPresent}>
                  Contact name
                </PartnerFieldLabel>
                <Input
                  value={contact.name}
                  onChange={(event) => updateContact(index, { name: event.target.value })}
                  placeholder="Enter contact full name"
                  name={`contact-name-${index}`}
                  autoComplete={`section-contact-${index} name`}
                  className={cn(
                    "h-12 rounded-2xl border-slate-200 bg-white text-[15px]",
                    rowErrors.name ? "border-rose-300 ring-2 ring-rose-100" : "",
                  )}
                />
                {rowErrors.name ? <FormMessage>{rowErrors.name}</FormMessage> : null}
              </div>
              <div>
                <PartnerFieldLabel className="mb-2 text-sm font-semibold text-slate-800" required={requireIfPresent}>
                  Phone number
                </PartnerFieldLabel>
                <PhoneInput
                  value={contact.phone}
                  onChange={(value) => updateContact(index, { phone: value })}
                  placeholder="Enter contact phone number"
                  name={`contact-phone-${index}`}
                  autoComplete={`section-contact-${index} tel-national`}
                  className={cn(
                    "h-12 rounded-2xl border-slate-200 bg-white",
                    rowErrors.phone ? "border-rose-300 ring-2 ring-rose-100" : "",
                  )}
                />
                {rowErrors.phone ? <FormMessage>{rowErrors.phone}</FormMessage> : null}
              </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
      {error ? <FormMessage className="text-sm">{error}</FormMessage> : null}
    </section>
  );
}
