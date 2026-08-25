import { z } from "zod";

/** Fields collected on the first screen. */
export const detailsSchema = z.object({
  fullName: z.string().min(1),
  restaurantName: z.string().min(1),
  restaurantAddress: z.string().min(1),
  contactEmail: z.string().email().min(1),
  countryCode: z.string().min(1),
  contactNumber: z.string().min(1),
});

/** Fields collected on the second screen. */
export const messageSchema = z.object({
  subject: z.string().min(1),
  content: z.string().min(1),
});

export const contactSchema = detailsSchema.merge(messageSchema);

export type ContactForm = z.infer<typeof contactSchema>;

/** Field names belonging to the first screen — used to validate it in isolation. */
export const DETAILS_FIELDS = Object.keys(detailsSchema.shape) as (keyof ContactForm)[];
