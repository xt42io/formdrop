import { useState } from "react";
import { CodeBlock } from "./code-block";
import { cn } from "@/lib/utils";

interface Tab {
  title: string;
  value: string;
  code: string;
  language: string;
}

/**
 * `maxHeight` is opt-in and off by default, so the docs pages -- where a
 * snippet should simply be as tall as it is -- are untouched. It exists for
 * the integration dialog, where a long React example otherwise pushed the
 * modal past the bottom of the viewport with no way to reach the rest.
 */
export function CodeTabs({
  tabs,
  maxHeight,
}: {
  tabs: Tab[];
  maxHeight?: string;
}) {
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
        <div className="relative">
          <div
            className="overflow-auto [&>div]:my-0 [&>div]:rounded-none [&>div]:border-0"
            style={maxHeight ? { maxHeight } : undefined}
          >
            <CodeBlock code={activeCode.code} language={activeCode.language} />
          </div>
          {/* A fade at the lower edge, so a clipped snippet reads as "there is
              more below" rather than as one that simply ends there. Only when
              a height is imposed; pointer-events-none so it never eats a
              click or a scroll. */}
          {maxHeight && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-ink-950 to-transparent" />
          )}
        </div>
      )}
    </div>
  );
}
