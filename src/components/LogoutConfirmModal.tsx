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
      <div className="md:space-y-6 space-y-5">
        <p className="md:text-base text-sm text-muted-foreground">
          Are you sure you want to logout? You will be redirected to the login
          page.
        </p>

        <div className="flex md:space-x-3 space-x-2.5">
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
