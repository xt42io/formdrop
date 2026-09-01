import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkSquare02Icon,
  ArrowUpRight01Icon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import {
  useFormUpdate,
  useDisconnectGoogleSheets,
} from "@/hooks/use-form-mutations";
import { useIntegrationsStore } from "@/stores/integrations-store";
import { motion, AnimatePresence } from "motion/react";
import { useFlag } from "@flagswift/react-client";
import { Button } from "@/components/button";

interface GoogleSheetsSectionProps {
  formId: string;
  isConnected: boolean;
  isEnabled?: boolean;
  spreadsheetName?: string | null;
  spreadsheetId?: string | null;
}

export function GoogleSheetsSection({
  formId,
  isConnected,
  isEnabled,
  spreadsheetName,
  spreadsheetId,
}: GoogleSheetsSectionProps) {
  const updateFormMutation = useFormUpdate(formId);
  const disconnectMutation = useDisconnectGoogleSheets(formId);
  const { disconnectingIntegration, setDisconnectingIntegration } =
    useIntegrationsStore();

  const isDisconnecting = disconnectingIntegration === "google-sheets";

  const handleToggle = () => {
    updateFormMutation.mutate({
      googleSheetsEnabled: !isEnabled,
    });
  };

  const handleStartDisconnect = () => {
    setDisconnectingIntegration("google-sheets");
  };

  const handleConfirmDisconnect = () => {
    disconnectMutation.mutate();
    setDisconnectingIntegration(null);
  };

  const handleCancelDisconnect = () => {
    setDisconnectingIntegration(null);
  };

  const isGoogleSheetsIntegrationEnabled = useFlag("google-sheet-integration");

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center">
            <img
              src="/google-sheet.svg"
              alt="Google Sheets"
              className="w-10 h-10"
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Google Sheets</h3>
            <p className="text-gray-600 text-sm">
              {isConnected && spreadsheetName
                ? `Syncing to ${spreadsheetName}`
                : "Automatically sync form submissions to Google Sheets"}
            </p>
          </div>
        </div>

        {isGoogleSheetsIntegrationEnabled ? (
          <div className="flex items-center gap-3">
            {isConnected ? (
              <AnimatePresence mode="wait">
                {!isDisconnecting ? (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <button
                      onClick={handleToggle}
                      disabled={updateFormMutation.isPending}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                        isEnabled ? "bg-accent" : "bg-gray-200"
                      } ${updateFormMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>

                    {spreadsheetId && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
                        Open
                      </a>
                    )}

                    <Button
                      onClick={handleStartDisconnect}
                      disabled={disconnectMutation.isPending}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl"
                    >
                      Disconnect
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                      Confirm Disconnect?
                    </span>
                    <Button
                      onClick={handleConfirmDisconnect}
                      disabled={disconnectMutation.isPending}
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 h-auto"
                      icon={<HugeiconsIcon icon={Tick02Icon} size={16} />}
                    />
                    <Button
                      onClick={handleCancelDisconnect}
                      disabled={disconnectMutation.isPending}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 h-auto"
                      icon={<HugeiconsIcon icon={Cancel01Icon} size={16} />}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <Button
                onClick={() =>
                  (window.location.href = `/api/integrations/google-sheets/authorize?formId=${formId}`)
                }
                requiresPro
                className="rounded-3xl py-3"
                icon={<HugeiconsIcon icon={LinkSquare02Icon} size={16} />}
              >
                Connect
              </Button>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 bg-gray-100 text-gray-500 text-sm font-medium rounded-3xl">
            Coming Soon
          </div>
        )}
      </div>
    </div>
  );
}
