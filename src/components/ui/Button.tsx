import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      children,
      isLoading = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-xl " +
      "transition-all duration-150 transform-gpu select-none touch-manipulation " +
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 " +
      "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
      ghost:
        "bg-transparent text-foreground hover:bg-muted/60",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      outline:
        "bg-transparent border border-border text-foreground hover:bg-muted/50 hover:border-primary/40",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm:   "h-8 px-3 text-xs",
      md:   "h-9 px-4 text-sm",
      lg:   "h-11 px-5 text-sm",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
export type { ButtonProps };
