import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye, EyeOff, Moon, Sun, User, Lock, Mail, CheckCircle2,
} from "lucide-react";
import { Button, Input } from "../components/ui";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useThemeStore } from "../stores/themeStore";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function PasswordStrength({ password }: { password?: string }) {
  if (!password) return null;
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  return (
    <div className="flex gap-2 mt-1">
      {checks.map(({ label, ok }) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${ok ? "bg-primary" : "bg-border"}`}
          />
          <span className={`text-[10px] ${ok ? "text-primary" : "text-muted-foreground"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      toast.success("Account created! Check your email for the verification code.");
      navigate("/verify-otp", {
        state: { userId: response.data.userId, email: data.email },
      });
    } catch (error) {
      const msg =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.message || "Registration failed"
          : "Registration failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background flex min-h-screen">
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="auth-grid-dots" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: "hsl(24 95% 53%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: "hsl(220 70% 55%)" }} />
      </div>

      <div className="flex flex-col justify-center items-center flex-1 p-6 relative z-10">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/oryn-icon.svg" alt="Oryn" className="h-9 w-auto" />
            <span className="text-xl font-bold text-foreground">Oryn</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-7 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Create account</h2>
              <p className="text-sm text-muted-foreground mt-1">Join Oryn and start chatting</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Username"
                type="text"
                {...register("username", {
                  required: "Username is required",
                  minLength: { value: 3, message: "At least 3 characters" },
                  maxLength: { value: 20, message: "Max 20 characters" },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: "Letters, numbers and underscores only",
                  },
                })}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="your_username"
                autoComplete="username"
                error={errors.username?.message}
              />

              <Input
                label="Email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                leftIcon={<Mail className="w-4 h-4" />}
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" },
                  })}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <PasswordStrength password={password} />
              </div>

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (v) => v === password || "Passwords do not match",
                })}
                placeholder="Repeat your password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Terms hint */}
              <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                By signing up you agree to use Oryn responsibly.
              </p>

              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link to="/showcase" className="hover:text-primary transition-colors underline underline-offset-2">
              About Oryn →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
