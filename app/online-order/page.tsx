import type { Metadata } from "next";
import { GoogleFormEmbed } from "@/components/booking/GoogleFormEmbed";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Online Order",
  description:
    "Online ordering is coming soon to The Breakroom. Tell us you're interested and we'll let you know when it's live.",
};

export default function OnlineOrderPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
          Online Order
        </p>
        <h1 className="mt-3 font-display tracking-tighter2">
          Coming soon.
        </h1>
        <p className="mt-5 text-qh-ink-soft text-lg">
          We&#8217;re working on letting you order ahead from The Breakroom.
          It&#8217;s not live yet &mdash; but if it&#8217;s something you&#8217;d
          use, let us know below.
        </p>
      </header>
      <div className="hand-divider mt-10" />

      <Reveal>
        <div className="mt-12 rounded-2xl border border-qh-accent/30 bg-qh-accent-soft/30 p-5 sm:p-6">
          <p className="flex items-start gap-3 text-sm text-qh-ink leading-6">
            <span aria-hidden="true" className="text-lg leading-none">⚠️</span>
            <span>
              <span className="font-medium">Heads up:</span> there is no online
              ordering at the moment. This is just an interest form &mdash;
              submitting it does <span className="font-medium">not</span> place an
              order. To order today, use{" "}
              <a
                href="https://www.doordash.com/store/the-breakroom-bothell-45695059/111526546/?pickup=false"
                target="_blank"
                rel="noopener noreferrer"
                className="text-qh-accent underline underline-offset-2"
              >
                DoorDash
              </a>{" "}
              or come{" "}
              <a
                href="/visit"
                className="text-qh-accent underline underline-offset-2"
              >
                visit us
              </a>
              .
            </span>
          </p>
        </div>
      </Reveal>

      <section className="mt-12">
        <Reveal>
          <h2 className="font-display text-2xl">Tell us you&#8217;re interested</h2>
          <p className="mt-2 text-qh-ink-soft max-w-lg">
            A quick note so we know online ordering is worth building &mdash; and
            so we can let you know when it goes live.
          </p>
          <div className="mt-6">
            <GoogleFormEmbed
              src="https://docs.google.com/forms/d/e/1FAIpQLSf_M1odxTS8_6aLvKCKtHLC5IE2nC6rbEdNDksGjCT2rSK8cw/viewform?embedded=true"
              title="The Breakroom — online order interest form"
              label="Online order interest"
              heightClass="h-[1150px] sm:h-[820px]"
              variant="quiet-hours"
            />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
