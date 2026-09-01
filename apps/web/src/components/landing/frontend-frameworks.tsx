import { motion } from "motion/react";

export function FrontendFrameworks() {
  return (
    <div className="py-32 bg-gray-50 border-y border-gray-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-7xl md:text-4xl font-bold text-gray-900 mb-6">
            Bring Your Own Frontend
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            FormDrop is framework agnostic. Whether you're building a static
            site, a single page app, or a server-rendered application, we've got
            you covered.
          </p>
        </motion.div>
      </div>

      <div className="relative flex flex-col gap-8">
        {/* Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-gray-50 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-gray-50 to-transparent z-10"></div>

        {/* Row 1 - Left to Right */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-6 px-3"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 30,
            }}
          >
            {[
              ...[
                { name: "React", color: "text-blue-500 bg-blue-50" },
                { name: "Vue.js", color: "text-green-500 bg-green-50" },
                { name: "Next.js", color: "text-gray-800 bg-gray-100" },
                { name: "Svelte", color: "text-orange-500 bg-orange-50" },
                { name: "Remix", color: "text-indigo-500 bg-indigo-50" },
                { name: "Astro", color: "text-purple-500 bg-purple-50" },
                { name: "Solid", color: "text-blue-600 bg-blue-50" },
              ],
              ...[
                { name: "React", color: "text-blue-500 bg-blue-50" },
                { name: "Vue.js", color: "text-green-500 bg-green-50" },
                { name: "Next.js", color: "text-gray-800 bg-gray-100" },
                { name: "Svelte", color: "text-orange-500 bg-orange-50" },
                { name: "Remix", color: "text-indigo-500 bg-indigo-50" },
                { name: "Astro", color: "text-purple-500 bg-purple-50" },
                { name: "Solid", color: "text-blue-600 bg-blue-50" },
              ],
            ].map((tech, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl border border-gray-200/50 shadow-sm whitespace-nowrap ${tech.color}`}
              >
                <span className="font-bold text-lg">{tech.name}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Row 2 - Right to Left */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-6 px-3"
            animate={{ x: ["-50%", "0%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 30,
            }}
          >
            {[
              ...[
                { name: "HTML5", color: "text-orange-600 bg-orange-50" },
                { name: "Angular", color: "text-red-600 bg-red-50" },
                { name: "Nuxt", color: "text-green-600 bg-green-50" },
                { name: "Gatsby", color: "text-purple-600 bg-purple-50" },
                { name: "Qwik", color: "text-blue-500 bg-blue-50" },
                { name: "Eleventy", color: "text-gray-700 bg-gray-100" },
                { name: "Jekyll", color: "text-red-500 bg-red-50" },
              ],
              ...[
                { name: "HTML5", color: "text-orange-600 bg-orange-50" },
                { name: "Angular", color: "text-red-600 bg-red-50" },
                { name: "Nuxt", color: "text-green-600 bg-green-50" },
                { name: "Gatsby", color: "text-purple-600 bg-purple-50" },
                { name: "Qwik", color: "text-blue-500 bg-blue-50" },
                { name: "Eleventy", color: "text-gray-700 bg-gray-100" },
                { name: "Jekyll", color: "text-red-500 bg-red-50" },
              ],
            ].map((tech, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl border border-gray-200/50 shadow-sm whitespace-nowrap ${tech.color}`}
              >
                <span className="font-bold text-lg">{tech.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
