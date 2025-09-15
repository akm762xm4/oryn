import { Modal, Toggle } from "./ui";
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
      size="sm"
    >
      <div className="md:space-y-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Sound effects</span>
          <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Vibration / Haptics</span>
          <Toggle checked={vibrationEnabled} onChange={setVibrationEnabled} />
        </div>
      </div>
    </Modal>
  );
}
