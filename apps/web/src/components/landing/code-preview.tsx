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

const STRING = "text-[#86efac]";
const NAME = "text-[#7dd3fc]";
const PUNCT = "text-ink-500";

/**
 * Just enough highlighting for the two snippets on show, so the section reads
 * like an editor without pulling in a highlighter. Every alternative is a whole
 * match, and the class is picked by which group landed, so the original text is
 * always reproduced verbatim — only wrapped.
 */
const GRAMMARS: Record<Tab, { re: RegExp; classes: string[] }> = {
  html: {
    re: /("[^"]*")|(<\/?[a-zA-Z][\w-]*)|([a-zA-Z-]+(?==))|(\/?>)/g,
    classes: [STRING, "text-accent-300", NAME, PUNCT],
  },
  fetch: {
    re: /('[^']*'|"[^"]*")|\b(fetch|JSON|console)\b|([a-zA-Z_$][\w$]*)(?=\s*:)|(\.[a-zA-Z_$][\w$]*)|(=>|[{}()[\],;])/g,
    classes: [STRING, "text-accent-300", NAME, "text-[#fcd34d]", PUNCT],
  },
};

type Token = { text: string; cls?: string };

function tokenize(line: string, tab: Tab): Token[] {
  const { re, classes } = GRAMMARS[tab];
  const out: Token[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  re.lastIndex = 0;
  while ((match = re.exec(line)) !== null) {
    if (match[0] === "") {
      re.lastIndex += 1;
      continue;
    }
    if (match.index > last) out.push({ text: line.slice(last, match.index) });
    const group = match.slice(1).findIndex((value) => value !== undefined);
    out.push({ text: match[0], cls: classes[group] });
    last = match.index + match[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });

  return out;
}

export function CodePreview() {
  const [tab, setTab] = useState<Tab>("html");
  const active = SNIPPETS[tab];
  const lines = active.code.split("\n");

  return (
    <section className="relative px-6 pb-8">
      <div className="relative mx-auto max-w-4xl">
        {/* the slab lifts off the page rather than sitting flat on it */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-8 bottom-0 -z-10 rounded-[2rem] bg-accent-500/25 blur-[46px]"
        />

        <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-ink-950 shadow-lift">
          {/* a light catching the top edge */}
          <div className="h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />

          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-2.5">
            <div className="flex gap-1">
              {(Object.keys(SNIPPETS) as Tab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    tab === key
                      ? "bg-white/10 text-white"
                      : "text-ink-400 hover:bg-white/5 hover:text-ink-200"
                  }`}
                >
                  <HugeiconsIcon icon={SNIPPETS[key].icon} size={15} />
                  {SNIPPETS[key].label}
                </button>
              ))}
            </div>

            <span className="hidden items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1 font-mono text-[11px] text-ink-400 sm:flex">
              <span className="rounded bg-accent-500/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent-300">
                POST
              </span>
              api.formdrop.co
            </span>
          </div>

          <div className="overflow-x-auto py-5 font-mono text-[12.5px] leading-[1.75]">
            {lines.map((line, index) => (
              <div
                key={index}
                className="flex gap-4 px-5 whitespace-pre text-ink-200"
              >
                <span className="w-4 shrink-0 text-right text-ink-700 select-none">
                  {index + 1}
                </span>
                <span>
                  {tokenize(line, tab).map((token, position) => (
                    <span key={position} className={token.cls}>
                      {token.text}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
