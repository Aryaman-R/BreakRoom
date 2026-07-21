import type { Metadata } from "next";
import { AdminScreen } from "@/components/admin/AdminScreen";
import { getSessionUser, isAdminEmail } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Middleware guarantees a session; the allow-list check is the admin gate.
export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) {
    return (
      <main className="container-page max-w-md py-16">
        <h1>Not an admin.</h1>
        <p className="mt-4 text-qh-ink-soft">
          This account can use the{" "}
          <a href="/staff" className="text-qh-accent underline underline-offset-2">
            staff screen
          </a>
          , but the admin area is limited to emails on the{" "}
          <code className="font-mono text-sm">ADMIN_EMAILS</code> list.
        </p>
      </main>
    );
  }
  return <AdminScreen email={user.email ?? ""} />;
}
