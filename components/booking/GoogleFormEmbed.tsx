/**
 * Booking + catering inquiries are handled by an embedded Google Form.
 *
 * To connect your form:
 *   1. Open your form in Google Forms → click "Send" → the "< >" (embed) tab.
 *   2. Copy the URL from the src="..." attribute. It looks like:
 *        https://docs.google.com/forms/d/e/1FAIpQLSxxxxxxxx/viewform?embedded=true
 *   3. Paste it into GOOGLE_FORM_SRC below (keep the ?embedded=true).
 *
 * Tip: Google Form iframes don't auto-resize. If the form is taller/shorter
 * than the frame, tune FORM_HEIGHT (in px) so there's no inner scrollbar.
 */
const GOOGLE_FORM_SRC =
  "https://docs.google.com/forms/d/e/1FAIpQLSeIfi6i39cW6kjEmB-LtEBoHJljz-mjNH-bCb4QGlIDfrWTZQ/viewform?embedded=true";

const FORM_HEIGHT = 1400;

export function GoogleFormEmbed() {
  return (
    <div>
      <div className="overflow-hidden rounded-3xl border border-ah-cream/15 bg-ah-cream shadow-lifted">
        <iframe
          src={GOOGLE_FORM_SRC}
          title="The Breakroom — events & catering inquiry form"
          loading="lazy"
          className="block w-full"
          style={{ height: FORM_HEIGHT }}
        >
          Loading the form…
        </iframe>
      </div>
      <p className="mt-4 text-sm text-ah-cream/60">
        Form not loading?{" "}
        <a
          href={GOOGLE_FORM_SRC.replace("?embedded=true", "")}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-ah-cream"
        >
          Open it in a new tab
        </a>
        .
      </p>
    </div>
  );
}
