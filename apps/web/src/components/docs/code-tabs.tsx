import { useState } from "react";
import { CodeBlock } from "./code-block";
import { cn } from "@/lib/utils";

interface Tab {
  title: string;
  value: string;
  code: string;
  language: string;
}

export function CodeTabs({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].value);

  const activeCode = tabs.find((tab) => tab.value === activeTab);

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-ink-200">
      {/* A light pill strip over the dark slab, matching the landing snippet.
          The old version faked a bottom-border tab with a -mb-[1px] offset. */}
      <div className="flex gap-1 border-b border-ink-200 bg-ink-50 p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "cursor-pointer rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              activeTab === tab.value
                ? "border border-ink-200/70 bg-white text-ink-950"
                : "border border-transparent text-ink-500 hover:text-ink-800",
            )}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {activeCode && (
        <div className="[&>div]:my-0 [&>div]:rounded-none [&>div]:border-0">
          <CodeBlock code={activeCode.code} language={activeCode.language} />
        </div>
      )}
    </div>
  );
}
