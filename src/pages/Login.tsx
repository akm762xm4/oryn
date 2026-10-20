import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sun,
  ArrowRight,
  MessageCircle,
  Zap,
  Shield,
  User,
  CheckCircle2,
} from "lucide-react";
import { Button, Input } from "../components/ui";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";

/* ── types ── */
interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}
interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/* ── password strength dots ── */
function PasswordStrength({ password }: { password?: string }) {
  if (!password) return null;
  const checks = [
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  return (
    <div className="flex gap-3 mt-1.5">
      {checks.map(({ label, ok }) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-primary" : "bg-border"}`}
          />
          <span
            className={`text-[10px] ${ok ? "text-primary" : "text-muted-foreground"}`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── decorative background ── */
function AuthBg() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="auth-grid-dots" />
      <div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.12]"
        style={{ background: "hsl(43 89% 53%)" }}
      />
      <div
        className="absolute top-1/2 -left-32 w-72 h-72 rounded-full blur-3xl opacity-[0.07]"
        style={{ background: "hsl(260 70% 55%)" }}
      />
      <div
        className="absolute -bottom-32 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.07]"
        style={{ background: "hsl(43 89% 53%)" }}
      />
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  /* ── login form ── */
  const {
    register: regLogin,
    handleSubmit: submitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginForm>();

  /* ── register form ── */
  const {
    register: regReg,
    handleSubmit: submitReg,
    watch,
    formState: { errors: regErrors },
  } = useForm<RegisterForm>();
  const password = watch("password");

  /* ── handlers ── */
  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      login(res.data.token, res.data.user, data.remember ?? true);
      toast.success("Welcome back! 👋");
      navigate("/chat");
    } catch (error) {
      const msg =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Login failed"
          : "Login failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      toast.success(
        "Account created! Check your email for the verification code.",
      );
      navigate("/verify-otp", {
        state: { userId: res.data.userId, email: data.email },
      });
    } catch (error) {
      const msg =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Registration failed"
          : "Registration failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setIsDemoLoading(true);
    try {
      const res = await api.post("/auth/demo-login");
      login(res.data.token, res.data.user, false);
      toast.success("Welcome! Exploring as demo visitor 👀", {
        duration: 5000,
      });
      navigate("/chat");
    } catch {
      toast.error("Demo login failed. Please try again.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="auth-background flex justify-center min-h-screen">
      <AuthBg />

      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-14 xl:px-20 relative z-10">
        <div className="max-w-sm">
          {/* Wordmark */}
          <div className="mb-8">
            <img src="/oryn-wordmark.svg" alt="Oryn" className="h-14 w-auto" />
          </div>

          <h1 className="text-4xl xl:text-[2.75rem] font-bold text-foreground leading-[1.15] mb-4">
            Chat smarter,
            <br />
            <span className="text-gradient">connect better.</span>
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed mb-8">
            Real-time messaging with AI superpowers. Oryn brings people and
            intelligence together.
          </p>

          <div className="space-y-3.5">
            {[
              {
                icon: MessageCircle,
                text: "Real-time conversations with friends",
              },
              { icon: Zap, text: "AI Assistant always at your fingertips" },
              {
                icon: Shield,
                text: "Secure, private and end-to-end encrypted",
              },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col justify-center items-center flex-1 p-5 relative z-10 w-full">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg border border-border bg-card/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <img src="/oryn-wordmark.svg" alt="Oryn" className="h-10 w-auto" />
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-border">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    "flex-1 py-3.5 text-sm font-medium transition-colors capitalize",
                    tab === t
                      ? "text-foreground border-b-2 border-primary -mb-px"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {t === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Demo banner */}
              <button
                type="button"
                onClick={handleDemo}
                disabled={isDemoLoading}
                className="w-full mb-5 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">
                      Try Demo Account
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      No signup · explore everything
                    </p>
                  </div>
                </div>
                {isDemoLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {tab === "login"
                    ? "or sign in with email"
                    : "or create with email"}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* ── LOGIN form ── */}
              {tab === "login" && (
                <form
                  onSubmit={submitLogin(handleLogin)}
                  className="space-y-3.5"
                >
                  <Input
                    label="Email"
                    type="email"
                    {...regLogin("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email",
                      },
                    })}
                    leftIcon={<Mail className="w-4 h-4" />}
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={loginErrors.email?.message}
                  />

                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    {...regLogin("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "At least 6 characters" },
                    })}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={loginErrors.password?.message}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />

                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        defaultChecked
                        {...regLogin("remember")}
                      />
                      <span className="text-sm text-muted-foreground">
                        Remember me
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:opacity-80 font-medium transition-opacity"
                    >
                      Forgot?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    Sign In
                  </Button>
                </form>
              )}

              {/* ── REGISTER form ── */}
              {tab === "register" && (
                <form
                  onSubmit={submitReg(handleRegister)}
                  className="space-y-3"
                >
                  <Input
                    label="Username"
                    type="text"
                    {...regReg("username", {
                      required: "Username is required",
                      minLength: { value: 3, message: "At least 3 characters" },
                      maxLength: { value: 20, message: "Max 20 characters" },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: "Letters, numbers and _ only",
                      },
                    })}
                    leftIcon={<User className="w-4 h-4" />}
                    placeholder="your_username"
                    autoComplete="username"
                    error={regErrors.username?.message}
                  />

                  <Input
                    label="Email"
                    type="email"
                    {...regReg("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email",
                      },
                    })}
                    leftIcon={<Mail className="w-4 h-4" />}
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={regErrors.email?.message}
                  />

                  <div>
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      {...regReg("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "At least 6 characters",
                        },
                      })}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      error={regErrors.password?.message}
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                    />
                    <PasswordStrength password={password} />
                  </div>

                  <Input
                    label="Confirm Password"
                    type={showConfirm ? "text" : "password"}
                    {...regReg("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (v) =>
                        v === password || "Passwords do not match",
                    })}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    error={regErrors.confirmPassword?.message}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />

                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    By signing up you agree to use Oryn responsibly.
                  </p>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    Create Account
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[11px] text-muted-foreground opacity-60">
              Demo: <span className="font-mono">demo@oryn.app</span> ·{" "}
              <span className="font-mono">Demo@2024!</span>
            </p>
            <Link
              to="/showcase"
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
            >
              About Oryn →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
