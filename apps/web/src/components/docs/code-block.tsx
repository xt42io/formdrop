import { Icon } from "@formdrop/ui";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { capture } from "@formdrop/analytics";

export function CodeBlock({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    capture("snippet_copied", { language });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // The root stays a single bordered, rounded, my-6 element because CodeTabs
  // flattens exactly that when it embeds this.
  return (
    <div className="relative my-6 overflow-hidden rounded-xl border border-white/10 bg-ink-950">
      {/* a light catching the top edge, as on the landing snippet */}
      <div className="h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />

      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5">
        <span className="font-mono text-[11.5px] text-ink-400">{language}</span>

        {/* Always visible. This used to be opacity-0 until hover, which meant
            it simply did not exist on touch devices. */}
        <button
          onClick={copyToClipboard}
          aria-label="Copy code"
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-medium text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100"
        >
          <Icon
            icon={copied ? Tick02Icon : Copy01Icon}
            size={13}
            className={copied ? "text-accent-300" : undefined}
          />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="overflow-x-auto px-4 py-4">
        <pre className="font-mono text-[12.5px] leading-[1.8] text-ink-300">
          {code}
        </pre>
      </div>
    </div>
  );
}
