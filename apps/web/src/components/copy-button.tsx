import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors ${
        className !== undefined ? className : "absolute top-4 right-4"
      }`}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <HugeiconsIcon icon={Tick02Icon} className="text-green-600" size={20} />
      ) : (
        <HugeiconsIcon icon={Copy01Icon} className="text-gray-600" size={20} />
      )}
    </button>
  );
}
