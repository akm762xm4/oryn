import { useEffect, useState, memo } from "react";

interface TypingIndicatorProps {
  users: string[];
}

const TypingIndicator = memo(function TypingIndicator({
  users,
}: TypingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (users.length > 0) {
      setShouldRender(true);
      // Small delay to trigger enter animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Wait for exit animation to complete before unmounting
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [users.length]);

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing`;
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`typing-indicator-container flex items-center space-x-3 mb-2 transition-all duration-300 transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-3 scale-90"
      }`}
      style={{
        transformOrigin: "bottom left",
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div
        className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-all duration-300 transform ${
          isVisible ? "scale-100 rotate-0" : "scale-75 rotate-12"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          transitionDelay: isVisible ? "50ms" : "0ms",
        }}
      >
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>

      <div
        className={`typing-bubble bg-muted px-4 py-2 rounded-2xl transition-all duration-300 transform ${
          isVisible
            ? "opacity-100 translate-x-0 scale-100"
            : "opacity-0 translate-x-4 scale-90"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          transitionDelay: isVisible ? "150ms" : "0ms",
        }}
      >
        <p className="md:text-sm text-xs text-muted-foreground italic">
          {getTypingText()}...
        </p>
      </div>
    </div>
  );
});

export default TypingIndicator;
