import { Check } from "lucide-react";
import { Modal, Button } from "./ui";
import {
  useBackgroundStore,
  backgroundOptions,
} from "../stores/backgroundStore";

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackgroundModal({
  isOpen,
  onClose,
}: BackgroundModalProps) {
  const { selectedBackground, setBackground } = useBackgroundStore();

  const handleBackgroundSelect = (backgroundId: string) => {
    setBackground(backgroundId);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Chat Backgrounds" 
      size="xl"
      className="max-h-[85vh] overflow-hidden"
    >
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Choose a background for your chat conversations
        </p>

        <div className="grid grid-cols-2 gap-3">
          {backgroundOptions.map((background) => (
            <Button
              key={background.id}
              variant="ghost"
              onClick={() => handleBackgroundSelect(background.id)}
              className={`relative h-auto p-4 rounded-lg border-2 transition-colors hover:scale-[1.02] ${
                selectedBackground === background.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
                <div className="flex sm:flex-row flex-col items-start space-x-3">
                  {/* Background Preview */}
                  <div
                    className="w-12 h-12 rounded-lg border border-border overflow-hidden"
                    style={{
                      background: background.isImage
                        ? `${background.preview} center/cover no-repeat`
                        : background.preview,
                    }}
                  >
                    {background.id === "default" && (
                      <div className="w-full h-full bg-background border border-border/50" />
                    )}
                  </div>

                  {/* Background Info */}
                  <div className="text-left">
                    <h3 className="font-medium text-foreground">
                      {background.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {background.id === "default"
                        ? "System default background"
                        : background.isImage
                        ? "Custom image background"
                        : (background as any).isTheme
                        ? "Theme with gradient + custom bubbles"
                        : "Beautiful gradient background"}
                    </p>
                  </div>
                </div>

                {/* Selected Indicator */}
                {selectedBackground === background.id && (
                  <div className="absolute flex-shrink-0  top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
            </Button>
          ))}
          </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Background changes will apply to all conversations
          </p>
        </div>
      </div>
    </Modal>
  );
}
