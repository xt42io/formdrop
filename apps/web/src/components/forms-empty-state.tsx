import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@formdrop/ui";
import { CopyButton } from "@/components/copy-button";

/**
 * The forms empty state (W4 section 4.5: "a real empty state containing the
 * integration snippet").
 *
 * The old one was an icon, a sentence and a button -- it told someone with no
 * forms that they had no forms. This shows what a form is for: the HTML they
 * will paste once they have one, with the endpoint in it.
 *
 * The slug is a placeholder because there is no form yet. That is the point of
 * showing it here: the shape of the integration is knowable before the first
 * form exists, so the empty state can teach it instead of just apologising.
 */
const SNIPPET = `<form action="https://api.formdrop.co/f/YOUR_FORM_ID" method="POST">
  <input name="email" type="email" required />
  <textarea name="message"></textarea>
  <button type="submit">Send</button>
</form>`;

export function FormsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
      <div className="border-b border-ink-100 px-8 py-10 text-center">
        <h3 className="text-lg font-semibold text-ink-950">No forms yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
          A form is an endpoint. Create one, point your HTML at it, and every
          submission lands here -- no backend to write.
        </p>
        <Button
          onClick={onCreate}
          size="md"
          className="mt-6"
          icon={<HugeiconsIcon icon={Add01Icon} size={18} />}
        >
          Create your first form
        </Button>
      </div>

      <div className="bg-ink-50/60 px-8 py-6">
        <p className="mb-3 text-xs font-medium tracking-wide text-ink-500 uppercase">
          What you will paste
        </p>
        <div className="relative overflow-hidden rounded-card border border-ink-200 bg-ink-950">
          <CopyButton text={SNIPPET} />
          <pre className="overflow-x-auto px-5 py-4 text-left font-mono text-[12.5px] leading-[1.8] text-ink-300">
            <code>{SNIPPET}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
