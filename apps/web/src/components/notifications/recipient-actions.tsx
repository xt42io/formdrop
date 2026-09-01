import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "motion/react";
import { RecipientItem } from "./recipient-item";

import { Button } from "@/components/button";

interface Recipient {
  id: string;
  email: string;
  enabled: boolean;
  verifiedAt: Date | null;
  verificationTokenExpiresAt: Date | null;
}

interface RecipientActionsProps {
  recipient: Recipient;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onToggle: () => void;
  onStartDelete: () => void;
  onResendVerification: () => void;
  isResending: boolean;
  isDeletingRecipient: boolean;
}

function getRecipientStatus(recipient: Recipient) {
  if (recipient.verifiedAt) {
    return "verified" as const;
  }
  if (
    recipient.verificationTokenExpiresAt &&
    new Date(recipient.verificationTokenExpiresAt) < new Date()
  ) {
    return "expired" as const;
  }
  return "pending" as const;
}

export function RecipientActions({
  recipient,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
  onToggle,
  onStartDelete,
  onResendVerification,
  isResending,
  isDeletingRecipient,
}: RecipientActionsProps) {
  const status = getRecipientStatus(recipient);

  if (isDeleting) {
    return (
      <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <HugeiconsIcon icon={Mail01Icon} size={16} />
          </div>
          <span className="text-sm font-medium text-gray-900">
            {recipient.email}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                Confirm Deletion?
              </span>
              <Button
                onClick={onConfirmDelete}
                disabled={isDeletingRecipient}
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 h-auto"
                icon={<HugeiconsIcon icon={Tick02Icon} size={16} />}
              />
              <Button
                onClick={onCancelDelete}
                disabled={isDeletingRecipient}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 h-auto"
                icon={<HugeiconsIcon icon={Cancel01Icon} size={16} />}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="actions"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
      >
        <RecipientItem
          id={recipient.id}
          email={recipient.email}
          enabled={recipient.enabled}
          status={{
            type: status,
            verifiedAt: recipient.verifiedAt,
            verificationTokenExpiresAt: recipient.verificationTokenExpiresAt,
          }}
          onToggle={onToggle}
          onDelete={onStartDelete}
          onResendVerification={onResendVerification}
          isToggleDisabled={!recipient.verifiedAt}
          isResending={isResending}
        />
      </motion.div>
    </AnimatePresence>
  );
}
