import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { Button, Input } from "../components/ui";
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

        {/* Navigation */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/register")}
            className="p-2 bg-muted hover:bg-muted/80"
            aria-label="Go back to register"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 bg-muted hover:bg-muted/80"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 sm:space-y-6"
        >
          <Input
            label="Verification Code"
            type="text"
            {...register("otp", {
              required: "Verification code is required",
              pattern: {
                value: /^\d{6}$/,
                message: "Please enter a valid 6-digit code",
              },
            })}
            placeholder="000000"
            maxLength={6}
            error={errors.otp?.message}
            className="text-center text-xl sm:text-lg tracking-widest py-4 sm:py-3"
            containerClassName="input-numeric"
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-3.5 sm:py-3 text-base sm:text-sm"
          >
            Verify Email
          </Button>
        </form>

        {/* Resend OTP */}
        <div className="text-center mt-5 sm:mt-6">
          <p className="text-sm sm:text-base text-muted-foreground mb-2">
            Didn't receive the code?
          </p>
          <Button
            variant="ghost"
            onClick={handleResendOTP}
            disabled={countdown > 0 || isResending}
            isLoading={isResending}
            className="text-primary hover:underline font-medium text-sm sm:text-base p-0 h-auto"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
          </Button>
        </div>
      </div>
    </div>
  );
}
