import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Html5Icon, JavaScriptIcon } from "@hugeicons/core-free-icons";

const SNIPPETS = {
  html: {
    label: "HTML",
    icon: Html5Icon,
    code: `<form
  action="https://api.formdrop.co/f/your-form-slug"
  method="POST"
>
  <input type="text" name="name" placeholder="Your Name" required />
  <input type="email" name="email" placeholder="Your Email" required />
  <button type="submit">Submit</button>
</form>`,
  },
  fetch: {
    label: "Fetch",
    icon: JavaScriptIcon,
    code: `fetch('https://api.formdrop.co/f/your-form-slug', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "John Doe",
    email: "john.doe@example.com"
  })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))`,
  },
} as const;

type Tab = keyof typeof SNIPPETS;

export function CodePreview() {
  const [tab, setTab] = useState<Tab>("html");
  const active = SNIPPETS[tab];

  return (
    <section className="px-6 pb-8">
      <div className="mx-auto max-w-4xl rounded-[1.4rem] bg-ink-50 p-3">
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          <div className="flex items-center border-b border-ink-100 px-2.5 py-2.5">
            <div className="flex gap-1">
              {(Object.keys(SNIPPETS) as Tab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    tab === key
                      ? "bg-accent-50 text-accent-700"
                      : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                  }`}
                >
                  <HugeiconsIcon icon={SNIPPETS[key].icon} size={15} />
                  {SNIPPETS[key].label}
                </button>
              ))}
            </div>
          </div>

          <pre className="overflow-x-auto bg-ink-950 px-5 py-5 text-left font-mono text-[12.5px] leading-relaxed text-ink-100">
            <code>{active.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
