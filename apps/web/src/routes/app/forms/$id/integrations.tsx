import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { GoogleSheetsSection } from "@/components/integrations/google-sheets-section";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";

export const Route = createFileRoute("/app/forms/$id/integrations")({
  head: () => ({
    meta: [{ title: "Integrations | FormDrop" }],
  }),
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      success: (search.success as string) || undefined,
      error: (search.error as string) || undefined,
    };
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { success, error } = Route.useSearch();
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [, setShowErrorModal] = useState(false);

  const { data: form, isLoading } = useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      const response = await appClient.forms.get(id);
      if ("error" in response) throw new Error(response.error);
      return response.form;
    },
  });

  useEffect(() => {
    if (success === "google_sheets_connected") {
      setShowSuccessModal(true);
    } else if (error) {
      setShowErrorModal(true);
    }
  }, [success, error]);

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    navigate({
      to: "/app/forms/$id/integrations",
      params: { id },
      search: { success: undefined, error: undefined },
      replace: true,
    });
  };

  const getModalContent = () => {
    if (success === "google_sheets_connected") {
      return {
        title: "Google Sheets Connected!",
        description:
          "A new spreadsheet has been created and connected. All form submissions will now be automatically synced!",
        icon: (
          <img
            src="/google-sheet.svg"
            alt="Google Sheets"
            className="w-16 h-16"
          />
        ),
        bgColor: "bg-green-50",
        accentColor: "bg-green-600",
        hoverColor: "hover:bg-green-700",
      };
    }
    return null;
  };

  const modalContent = getModalContent();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-gray-200 rounded-3xl" />
          <div className="h-32 bg-gray-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSuccessModal && modalContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-24 h-24 ${modalContent.bgColor} rounded-3xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  {modalContent.icon}
                </div>

                <div
                  className={`w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-5 shadow-sm`}
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={24}
                    className="text-green-600"
                  />
                </div>

                <h3 className="text-3xl font-bold mb-3 bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {modalContent.title}
                </h3>

                <p className="text-gray-600 mb-8 text-base leading-relaxed">
                  {modalContent.description}
                </p>

                <Button
                  onClick={handleCloseModal}
                  variant="primary"
                  size="lg"
                  className={`${modalContent.accentColor} ${modalContent.hoverColor} text-white rounded-full w-full shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]`}
                >
                  Got it!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-x-3 py-2 mb-6">
          <Link
            to="/app/forms"
            className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <h2 className="text-lg font-semibold">Integrations</h2>
        </div>

        <div className="space-y-4">
          <GoogleSheetsSection
            formId={id}
            isConnected={form?.googleSheetsConnected ?? false}
            isEnabled={form?.googleSheetsEnabled}
            spreadsheetName={form?.googleSheetsSpreadsheetName}
            spreadsheetId={form?.googleSheetsSpreadsheetId}
          />

          {/* Airtable - Coming soon */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-yellow-50 rounded-2xl flex items-center justify-center">
                  <img
                    src="/airtable.svg"
                    alt="Airtable"
                    className="w-10 h-10"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Airtable</h3>
                  <p className="text-gray-600 text-sm">
                    Send form submissions to your Airtable base
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-100 text-gray-500 text-sm font-medium rounded-3xl">
                Coming Soon
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-3xl p-6">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold mb-1">Need another integration?</h4>
              <p className="text-gray-700 text-sm">
                Let us know which services you'd like to connect and we'll
                prioritize them in our roadmap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
