import { Modal, Button } from "./ui";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Logout" size="sm">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Are you sure you want to logout? You will be redirected to the login page.
        </p>
        
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            Yes, Logout
          </Button>
        </div>
      </div>
    </Modal>
  );
}
