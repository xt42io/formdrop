import { Icon, Modal } from "@formdrop/ui";
import { CodeTabs } from "@/components/code-tabs";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { CopyButton } from "@/components/copy-button";

interface IntegrationExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  formSlug: string;
}

export function IntegrationExamplesModal({
  isOpen,
  onClose,
  formSlug,
}: IntegrationExamplesModalProps) {
  const origin = "https://api.formdrop.co";
  const endpoint = `${origin}/f/${formSlug}`;

  const tabs = [
    {
      title: "HTML",
      value: "html",
      language: "html",
      code: `<form action="${endpoint}" method="POST">
  <input type="email" name="email" placeholder="Email" required />
  <textarea name="message" placeholder="Message" required></textarea>
  <button type="submit">Send</button>
</form>`,
    },
    {
      title: "React",
      value: "react",
      language: "tsx",
      code: `function ContactForm() {
  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    await fetch("${endpoint}", {
      method: "POST",
      body: formData,
      headers: {
        "Accept": "application/json"
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}`,
    },
    {
      title: "cURL",
      value: "curl",
      language: "bash",
      code: `curl -X POST ${endpoint} \\
  -F "email=user@example.com" \\
  -F "message=Hello world!"`,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      label="Integration Examples"
      scrim="bg-black/40 backdrop-blur-sm"
      className="flex max-h-[85vh] flex-col"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Integration guide
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Point any form at this endpoint. No key, no SDK, no backend.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 cursor-pointer rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <Icon icon={Cancel01Icon} size={20} />
        </button>
      </div>

      {/* The endpoint, on its own and copyable. It is the one thing anyone
          opens this dialog for, and it was previously only reachable by
          reading it out of a code sample. */}
      <div className="shrink-0 border-b border-ink-100 bg-ink-50/60 px-6 py-4">
        <p className="mb-2 text-[11px] font-medium tracking-wide text-ink-500 uppercase">
          Your endpoint
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-2.5 pr-2 pl-3.5">
          <span className="mr-auto truncate font-mono text-[13px] text-ink-950">
            {endpoint}
          </span>
          <span className="shrink-0 rounded-md bg-tint-green px-2 py-0.5 font-mono text-[11px] font-semibold text-tint-green-ink">
            POST
          </span>
          <CopyButton text={endpoint} className="relative" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <CodeTabs tabs={tabs} maxHeight="18rem" />
      </div>
    </Modal>
  );
}
