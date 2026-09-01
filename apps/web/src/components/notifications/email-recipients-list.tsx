import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, Add01Icon, Alert01Icon } from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "motion/react";
import { RecipientActions } from "./recipient-actions";
import { useNotificationsStore } from "@/stores/notifications-store";
import {
  useAddRecipient,
  useRemoveRecipient,
  useUpdateRecipient,
  useResendVerification,
} from "@/hooks/use-recipient-mutations";

import { Button } from "@/components/button";

interface Recipient {
  id: string;
  email: string;
  enabled: boolean;
  verifiedAt: Date | null;
  verificationTokenExpiresAt: Date | null;
}

interface EmailRecipientsListProps {
  formId: string;
  ownerEmail?: string;
  recipients: Recipient[];
}

export function EmailRecipientsList({
  formId,
  ownerEmail,
  recipients,
}: EmailRecipientsListProps) {
  const {
    newRecipientEmail,
    deletingRecipientId,
    setNewRecipientEmail,
    setDeletingRecipientId,
  } = useNotificationsStore();

  const addRecipientMutation = useAddRecipient(formId);
  const removeRecipientMutation = useRemoveRecipient(formId);
  const updateRecipientMutation = useUpdateRecipient(formId);
  const resendVerificationMutation = useResendVerification(formId);

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecipientEmail) {
      addRecipientMutation.mutate(newRecipientEmail);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">Recipients</h3>
        <p className="text-sm text-gray-500 mt-1">
          Who should receive email notifications?
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Owner - Always first */}
        <div className="p-4 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <HugeiconsIcon icon={Mail01Icon} size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {ownerEmail}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  Owner
                </span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 italic px-3">
            Always enabled
          </div>
        </div>

        {/* Other Recipients */}
        {recipients.map((recipient) => (
          <RecipientActions
            key={recipient.id}
            recipient={recipient}
            isDeleting={deletingRecipientId === recipient.id}
            onConfirmDelete={() => removeRecipientMutation.mutate(recipient.id)}
            onCancelDelete={() => setDeletingRecipientId(null)}
            onToggle={() =>
              updateRecipientMutation.mutate({
                recipientId: recipient.id,
                enabled: !recipient.enabled,
              })
            }
            onStartDelete={() => setDeletingRecipientId(recipient.id)}
            onResendVerification={() =>
              resendVerificationMutation.mutate(recipient.id)
            }
            isResending={resendVerificationMutation.variables === recipient.id}
            isDeletingRecipient={removeRecipientMutation.isPending}
          />
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <form onSubmit={handleAddRecipient} className="flex items-start gap-3">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Enter email address"
              value={newRecipientEmail}
              onChange={(e) => {
                setNewRecipientEmail(e.target.value);
                if (addRecipientMutation.isError) {
                  addRecipientMutation.reset();
                }
              }}
              className={`w-full px-3 py-3 text-sm border rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                addRecipientMutation.isError
                  ? "border-red-300 bg-red-50 text-red-900 placeholder:text-red-300"
                  : "border-gray-200"
              }`}
              required
            />
            <AnimatePresence mode="wait">
              {addRecipientMutation.isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                    <HugeiconsIcon icon={Alert01Icon} size={16} />
                    <p>{addRecipientMutation.error.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            type="submit"
            disabled={addRecipientMutation.isPending}
            variant="secondary"
            size="md"
            className="rounded-3xl"
            icon={<HugeiconsIcon icon={Add01Icon} size={16} />}
            requiresPro={recipients.length >= 2}
          >
            Add Recipient
          </Button>
        </form>
      </div>
    </div>
  );
}
