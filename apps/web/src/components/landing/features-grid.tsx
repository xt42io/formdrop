import {
  BarChart3,
  Bell,
  Workflow,
  Table,
  Hash,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function FeaturesGrid() {
  return (
    <div className="py-32 bg-gray-50/50 mt-20 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to handle forms
          </h2>
          <p className="text-gray-600 text-lg">
            Stop worrying about servers, spam, and database maintenance. We
            handle the messy part so you can focus on building.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Analytics - Spans 2 cols */}
          <div className="md:col-span-2 bg-white rounded-4xl border border-gray-200 p-8 overflow-hidden relative group hover:border-accent/20 transition-colors">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Real-time Analytics
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-md">
                Track form views, submissions, and conversion rates in
                real-time. Get insights into how your forms are performing.
              </p>
            </div>

            {/* Visual */}
            <div className="absolute right-0 bottom-0 w-1/2 h-48 bg-gray-50 rounded-tl-3xl border-t border-l border-gray-100 p-4 flex items-end gap-2 group-hover:scale-105 transition-transform origin-bottom-right">
              {/* Fake bars */}
              <div className="w-full bg-accent/10 rounded-t-lg h-[40%] relative group-hover:h-[50%] transition-all duration-500"></div>
              <div className="w-full bg-accent/20 rounded-t-lg h-[70%] relative group-hover:h-[80%] transition-all duration-500 delay-75"></div>
              <div className="w-full bg-accent/30 rounded-t-lg h-[50%] relative group-hover:h-[60%] transition-all duration-500 delay-100"></div>
              <div className="w-full bg-accent/40 rounded-t-lg h-[85%] relative group-hover:h-[95%] transition-all duration-500 delay-150"></div>
              <div className="w-full bg-accent rounded-t-lg h-[65%] relative group-hover:h-[75%] transition-all duration-500 delay-200"></div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-4xl border border-gray-200 p-8 relative overflow-hidden group hover:border-accent/20 transition-colors">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <Bell size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Instant Alerts
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get notified immediately via Email, Slack, or Discord.
              </p>
            </div>

            {/* Visual */}
            <div className="absolute -right-4 top-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Bell size={120} />
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-white rounded-4xl border border-gray-200 p-8 relative overflow-hidden group hover:border-accent/20 transition-colors">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Workflow size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Integrations
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Connect to Google Sheets, Webhooks, and more.
              </p>
            </div>
            {/* Visual */}
            <div className="absolute bottom-4 right-4 flex -space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-green-600">
                <Table size={14} />
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-purple-600">
                <Hash size={14} />
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-600">
                <MessageSquare size={14} />
              </div>
            </div>
          </div>

          {/* Security - Spans 2 cols */}
          <div className="md:col-span-2 bg-white rounded-4xl border border-gray-200 p-8 overflow-hidden relative group hover:border-accent/20 transition-colors">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Spam Protection & Security
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-md">
                Built-in spam filtering keeps your inbox clean. Secure your
                forms with rolling API keys and allowed domains.
              </p>
            </div>

            {/* Visual */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3 shadow-sm rotate-3 group-hover:rotate-0 transition-transform duration-300">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="text-xs text-green-800 font-medium">
                    Spam Check Passed
                  </div>
                  <div className="text-[10px] text-green-600">
                    Score: 98/100
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
