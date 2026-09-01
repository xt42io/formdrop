import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface AuthErrorProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function AuthError({
  message,
  onDismiss,
  className = "",
}: AuthErrorProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 animate-in slide-in-from-top-2 duration-300 ${className}`}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">
        <AlertCircle className="w-5 h-5 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="shrink-0 text-red-600 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded-lg p-0.5"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
