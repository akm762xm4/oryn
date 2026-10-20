import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock, Moon, Sun, KeyRound } from "lucide-react";
import { Button, Input } from "../components/ui";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useThemeStore } from "../stores/themeStore";

interface ResetForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { isDark, toggleTheme } = useThemeStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>();
  const password = watch("password");

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      toast.success("Password reset! Please sign in.");
      navigate("/login");
    } catch (error) {
      const msg = error instanceof Error && "response" in error
        ? (error as any).response?.data?.message || "Reset failed"
        : "Reset failed";
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
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Set new password</h2>
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
              })}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              placeholder="New password"
              error={errors.password?.message}
            />
            <Input
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Please confirm",
                validate: (v) => v === password || "Passwords don't match",
              })}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              placeholder="Confirm password"
              error={errors.confirmPassword?.message}
            />
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
