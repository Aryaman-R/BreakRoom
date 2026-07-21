import type { Metadata } from "next";
import { StaffScreen } from "@/components/staff/StaffScreen";

export const metadata: Metadata = {
  title: "Staff — Orders",
  robots: { index: false, follow: false },
};

// Middleware redirects to /login when there's no session.
export default function StaffPage() {
  return <StaffScreen />;
}
