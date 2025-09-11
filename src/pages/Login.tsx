import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock, Mail, Moon, Sun } from "lucide-react";
import { Button, Input } from "../components/ui";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";

interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);

      const { token, user } = response.data;

      const remember = data.remember ?? true;
      login(token, user, remember);
      toast.success("Login successful!");
      navigate("/chat");
    } catch (error) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Login failed"
          : "Login failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background flex items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md bg-background/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 mx-auto relative">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-6">
          <div className="flex items-center justify-center mb-4">
            <img src="/Oryn Full.png" alt="Oryn Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Welcome Back to Oryn
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Sign in to your account
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
          className="space-y-5 sm:space-y-6"
        >
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
            placeholder="Enter your password"
            autoComplete="current-password"
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

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              defaultChecked
              {...register("remember")}
            />
            <span>Remember me</span>
          </label>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-3.5 sm:py-3 text-base sm:text-sm"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-5 sm:mt-6">
          <p className="text-sm sm:text-base text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium touch-manipulation"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
