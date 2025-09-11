export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
  className = "",
}: ToggleProps) {
  const sizeClasses = {
    sm: { 
      container: "h-5 w-9",
      thumb: "h-3 w-3",
      translate: "translate-x-4"
    },
    md: { 
      container: "h-6 w-11",
      thumb: "h-4 w-4",
      translate: "translate-x-5"
    },
    lg: { 
      container: "h-7 w-13",
      thumb: "h-5 w-5",
      translate: "translate-x-6"
    },
  };

  const { container, thumb, translate } = sizeClasses[size];

  return (
    <label className={`flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {label && <span className="mr-3 text-sm font-medium">{label}</span>}
      
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      
      <span
        className={`
          relative inline-flex ${container} items-center rounded-full transition-colors
          ${checked 
            ? "bg-primary" 
            : "bg-muted-foreground"
          }
          ${disabled ? "" : "hover:bg-opacity-80"}
        `}
      >
        <span
          className={`
            ${thumb} inline-block transform rounded-full bg-background transition-transform
            ${checked ? translate : "translate-x-1"}
          `}
        />
      </span>
    </label>
  );
}
