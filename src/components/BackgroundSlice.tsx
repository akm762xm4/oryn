import { motion } from "framer-motion";

interface BackgroundSliceProps {
  background: {
    id: string;
    name: string;
    preview: string;
    isImage: boolean;
    isTheme?: boolean;
  };
  selected: boolean;
  onClick: () => void;
  startAngle: number;
  endAngle: number;
  radius: number;
  strokeWidth: number;
}

export default function BackgroundSlice({
  background,
  selected,
  onClick,
  startAngle,
  endAngle,
  radius,
  strokeWidth,
}: BackgroundSliceProps) {
  // Convert angles to radians
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  // Calculate inner radius for hollow donut (about 40% of outer radius)
  const innerRadius = radius * 0.4;

  // Calculate path for the hollow slice (donut segment)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  // Outer arc points
  const outerX1 = radius + radius * Math.cos(startAngleRad);
  const outerY1 = radius + radius * Math.sin(startAngleRad);
  const outerX2 = radius + radius * Math.cos(endAngleRad);
  const outerY2 = radius + radius * Math.sin(endAngleRad);

  // Inner arc points
  const innerX1 = radius + innerRadius * Math.cos(startAngleRad);
  const innerY1 = radius + innerRadius * Math.sin(startAngleRad);
  const innerX2 = radius + innerRadius * Math.cos(endAngleRad);
  const innerY2 = radius + innerRadius * Math.sin(endAngleRad);

  const pathData = [
    // Start at outer edge
    `M ${outerX1} ${outerY1}`,
    // Draw outer arc
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}`,
    // Line to inner arc
    `L ${innerX2} ${innerY2}`,
    // Draw inner arc (reverse direction)
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
    // Close the path
    "Z",
  ].join(" ");

  // Get the color for the slice based on background type
  const getSliceColor = () => {
    if (background.id === "default") {
      return "#f3f4f6"; // gray-100
    }
    if (background.isImage) {
      return "#8b5cf6"; // purple-500 for images
    }
    if (background.isTheme) {
      // Extract color from gradient for themes
      if (background.preview.includes("#ff9a9e")) return "#ff9a9e";
      if (background.preview.includes("#a1c4fd")) return "#a1c4fd";
      if (background.preview.includes("#2e3192")) return "#2e3192";
      if (background.preview.includes("#fbc2eb")) return "#fbc2eb";
      if (background.preview.includes("#0f172a")) return "#0f172a";
      return "#8b5cf6";
    }
    return "#3b82f6"; // blue-500 default
  };

  const sliceColor = getSliceColor();

  return (
    <motion.g
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.path
        d={pathData}
        fill={sliceColor}
        stroke={selected ? "#ffffff" : "transparent"}
        strokeWidth={selected ? 3 : 0}
        strokeLinejoin="round"
        className="cursor-pointer transition-all duration-200"
        onClick={onClick}
        whileHover={{
          filter: "brightness(1.1) drop-shadow(0 0 8px rgba(255,255,255,0.3))",
        }}
        animate={{
          scale: selected ? 1.02 : 1,
          filter: selected
            ? "brightness(1.1) drop-shadow(0 0 6px rgba(255,255,255,0.3))"
            : "brightness(1)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </motion.g>
  );
}
