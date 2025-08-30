import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";

interface OTPForm {
  otp: string;
}

export default function VerifyOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const { userId, email } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPForm>();

  useEffect(() => {
    if (!userId || !email) {
      navigate("/register");
      return;
    }

    // Start countdown
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userId, email, navigate]);

  const onSubmit = async (data: OTPForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", {
        userId,
        otp: data.otp,
      });

      const { token, user } = response.data;
      login(token, user);
      toast.success("Email verified successfully!");
      navigate("/chat");
    } catch (error) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Verification failed"
          : "Verification failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      await api.post("/auth/resend-otp", { userId });
      toast.success("OTP sent successfully!");
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to resend OTP"
          : "Failed to resend OTP";
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-background flex items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md bg-background/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary p-3 rounded-full">
              <span className="text-white font-bold text-2xl sm:text-3xl">
                O
              </span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Verify Your Email
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            We've sent a verification code to
          </p>
          <p className="text-sm sm:text-base text-foreground font-medium break-all">
            {email}
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="p-2.5 sm:p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors touch-manipulation"
            aria-label="Go back to register"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 sm:p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors touch-manipulation"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 sm:space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Verification Code
            </label>
            <input
              type="text"
              {...register("otp", {
                required: "Verification code is required",
                pattern: {
                  value: /^\d{6}$/,
                  message: "Please enter a valid 6-digit code",
                },
              })}
              className="w-full px-4 py-4 sm:py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center text-xl sm:text-lg tracking-widest"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            {errors.otp && (
              <p className="text-destructive text-sm mt-1">
                {errors.otp.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3.5 sm:py-3 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation text-base sm:text-sm"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="text-center mt-5 sm:mt-6">
          <p className="text-sm sm:text-base text-muted-foreground mb-2">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={countdown > 0 || isResending}
            className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
          >
            {isResending
              ? "Sending..."
              : countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
}
