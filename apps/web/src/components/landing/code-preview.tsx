import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Icon } from "@formdrop/ui";
import {
  Copy01Icon,
  Html5Icon,
  JavaScriptIcon,
  PackageIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { capture } from "@formdrop/analytics";

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
  sdk: {
    label: "SDK",
    icon: PackageIcon,
    code: `import { FormDrop } from "@formdrop/js";

await FormDrop.submit("your-form-slug", {
  name: "John Doe",
  email: "john.doe@example.com"
})`,
  },
} as const;

type Tab = keyof typeof SNIPPETS;

/**
 * A light palette: the code reads almost monochrome, with string values
 * carrying the only strong colour. Keys and tag names stay in ink so the shape
 * of the snippet comes from weight rather than from a rainbow of tokens.
 */
const STRING = "text-code-string";
const NAME = "text-ink-100";
const KEYWORD = "text-accent-300";
const METHOD = "text-ink-400";
const PUNCT = "text-ink-500";

/**
 * Just enough highlighting for the snippets on show, so the section reads like
 * an editor without pulling in a highlighter. Every alternative is a whole
 * match, and the class is picked by which group landed, so the original text is
 * always reproduced verbatim — only wrapped.
 */
const GRAMMARS: Record<Tab, { re: RegExp; classes: string[] }> = {
  html: {
    re: /("[^"]*")|(<\/?[a-zA-Z][\w-]*)|([a-zA-Z-]+(?==))|(\/?>)/g,
    classes: [STRING, KEYWORD, NAME, PUNCT],
  },
  fetch: {
    re: /('[^']*'|"[^"]*")|\b(fetch|JSON|console)\b|([a-zA-Z_$][\w$]*)(?=\s*:)|(\.[a-zA-Z_$][\w$]*)|(=>|[{}()[\],;])/g,
    classes: [STRING, KEYWORD, NAME, METHOD, PUNCT],
  },
  sdk: {
    re: /('[^']*'|"[^"]*")|\b(import|from|await)\b|([a-zA-Z_$][\w$]*)(?=\s*:)|(\.[a-zA-Z_$][\w$]*)|(=>|[{}()[\],;])/g,
    classes: [STRING, KEYWORD, NAME, METHOD, PUNCT],
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

const TABS = Object.keys(SNIPPETS) as Tab[];

export function CodePreview() {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>("html");
  const [copied, setCopied] = useState(false);
  const active = SNIPPETS[tab];

  const copy = () => {
    navigator.clipboard.writeText(active.code);
    capture("snippet_copied", { language: tab });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="px-6 pb-8">
      {/* One frame holding the whole thing. The switcher used to float above
          it as a separate pill, which read as two unrelated controls with a
          gap between them; the tabs belong to the panel they change. */}
      <div className="mx-auto max-w-4xl rounded-panel border border-ink-200 bg-ink-50/70 p-2.5">
        <div className="overflow-hidden rounded-card border border-white/10 bg-ink-950">
          {/* tab strip */}
          <div
            role="tablist"
            aria-label="Choose a snippet"
            className="flex items-center gap-1 border-b border-white/[0.07] px-2 pt-2"
          >
            {TABS.map((key) => {
              const selected = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(key)}
                  className={`relative flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                    selected ? "text-white" : "text-ink-500 hover:text-ink-200"
                  }`}
                >
                  {/* The lit ground follows the selection rather than each tab
                      fading its own in, so the eye tracks one object moving. */}
                  {selected && (
                    <motion.span
                      layoutId="snippet-tab"
                      className="absolute inset-0 rounded-t-lg bg-white/[0.07]"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 34 }
                      }
                    />
                  )}
                  <Icon
                    icon={SNIPPETS[key].icon}
                    size={15}
                    className="relative"
                  />
                  <span className="relative">{SNIPPETS[key].label}</span>
                </button>
              );
            })}
          </div>

          {/* the request line, and the copy control */}
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3">
            <span className="flex min-w-0 items-center gap-2 font-mono text-[11.5px] text-ink-400">
              <span className="rounded bg-accent-500/25 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent-300">
                POST
              </span>
              <span className="truncate">api.formdrop.co/f/your-form-slug</span>
            </span>

            <button
              type="button"
              onClick={copy}
              aria-label="Copy snippet"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-medium text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100"
            >
              <Icon
                icon={copied ? Tick02Icon : Copy01Icon}
                size={14}
                className={copied ? "text-accent-300" : undefined}
              />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* mode="wait" so one snippet is gone before the next arrives —
              crossfading two blocks of code at different line counts reads as
              a flicker rather than a change. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.pre
              key={tab}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{
                duration: reduceMotion ? 0 : 0.18,
                ease: "easeOut",
              }}
              className="overflow-x-auto px-5 py-4 text-left font-mono text-[12.5px] leading-[1.8] text-ink-300"
            >
              <code>
                {active.code.split("\n").map((line, index) => (
                  <span key={index} className="block">
                    {tokenize(line, tab).map((token, position) => (
                      <span key={position} className={token.cls}>
                        {token.text}
                      </span>
                    ))}
                    {line === "" ? "\n" : ""}
                  </span>
                ))}
              </code>
            </motion.pre>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
