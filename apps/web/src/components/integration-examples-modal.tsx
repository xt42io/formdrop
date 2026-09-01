import { motion, AnimatePresence } from "motion/react";
import { CodeTabs } from "@/components/docs/code-tabs";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface IntegrationExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  formSlug: string;
}

export function IntegrationExamplesModal({
  isOpen,
  onClose,
  formSlug,
}: IntegrationExamplesModalProps) {
  const origin = "https://api.formdrop.co";
  const endpoint = `${origin}/f/${formSlug}`;

  const tabs = [
    {
      title: "HTML",
      value: "html",
      language: "html",
      code: `<form action="${endpoint}" method="POST">
  <input type="email" name="email" placeholder="Email" required />
  <textarea name="message" placeholder="Message" required></textarea>
  <button type="submit">Send</button>
</form>`,
    },
    {
      title: "React",
      value: "react",
      language: "tsx",
      code: `function ContactForm() {
  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    await fetch("${endpoint}", {
      method: "POST",
      body: formData,
      headers: {
        "Accept": "application/json"
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}`,
    },
    {
      title: "cURL",
      value: "curl",
      language: "bash",
      code: `curl -X POST ${endpoint} \\
  -F "email=user@example.com" \\
  -F "message=Hello world!"`,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">Integration Examples</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Use your unique endpoint to collect submissions from anywhere.
              </p>

              <CodeTabs tabs={tabs} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
