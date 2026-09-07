import { Button } from "./button";
import { Modal } from "./modal";

/**
 * The destructive-confirmation dialog: revoke an API key, delete a form,
 * delete submissions. Four copies of this existed, differing in whether the
 * icon sat in a circle or a rounded square, whether the buttons sat on grey,
 * and how the pending label was spelled.
 *
 * `children` is where a caller adds anything extra the confirmation needs --
 * the form settings page puts its type-the-name-to-confirm field there and
 * drives `confirmDisabled` from it.
 */
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while the mutation is in flight. */
  pendingLabel?: string;
  isPending?: boolean;
  confirmDisabled?: boolean;
  confirmIcon?: React.ReactNode;
  children?: React.ReactNode;
  /** Forwarded to Modal so a caller keeps its original overlay. */
  scrim?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  confirmLabel,
  pendingLabel,
  isPending = false,
  confirmDisabled = false,
  confirmIcon,
  children,
  scrim,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} label={title} scrim={scrim}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="text-gray-600 text-sm">{description}</div>

        {children}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isPending || confirmDisabled}
            isLoading={isPending}
            icon={!isPending && confirmIcon}
          >
            {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
