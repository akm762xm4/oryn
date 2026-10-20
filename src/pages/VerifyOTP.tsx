import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Moon, Sun, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button, Input } from "../components/ui";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";

interface OTPForm { otp: string; }

export default function VerifyOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const { userId, email } = location.state || {};

  const { register, handleSubmit, formState: { errors } } = useForm<OTPForm>();

  useEffect(() => {
    if (!userId || !email) { navigate("/register"); return; }
    setCountdown(60);
    const t = setInterval(() => setCountdown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [userId, email, navigate]);

  const onSubmit = async (data: OTPForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", { userId, otp: data.otp });
      const { token, user } = response.data;
      login(token, user);
      toast.success("Email verified! Welcome to Oryn 🎉");
      navigate("/chat");
    } catch (error) {
      const msg = error instanceof Error && "response" in error
        ? (error as any).response?.data?.message || "Verification failed"
        : "Verification failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    try {
      await api.post("/auth/resend-otp", { userId });
      toast.success("Code resent!");
      setCountdown(60);
      const t = setInterval(() => setCountdown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setIsResending(false);
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

        <div className="bg-card border border-border rounded-2xl p-7 shadow-2xl relative">
          {/* Controls */}
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => navigate("/register")}
            className="absolute top-4 left-4 w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center mb-6 mt-2">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a 6-digit code to{" "}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Verification Code"
              type="text"
              {...register("otp", {
                required: "Code is required",
                pattern: { value: /^\d{6}$/, message: "Enter the 6-digit code" },
              })}
              placeholder="000000"
              maxLength={6}
              error={errors.otp?.message}
              className="text-center text-xl tracking-[0.5em] font-mono"
            />
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Verify Email
            </Button>
          </form>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            Didn't get it?{" "}
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="text-primary hover:underline disabled:opacity-50 disabled:no-underline font-medium"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
