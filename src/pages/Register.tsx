import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Moon, Sun, User, Lock, Mail } from "lucide-react";
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

      toast.success(
        "Registration successful! Please check your email for verification code."
      );
      navigate("/verify-otp", {
        state: {
          userId: response.data.userId,
          email: data.email,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Registration failed"
          : "Registration failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background flex items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md bg-background/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 mx-auto relative">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-4">
          <div className="flex items-center justify-center mb-4">
            <img src="/Oryn Full.png" alt="Oryn Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Join Oryn
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Create your account today
          </p>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 bg-muted hover:bg-muted/80"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6"
        >
          <Input
            label="Username"
            type="text"
            {...register("username", {
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
              maxLength: {
                value: 20,
                message: "Username must be less than 20 characters",
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message:
                  "Username can only contain letters, numbers, and underscores",
              },
            })}
            leftIcon={<User className="w-4 h-4 " />}
            placeholder="Choose a username"
            autoComplete="username"
            error={errors.username?.message}
            className="py-3.5 sm:py-3 text-base sm:text-sm"
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
            leftIcon={<Mail className="w-4 h-4 " />}
            placeholder="Enter your email"
            autoComplete="email"
            error={errors.email?.message}
            className="py-3.5 sm:py-3 text-base sm:text-sm"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
            placeholder="Create a password"
            autoComplete="new-password"
            error={errors.password?.message}
            leftIcon={<Lock className="w-4 h-4 " />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
            className="py-3.5 sm:py-3 text-base sm:text-sm"
          />

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            leftIcon={<Lock className="w-4 h-4 " />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
            className="py-3.5 sm:py-3 text-base sm:text-sm"
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-3.5 sm:py-3 text-base sm:text-sm"
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-5 sm:mt-6">
          <p className="text-sm sm:text-base text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium touch-manipulation"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
