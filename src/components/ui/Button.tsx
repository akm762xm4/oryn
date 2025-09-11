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
    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-transform transform-gpu focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none";

    const variantClasses: Record<
      NonNullable<ButtonProps["variant"]>,
      string
    > = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/90 border border-transparent",
      ghost: "bg-transparent hover:bg-muted/60 text-foreground",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/95",
      outline:
        "bg-transparent border border-border text-foreground hover:bg-muted/50",
    } as const;

    const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-8 w-8 p-0",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
            <span className="sr-only">Loading</span>
            <span className="ml-2">Loading...</span>
          </>
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
