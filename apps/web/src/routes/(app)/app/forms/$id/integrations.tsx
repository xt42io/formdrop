import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { GoogleSheetsSection } from "@/components/integrations/google-sheets-section";
import { useEffect, useState } from "react";
import { Button, Icon, Modal } from "@formdrop/ui";

export const Route = createFileRoute("/(app)/app/forms/$id/integrations")({
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
        bgColor: "bg-tint-green",
        accentColor: "bg-tint-green-ink",
        hoverColor: "hover:opacity-90",
      };
    }
    return null;
  };

  const modalContent = getModalContent();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-ink-200 rounded-panel" />
          <div className="h-32 bg-ink-200 rounded-panel" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal
        isOpen={Boolean(showSuccessModal && modalContent)}
        onClose={handleCloseModal}
        label={modalContent?.title}
        scrim="bg-black/50 backdrop-blur-sm"
      >
        {/* The old shell rendered nothing until modalContent existed, which
            narrowed it for the whole body. The shell is always mounted now, so
            the guard moves inside. */}
        {modalContent && (
          <div className="p-10">
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-24 h-24 ${modalContent.bgColor} rounded-panel flex items-center justify-center mb-6`}
              >
                {modalContent.icon}
              </div>

              <div
                className={`w-12 h-12 bg-tint-green rounded-full flex items-center justify-center mb-5`}
              >
                <Icon
                  icon={Tick02Icon}
                  size={24}
                  className="text-tint-green-ink"
                />
              </div>

              <h3 className="text-3xl font-bold mb-3 text-ink-950">
                {modalContent.title}
              </h3>

              <p className="text-ink-600 mb-8 text-base leading-relaxed">
                {modalContent.description}
              </p>

              <Button
                onClick={handleCloseModal}
                variant="primary"
                size="lg"
                className={`${modalContent.accentColor} ${modalContent.hoverColor} text-white rounded-full w-full transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                Got it!
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
            Integrations
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Send every submission straight into the tools you already use.
          </p>
        </div>

        <div className="space-y-4">
          <GoogleSheetsSection
            formId={id}
            isConnected={form?.googleSheetsConnected ?? false}
            isEnabled={form?.googleSheetsEnabled}
            spreadsheetName={form?.googleSheetsSpreadsheetName}
            spreadsheetId={form?.googleSheetsSpreadsheetId}
          />

          {/* Airtable is not available yet, so the card reads as unavailable
              rather than looking identical to a connectable one and relying on
              a label to say otherwise. */}
          <div className="overflow-hidden rounded-panel border border-dashed border-ink-200 bg-white">
            <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-tint-amber opacity-60">
                  <img
                    src="/airtable.svg"
                    alt=""
                    className="h-10 w-10 grayscale"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-ink-700">
                    Airtable
                  </h3>
                  <p className="text-sm text-ink-500">
                    Send form submissions to your Airtable base
                  </p>
                </div>
              </div>

              <div className="w-fit shrink-0 rounded-full bg-ink-100 px-3.5 py-1.5 text-xs font-medium whitespace-nowrap text-ink-500">
                Coming Soon
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          Need something else? Tell us which service and we will prioritise it.
        </p>
      </div>
    </>
  );
}
