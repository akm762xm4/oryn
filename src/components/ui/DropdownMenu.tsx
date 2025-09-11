import { type ReactNode, useEffect, useRef, useState } from "react";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownMenuSeparatorProps {
  children?: ReactNode;
}

export function DropdownMenu({
  trigger,
  children,
  align = "right",
  className = "",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClasses = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`
          absolute ${alignmentClasses[align]} top-full mt-2 w-64 
          bg-background border border-border rounded-lg shadow-lg z-50
          ${className}
        `}
        >
          <div className="py-2">{children}</div>
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  icon,
  destructive = false,
  disabled = false,
}: DropdownMenuItemProps) {
  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors 
        flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed
        ${destructive ? "text-destructive" : ""}
      `}
    >
      {icon && (
        <span className="w-4 h-4 inline-flex items-center justify-center">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
}

export function DropdownMenuSeparator({
  children,
}: DropdownMenuSeparatorProps) {
  if (children) {
    return (
      <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
        {children}
      </div>
    );
  }

  return <div className="border-t border-border my-1" />;
}
