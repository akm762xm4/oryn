import { User, Bot } from "lucide-react";

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isAI?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Avatar({
  src,
  alt,
  name = "",
  size = "md",
  isAI = false,
  isOnline = false,
  className = "",
  onClick,
}: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <div className={`relative flex-shrink-0 ${onClick ? "cursor-pointer" : ""}`} onClick={handleClick}>
      <div
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden
          ${isAI 
            ? "bg-gradient-to-br from-purple-500 to-blue-600" 
            : src 
            ? "bg-cover bg-center" 
            : "bg-primary"
          }
          ${className}
        `}
      >
        {isAI ? (
          <Bot className={`${iconSizeClasses[size]} text-white`} />
        ) : src ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className={`text-white font-medium ${textSizeClasses[size]}`}>
            {name ? getInitials(name) : <User className={iconSizeClasses[size]} />}
          </span>
        )}
      </div>

      {/* Online indicator */}
      {isOnline && !isAI && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-background rounded-full"></div>
      )}
    </div>
  );
}
