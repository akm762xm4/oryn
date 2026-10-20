import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Moon, Sun, ArrowLeft, KeyRound } from "lucide-react";
import { Button, Input } from "../components/ui";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useThemeStore } from "../stores/themeStore";

interface ForgotPasswordForm { email: string; }

export default function ForgotPassword() {
  const { isDark, toggleTheme } = useThemeStore();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();
  const [isLoading, setIsLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", data);
      setResetUrl(response.data.resetUrl || "");
      toast.success(response.data.message);
    } catch (error) {
      const msg = error instanceof Error && "response" in error
        ? (error as any).response?.data?.message || "Unable to request a reset link"
        : "Unable to request a reset link";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background flex items-center justify-center p-6 min-h-screen">
      <div className="absolute inset-0 auth-grid-dots pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/oryn-icon.svg" alt="Oryn" className="h-8 w-auto" />
          <span className="font-bold text-foreground">Oryn</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-7 shadow-2xl">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Forgot password?</h2>
              <p className="text-xs text-muted-foreground">We'll send you a reset link</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" },
              })}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
            />
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Send Reset Link
            </Button>
          </form>

          {resetUrl && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
              <p className="font-medium text-foreground mb-1.5">Dev reset link:</p>
              <a href={resetUrl} className="text-primary break-all hover:underline">{resetUrl}</a>
            </div>
          )}

          <Link
            to="/login"
            className="flex items-center gap-1.5 justify-center mt-5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
