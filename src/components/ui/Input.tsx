import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    const hasPadLeft = leftIcon ? "pl-10" : "pl-4";
    const hasPadRight = rightIcon ? "pr-10" : "pr-4";

    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            className={[
              "w-full h-10 bg-card text-foreground text-sm",
              "border rounded-xl transition-all duration-150",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-destructive focus:ring-destructive/20" : "border-border",
              hasPadLeft,
              hasPadRight,
              className,
            ].join(" ")}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-muted-foreground text-xs mt-1.5">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
export type { InputProps };
