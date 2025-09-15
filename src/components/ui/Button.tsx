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
      "inline-flex items-center justify-center md:gap-2 gap-1 rounded-lg font-medium transition-transform transform-gpu focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none";

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
      sm: "md:h-8 h-7 px-3 text-sm",
      md: "md:h-10 h-9 px-4 md:text-sm text-xs",
      lg: "md:h-12 h-11 px-6 md:text-base text-sm",
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
          <div className="flex justify-center items-center py-8 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin " />
          </div>
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
