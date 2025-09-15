import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Modal } from "./ui";
import {
  useBackgroundStore,
  backgroundOptions,
} from "../stores/backgroundStore";
import BackgroundSlice from "./BackgroundSlice";

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackgroundModal({
  isOpen,
  onClose,
}: BackgroundModalProps) {
  const { selectedBackground, setBackground } = useBackgroundStore();
  const [selectedBackgroundData, setSelectedBackgroundData] = useState(
    backgroundOptions.find((bg) => bg.id === selectedBackground) ||
      backgroundOptions[0]
  );

  // Update selected background data when store changes
  useEffect(() => {
    const background = backgroundOptions.find(
      (bg) => bg.id === selectedBackground
    );
    if (background) {
      setSelectedBackgroundData(background);
    }
  }, [selectedBackground]);

  const handleSliceClick = (background: (typeof backgroundOptions)[0]) => {
    setSelectedBackgroundData(background);
    setBackground(background.id);
  };

  // Calculate responsive dimensions
  const getDimensions = () => {
    const isMobile = window.innerWidth < 768;
    return {
      radius: isMobile ? 100 : 140,
      strokeWidth: isMobile ? 6 : 8,
      centerSize: isMobile ? 60 : 80,
    };
  };

  const [dimensions, setDimensions] = useState(getDimensions());

  useEffect(() => {
    const handleResize = () => setDimensions(getDimensions());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { radius, strokeWidth } = dimensions;
  const centerRadius = radius - strokeWidth / 2;
  const sliceAngle = 360 / backgroundOptions.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chat Backgrounds"
      size="xl"
      className="max-h-[85vh] overflow-hidden"
    >
      <div className="md:space-y-6 space-y-4">
        <p className="md:text-sm text-xs text-muted-foreground ">
          Choose a background for your chat conversations
        </p>

        {/* Donut Chart */}
        <div className="flex justify-center">
          <div className="relative">
            <svg
              width={radius * 2}
              height={radius * 2}
              className="drop-shadow-lg"
            >
              {/* Background slices - now hollow donut */}
              {backgroundOptions.map((background, index) => {
                const startAngle = index * sliceAngle;
                const endAngle = (index + 1) * sliceAngle;
                const isSelected = selectedBackgroundData.id === background.id;

                return (
                  <BackgroundSlice
                    key={background.id}
                    background={background}
                    selected={isSelected}
                    onClick={() => handleSliceClick(background)}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    radius={centerRadius}
                    strokeWidth={strokeWidth}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Preview with animated background info */}
        <div className="space-y-3">
          {/* Animated background preview */}
          <motion.div
            key={selectedBackgroundData.id}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              duration: 0.3,
            }}
            className="space-y-3"
          >
            {/* Background preview */}
            <div
              className="md:h-16 h-12 rounded-lg border border-border overflow-hidden flex items-center justify-center"
              style={{
                background: selectedBackgroundData.isImage
                  ? `${selectedBackgroundData.preview} center/cover no-repeat`
                  : selectedBackgroundData.preview,
              }}
            ></div>

            {/* Background info with pop animation */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: 0.1,
              }}
              className="text-center space-y-1"
            >
              <h3 className="font-bold text-foreground text-base">
                {selectedBackgroundData.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedBackgroundData.id === "default"
                  ? "System default background"
                  : selectedBackgroundData.isImage
                  ? "Custom image background"
                  : (selectedBackgroundData as any).isTheme
                  ? "Theme with gradient + custom bubbles"
                  : "Beautiful gradient background"}
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="md:pt-4 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Background changes will apply to all conversations
          </p>
        </div>
      </div>
    </Modal>
  );
}
