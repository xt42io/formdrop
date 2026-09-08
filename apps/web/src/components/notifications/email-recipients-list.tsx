import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Add01Icon,
  Alert01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "motion/react";
import { RecipientActions } from "./recipient-actions";
import { useNotificationsStore } from "@/stores/notifications-store";
import {
  useAddRecipient,
  useRemoveRecipient,
  useUpdateRecipient,
  useResendVerification,
} from "@/hooks/use-recipient-mutations";

import { Button, Modal } from "@formdrop/ui";
// Derived from the query that produces it. The local copy this replaces
// declared the two timestamps as Date, which they are not after JSON.
import type { Recipient } from "@/lib/app-client";

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
    <div className="bg-white rounded-3xl border border-ink-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-ink-100">
        <h3 className="text-sm font-medium text-ink-950">Recipients</h3>
        <p className="text-sm text-ink-500 mt-1">
          Who should receive email notifications?
        </p>
      </div>

      <div className="max-h-72 divide-y divide-ink-100 overflow-y-auto">
        {/* Owner - Always first */}
        <div className="p-4 flex items-center justify-between bg-ink-50/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-ink-100 flex items-center justify-center text-ink-500">
              <HugeiconsIcon icon={Mail01Icon} size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-950">
                  {ownerEmail}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-ink-100 text-xs font-medium text-ink-600">
                  Owner
                </span>
              </div>
            </div>
          </div>
          <div className="text-xs text-ink-400 italic px-3">Always enabled</div>
        </div>

        {/* Other Recipients */}
        {recipients.map((recipient) => (
          <RecipientActions
            key={recipient.id}
            recipient={recipient}
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
          />
        ))}
      </div>

      <div className="p-4 bg-ink-50 border-t border-ink-100">
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
              className={`w-full px-3 py-3 text-sm border rounded-3xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent ${
                addRecipientMutation.isError
                  ? "border-tint-rose bg-tint-rose text-tint-rose-ink placeholder:text-tint-rose-ink"
                  : "border-ink-200"
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
                  <div className="flex items-center gap-2 px-3 py-2 bg-tint-rose text-tint-rose-ink rounded-xl text-xs font-medium border border-tint-rose">
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

      {/* A dialog rather than the row swapping itself for a tick and a cross,
          which hid the address being deleted at the one moment it mattered. */}
      <Modal
        isOpen={deletingRecipientId !== null}
        onClose={() => setDeletingRecipientId(null)}
        label="Remove recipient?"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint-rose text-tint-rose-ink">
              <HugeiconsIcon icon={AlertCircleIcon} size={20} />
            </div>
            <h3 className="text-lg font-semibold text-ink-950">
              Remove recipient?
            </h3>
          </div>
          <p className="text-sm text-ink-600">
            <strong className="font-medium text-ink-950">
              {recipients.find((r) => r.id === deletingRecipientId)?.email}
            </strong>{" "}
            will stop receiving email for this form. You can add them again
            later, but they will have to verify the address a second time.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingRecipientId(null)}
              disabled={removeRecipientMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                deletingRecipientId &&
                removeRecipientMutation.mutate(deletingRecipientId)
              }
              disabled={removeRecipientMutation.isPending}
              isLoading={removeRecipientMutation.isPending}
            >
              {removeRecipientMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
