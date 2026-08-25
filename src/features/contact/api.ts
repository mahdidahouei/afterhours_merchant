import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SelectOption } from "@/ui/Select";
import type { ContactForm } from "./schema";

/** Ticket subjects, already shaped for the <Select>. */
export function useTicketSubjects() {
  return useQuery({
    queryKey: ["contact", "ticket-subjects"],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; name: string }[]>("/ticket-subjects");
      return data.map((subject) => ({ value: subject.id, label: subject.name }));
    },
  });
}

/** Dial codes for the phone field. */
export function useCountryCodes() {
  return useQuery({
    queryKey: ["contact", "country-codes"],
    queryFn: async () => {
      const { data } = await api.get<{ code: string; title: string }[]>("/countries");
      return data.map<SelectOption>((country) => ({
        value: country.code,
        label: `(${country.code}) ${country.title}`,
        shortLabel: country.code,
      }));
    },
    // The field must be usable before the list lands; the Netherlands is the
    // overwhelming default and is also the form's initial value.
    placeholderData: [
      { value: "+31", label: "(+31) Netherlands", shortLabel: "+31" },
    ],
  });
}

export function useSubmitTicket() {
  return useMutation({
    mutationFn: async ({ countryCode, subject, ...rest }: ContactForm) => {
      const { data } = await api.post("/claim-tickets", {
        ...rest,
        contactNumber: `${countryCode}${rest.contactNumber}`,
        subjectId: subject,
      });
      return data;
    },
  });
}
