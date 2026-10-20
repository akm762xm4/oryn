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
  const sizes = { sm: "w-8 h-8", md: "w-9 h-9", lg: "w-11 h-11", xl: "w-14 h-14" };
  const iconSizes = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5", xl: "w-6 h-6" };
  const textSizes = { sm: "text-[10px]", md: "text-xs", lg: "text-sm", xl: "text-base" };
  const dotSizes = { sm: "w-2 h-2", md: "w-2.5 h-2.5", lg: "w-3 h-3", xl: "w-3.5 h-3.5" };

  const getInitials = (n: string) =>
    n.split(" ").map((w) => w.charAt(0)).join("").toUpperCase().slice(0, 2);

  return (
    <div
      className={`relative flex-shrink-0 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div
        className={[
          sizes[size],
          "rounded-full flex items-center justify-center overflow-hidden select-none",
          isAI
            ? "bg-gradient-to-br from-violet-500 to-primary"
            : src
            ? ""
            : "bg-primary/80",
          className,
        ].join(" ")}
      >
        {isAI ? (
          <Bot className={`${iconSizes[size]} text-white`} />
        ) : src ? (
          <img src={src} alt={alt || name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className={`text-white font-semibold ${textSizes[size]}`}>
            {name ? getInitials(name) : <User className={iconSizes[size]} />}
          </span>
        )}
      </div>

      {isOnline && !isAI && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotSizes[size]} bg-green-500 border-2 border-background rounded-full`}
        />
      )}
    </div>
  );
}
