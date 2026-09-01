import { motion } from "motion/react";
import {
  CheckCircle2,
  Zap,
  Table,
  Hash,
  MessageSquare,
  Mail,
} from "lucide-react";

export function Integrations() {
  const integrations = [
    {
      name: "Google Sheets",
      icon: Table,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    { name: "Slack", icon: Hash, color: "text-purple-600", bg: "bg-purple-50" },
    {
      name: "Discord",
      icon: MessageSquare,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    { name: "Email", icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="py-32 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Connect with your favorite tools
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Streamline your workflow by connecting FormDrop to the tools you
              already use. Automatically sync submissions to Google Sheets or
              get notified in Slack and Discord.
            </p>
            <div className="space-y-4">
              {[
                "Unlimited Forms",
                "Unlimited Submissions",
                "Real-time notifications via Email, Slack & Discord",
                "Auto-sync to Google Sheets",
                "Powerful analytics and reporting",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-green-600" size={14} />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative">
            {/* Central Hub Visualization */}
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Center Node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-gray-100 relative">
                  <div className="absolute inset-0 bg-accent/5 rounded-3xl animate-pulse"></div>
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white relative z-10">
                    <Zap size={24} fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Orbiting Nodes */}
              {integrations.map((item, i) => {
                const angle = (i * 360) / integrations.length;
                const radius = 140; // Distance from center
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2"
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    whileInView={{ x, y, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: i * 0.1,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                  >
                    {/* Connecting Line */}
                    <div
                      className="absolute top-1/2 left-1/2 h-0.5 bg-linear-to-r from-accent/20 to-transparent origin-left -z-10"
                      style={{
                        width: radius,
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius / 2}px, 0)`,
                      }}
                    />

                    <div
                      className={`-translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center ${item.color} hover:scale-110 transition-transform cursor-pointer`}
                    >
                      <item.icon size={24} />
                    </div>
                  </motion.div>
                );
              })}

              {/* Orbit Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border border-dashed border-gray-200 rounded-full -z-10 animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-gray-100 rounded-full -z-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
