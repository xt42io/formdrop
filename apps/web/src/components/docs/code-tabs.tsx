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
    <div className="my-6 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-r border-gray-200 last:border-r-0 hover:bg-gray-100/50",
              activeTab === tab.value
                ? "bg-white text-gray-900 border-b-2 border-b-accent -mb-[1px]"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="p-0">
        {activeCode && (
          <div className="[&>div]:my-0 [&>div]:rounded-none [&>div]:border-0">
            <CodeBlock
              code={activeCode.code}
              language={activeCode.language}
            />
          </div>
        )}
      </div>
    </div>
  );
}
