import { Check, Copy } from "lucide-react";
import { useState } from "react";

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl bg-gray-900 overflow-hidden my-6 border border-gray-800">
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
        <span className="ml-2 text-xs font-mono text-gray-500">{language}</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300 leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
}
