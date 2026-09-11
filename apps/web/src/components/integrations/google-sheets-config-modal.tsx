import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal } from "@formdrop/ui";

interface GoogleSheetsConfigModalProps {
  formId: string;
  currentSpreadsheetId?: string | null;
  onClose: () => void;
}

interface Spreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
}

export function GoogleSheetsConfigModal({
  formId,
  currentSpreadsheetId,
  onClose,
}: GoogleSheetsConfigModalProps) {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    currentSpreadsheetId || "",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchSpreadsheets();
  }, []);

  const fetchSpreadsheets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/integrations/google-sheets/spreadsheets?formId=${formId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch spreadsheets");
      }

      const data = await response.json();
      setSpreadsheets(data.spreadsheets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;

    const selectedSpreadsheet = spreadsheets.find((s) => s.id === selectedId);
    if (!selectedSpreadsheet) return;

    try {
      setIsSaving(true);
      const response = await fetch(
        "/api/integrations/google-sheets/configure",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId,
            spreadsheetId: selectedSpreadsheet.id,
            spreadsheetName: selectedSpreadsheet.name,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      await queryClient.invalidateQueries({ queryKey: ["form", formId] });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Rendered only while open, so the shell is always open once it exists.
    <Modal
      isOpen
      onClose={onClose}
      size="2xl"
      label="Select Google Spreadsheet"
      scrim="bg-black/50 backdrop-blur-sm"
      className="max-h-[80vh] overflow-y-auto"
    >
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-2">Select Google Spreadsheet</h2>
        <p className="text-gray-600 mb-6">
          Choose where your form submissions will be synced
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : spreadsheets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No spreadsheets found</p>
            <a
              href="https://sheets.google.com/create"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Create a new spreadsheet
            </a>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {spreadsheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => setSelectedId(sheet.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedId === sheet.id
                    ? "border-accent bg-accent/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">{sheet.name}</div>
                <div className="text-sm text-gray-500">
                  Modified {new Date(sheet.modifiedTime).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="flex-1 rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedId || isSaving}
            isLoading={isSaving}
            variant="primary"
            size="lg"
            className="flex-1 rounded-full"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
