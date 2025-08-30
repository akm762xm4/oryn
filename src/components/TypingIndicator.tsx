interface TypingIndicatorProps {
  users: string[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex items-center space-x-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>

      <div className="bg-muted px-4 py-2 rounded-2xl">
        <p className="text-sm text-muted-foreground italic">
          {getTypingText()}...
        </p>
      </div>
    </div>
  );
}
