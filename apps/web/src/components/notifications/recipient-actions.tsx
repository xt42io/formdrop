import { motion, AnimatePresence } from "motion/react";
import { RecipientItem } from "./recipient-item";

// The third copy of this type; derived from the query now, like the other two.
import type { Recipient } from "@/lib/app-client";

interface RecipientActionsProps {
  recipient: Recipient;
  onToggle: () => void;
  onStartDelete: () => void;
  onResendVerification: () => void;
  isResending: boolean;
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
  onToggle,
  onStartDelete,
  onResendVerification,
  isResending,
}: RecipientActionsProps) {
  const status = getRecipientStatus(recipient);

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
