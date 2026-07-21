import type { Metadata } from "next";
import { LoginForm } from "@/components/staff/LoginForm";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Only ever bounce to our own screens.
  const next = searchParams.next?.startsWith("/") ? searchParams.next : "/staff";
  return (
    <main className="container-page flex min-h-dvh max-w-md flex-col justify-center py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-qh-accent">
        The Breakroom · Staff
      </p>
      <h1 className="mt-2 text-3xl">Sign in.</h1>
      <LoginForm next={next} />
      <p className="mt-6 text-sm text-qh-ink-soft">
        Accounts are created by the owner in the Supabase dashboard.
      </p>
    </main>
  );
}
