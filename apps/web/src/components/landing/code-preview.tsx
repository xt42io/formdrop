import { useState } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Html5Icon, JavaScriptIcon } from "@hugeicons/core-free-icons";
import { CopyButton } from "../copy-button";

export function CodePreview() {
  const [selectedTab, setSelectedTab] = useState<"html" | "fetch">("html");

  const htmlCodeExample = `<form
  action="https://api.formdrop.co/f/your-form-slug"
  method="POST"
>
  <input type="text" name="name" placeholder="Your Name" required />
  <input type="email" name="email" placeholder="Your Email" required />
  <button type="submit">Submit</button>
</form>`;

  const fetchCodeExample = `fetch('https://api.formdrop.co/f/your-form-slug', {
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
  .catch(err => console.error(err))
`;

  return (
    <div className="max-w-5xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="border rounded-3xl border-gray-200 bg-white max-w-4xl mx-auto mt-20 p-2 relative"
      >
        <div className="absolute -inset-1 bg-linear-to-r from-accent/30 to-purple-600/30 rounded-4xl blur-xl opacity-20 -z-10"></div>
        <div className="bg-gray-50/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-x-2 bg-white p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setSelectedTab("html")}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTab === "html"
                    ? "text-orange-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {selectedTab === "html" && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-orange-100 ring-1 ring-orange-200 rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <HugeiconsIcon icon={Html5Icon} size={20} />
                  HTML
                </span>
              </button>
              <button
                onClick={() => setSelectedTab("fetch")}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTab === "fetch"
                    ? "text-yellow-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {selectedTab === "fetch" && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-yellow-100 ring-1 ring-yellow-200 rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <HugeiconsIcon icon={JavaScriptIcon} size={20} />
                  Fetch
                </span>
              </button>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/50" />
              <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/50" />
            </div>
          </div>
          <div className="relative group text-left">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton
                text={
                  selectedTab === "html" ? htmlCodeExample : fetchCodeExample
                }
              />
            </div>
            <pre className="font-mono text-sm overflow-x-auto p-4 rounded-xl bg-white border border-gray-200 text-gray-800 leading-relaxed">
              <code>
                {selectedTab === "html" ? htmlCodeExample : fetchCodeExample}
              </code>
            </pre>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
