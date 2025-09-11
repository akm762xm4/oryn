import { Modal, Toggle, Button } from "./ui";
import { usePreferencesStore } from "../stores/preferencesStore";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesModal({
  isOpen,
  onClose,
}: PreferencesModalProps) {
  const {
    soundEnabled,
    vibrationEnabled,
    setSoundEnabled,
    setVibrationEnabled,
  } = usePreferencesStore();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sound & Vibration"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Sound effects</span>
          <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Vibration / Haptics</span>
          <Toggle checked={vibrationEnabled} onChange={setVibrationEnabled} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
