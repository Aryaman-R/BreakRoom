import { z } from "zod";

export const bookingSchema = z.object({
  name: z
    .string()
    .min(2, "Please tell us your name — even just a first name."),
  email: z
    .string()
    .email("We need a way to reach you — please add a valid email."),
  phone: z.string().optional().or(z.literal("")),
  eventType: z.enum(["birthday", "corporate", "shower", "other"]),
  eventTypeOther: z.string().optional().or(z.literal("")),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick a date."),
  timeSlot: z.string().min(1, "Please pick a time."),
  guestCount: z
    .number()
    .min(5, "Smaller groups can just walk in — try 5 guests or more.")
    .max(60, "We can fit up to 60 — for bigger gatherings, email us directly."),
  catering: z
    .array(z.enum(["coffee_bar", "light_bites", "full_menu", "space_only"]))
    .min(1, "Pick at least one catering option (or just &#8220;Just the space&#8221;)."),
  notes: z.string().max(2000).optional().or(z.literal("")),
  /** Honeypot — bots fill this; real users never see it. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
