import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      containerClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    const baseInputClasses =
      "w-full bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors";
    const paddingClasses =
      leftIcon && rightIcon
        ? "px-12 py-3"
        : leftIcon || rightIcon
        ? "pl-12 pr-4 py-3"
        : "px-4 py-3";

    return (
      <div className={containerClassName}>
        {label && (
          <label className="block md:text-sm text-xs font-medium text-foreground mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`${baseInputClasses} ${paddingClasses} ${
              error ? "border-destructive" : ""
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-destructive text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
export type { InputProps };
