import React from "react";
import { useIsPro } from "@/hooks/use-is-pro";
import { Tooltip } from "@/components/tooltip";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  icon?: React.ReactNode;
  requiresPro?: boolean;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  disabled,
  requiresPro,
  ...props
}: ButtonProps) {
  const { isPro } = useIsPro();
  const isDisabledByPro = requiresPro && !isPro;

  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary:
      "bg-accent text-white hover:bg-accent/90 focus:ring-accent border border-transparent shadow-sm",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
    outline:
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-500",
    ghost:
      "text-gray-600 hover:bg-gray-100 focus:ring-gray-500 bg-transparent border border-transparent",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-xl gap-1",
    md: "px-4 py-2 text-sm rounded-3xl gap-2",
    lg: "px-4 py-3 text-base rounded-4xl gap-3",
    xl: "px-4 py-4 text-base rounded-4xl gap-3",
  };

  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];

  const buttonContent = (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      disabled={isLoading || disabled || isDisabledByPro}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!isLoading && icon}
      {children}
    </button>
  );

  if (isDisabledByPro) {
    return (
      <Tooltip content="Upgrade to Pro to use this feature">
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
}
