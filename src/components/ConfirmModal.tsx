import { X } from "lucide-react";
import Button from "./ui/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-1 rounded-lg"
            title="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {description && (
            <p className="text-muted-foreground mb-6">{description}</p>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="md"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              variant="destructive"
              size="md"
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
