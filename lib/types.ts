/**
 * Shared domain types. The shape of these is part of the contract between
 * the UI, the API routes, and (eventually) the persistence layer.
 */

export type DietaryTag = "V" | "GF" | "DF" | "N";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  tags: DietaryTag[];
}

export interface MenuCategory {
  id: string;
  name: string;
  blurb: string;
  items: MenuItem[];
}

export interface Special {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: "cup" | "bowl" | "cake";
}

export interface PublicEvent {
  id: string;
  title: string;
  date: string;        // ISO YYYY-MM-DD
  time: string;        // human-readable
  description: string;
  host: string;
}

export type EventType = "birthday" | "corporate" | "shower" | "other";

export interface BookingInput {
  name: string;
  email: string;
  phone?: string;
  eventType: EventType;
  eventTypeOther?: string;
  date: string;        // ISO YYYY-MM-DD
  timeSlot: string;    // e.g. "6:00 PM"
  guestCount: number;
  catering: ("coffee_bar" | "light_bites" | "full_menu" | "space_only")[];
  notes?: string;
  /** Honeypot — bots fill this; real users never see it. */
  website?: string;
}

export interface Booking extends BookingInput {
  id: string;
  createdAt: string;   // ISO timestamp
  status: "pending" | "confirmed" | "cancelled";
}

export interface AvailabilitySlot {
  /** "6:00 PM", "7:30 PM", … */
  time: string;
  available: boolean;
}
