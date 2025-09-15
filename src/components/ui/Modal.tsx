import { type ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import Button from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`bg-background rounded-2xl w-full ${sizeClasses[size]} border border-border shadow-2xl shadow-accent  ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between md:p-6 p-4 md:pb-4 pb-2 border-b border-border md:mb-3 mb-2">
            {title && (
              <h2 className="md:text-lg text-base font-semibold">{title}</h2>
            )}
            {showCloseButton && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="md:p-1 p-0.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close modal"
              >
                <X className="md:w-5 md:h-5 w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        <div
          className={
            title || showCloseButton ? "md:px-6 px-4 md:pb-6 pb-4" : "p-6"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
