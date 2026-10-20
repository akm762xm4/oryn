import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Zap,
  Shield,
  Bot,
  Users,
  Image,
  Code2,
  Globe,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Moon,
  Sun,
  Github,
  Star,
  Layers,
  Activity,
  Download,
} from "lucide-react";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui";
import toast from "react-hot-toast";
import api from "../lib/api";

/* ── small reusable components ── */

function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg group ${
        accent
          ? "border-primary/30 bg-primary/5 hover:bg-primary/8"
          : "border-border bg-card hover:border-primary/20"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
          accent ? "gradient-primary" : "bg-secondary"
        }`}
      >
        <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-primary"}`} />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-gradient">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function TechBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-border bg-secondary text-secondary-foreground">
      {label}
    </span>
  );
}

/* ── Demo login modal ── */
function DemoLoginCard({
  onDemoLogin,
  isLoading,
}: {
  onDemoLogin: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-foreground">Try Demo Instantly</h3>
      </div>
      <div className="space-y-2 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          <span>No signup required</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          <span>Full access to all features</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          <span>Pre-loaded demo conversations</span>
        </div>
      </div>
      <div className="bg-secondary rounded-xl p-3 mb-4 font-mono text-xs">
        <p className="text-muted-foreground">
          Email: <span className="text-foreground">demo@oryn.app</span>
        </p>
        <p className="text-muted-foreground">
          Password: <span className="text-foreground">Demo@2024!</span>
        </p>
      </div>
      <Button
        onClick={onDemoLogin}
        isLoading={isLoading}
        className="w-full"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Launch Demo
      </Button>
      <p className="text-center text-xs text-muted-foreground mt-3">
        Or{" "}
        <Link to="/login" className="text-primary hover:underline">
          sign in
        </Link>{" "}
        /{" "}
        <Link to="/register" className="text-primary hover:underline">
          register
        </Link>
      </p>
    </div>
  );
}

/* ── Main page ── */

export default function Showcase() {
  const { isDark, toggleTheme } = useThemeStore();
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const response = await api.post("/auth/demo-login");
      const { token, user } = response.data;
      login(token, user, false);
      toast.success("Welcome to Oryn! Exploring as demo visitor 👀", {
        duration: 5000,
      });
      navigate("/chat");
    } catch {
      toast.error("Demo login failed. Please try again.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: "Real-Time Messaging",
      description:
        "Instant, low-latency chat powered by Socket.IO with read receipts, typing indicators and reactions.",
      accent: true,
    },
    {
      icon: Bot,
      title: "AI Assistant",
      description:
        "Chat with multiple free LLMs including DeepSeek, Llama, and Gemini directly inside conversations.",
      accent: false,
    },
    {
      icon: Users,
      title: "Group Chats",
      description:
        "Create groups, manage members, customise names and share media with everyone at once.",
    },
    {
      icon: Image,
      title: "Media Sharing",
      description:
        "Send images up to 4 MB with inline preview. Cloudinary powers blazing-fast delivery.",
    },
    {
      icon: Shield,
      title: "Secure Auth",
      description:
        "JWT auth with OTP email verification, bcrypt password hashing and rate limiting on all endpoints.",
    },
    {
      icon: Zap,
      title: "Presence & Status",
      description:
        "Live online/offline status, unread counters, and last-seen times — all via WebSocket events.",
    },
    {
      icon: Globe,
      title: "Dark & Light Mode",
      description:
        "Full theme support — Baroworks design system applied consistently across every surface.",
      accent: true,
    },
    {
      icon: Layers,
      title: "Pinned Conversations",
      description:
        "Pin important chats to the top of your sidebar so they're always a click away.",
    },
    {
      icon: Download,
      title: "Export Chat",
      description:
        "Export your conversations as JSON files so you can keep a portable copy of your chat history.",
    },
  ];

  const stack = [
    "React 19",
    "TypeScript",
    "Tailwind CSS v4",
    "Socket.IO",
    "Node.js",
    "Express",
    "MongoDB",
    "Mongoose",
    "Zustand",
    "Framer Motion",
    "OpenRouter API",
    "Cloudinary",
    "JWT",
    "Nodemailer",
    "Vite 7",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/oryn-icon.svg" alt="Oryn" className="h-7 w-auto" />
            <span className="font-bold text-foreground">Oryn</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={handleDemoLogin}
              isLoading={isDemoLoading}
            >
              Try Demo
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 auth-grid-dots pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-sm text-primary font-medium mb-8">
            <Activity className="w-3.5 h-3.5" />
            Full-Stack MERN Chat Application
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Real-time chat with
            <br />
            <span className="text-gradient">AI superpowers</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Oryn is a production-grade messaging platform built with the MERN
            stack, Socket.IO, and OpenRouter AI integration. Designed as a
            showcase of modern full-stack engineering.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button
              size="lg"
              onClick={handleDemoLogin}
              isLoading={isDemoLoading}
              className="glow-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Launch Demo — No signup
            </Button>
            <Link to="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* App preview mockup */}
          <div className="relative mx-auto max-w-3xl">
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden glow-primary">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-secondary">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                <div className="flex-1 mx-4 h-5 bg-background rounded-md flex items-center px-3">
                  <span className="text-[10px] text-muted-foreground">
                    oryn.app/chat
                  </span>
                </div>
              </div>
              {/* Fake UI */}
              <div className="flex h-52 sm:h-72">
                {/* Sidebar preview */}
                <div className="w-48 sm:w-56 border-r border-border bg-card p-3 space-y-2 flex-shrink-0">
                  <div className="h-5 w-20 skeleton rounded" />
                  <div className="h-8 w-full skeleton rounded-lg mt-3" />
                  <div className="space-y-2 mt-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div
                            className="h-2.5 skeleton rounded"
                            style={{ width: `${60 + i * 10}%` }}
                          />
                          <div className="h-2 skeleton rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Chat area preview */}
                <div className="flex-1 flex flex-col p-4 gap-3">
                  <div className="flex gap-2 items-end">
                    <div className="w-6 h-6 rounded-full skeleton flex-shrink-0" />
                    <div className="h-8 w-36 skeleton rounded-2xl rounded-bl-md" />
                  </div>
                  <div className="flex gap-2 items-end self-end flex-row-reverse">
                    <div
                      className="h-8 w-28 rounded-2xl rounded-br-md"
                      style={{ background: "hsl(24 95% 53%)" }}
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="w-6 h-6 rounded-full skeleton flex-shrink-0" />
                    <div className="h-12 w-44 skeleton rounded-2xl rounded-bl-md" />
                  </div>
                  <div className="mt-auto h-10 skeleton rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <StatBadge value="15+" label="Technologies used" />
          <StatBadge value="30+" label="React components" />
          <StatBadge value="5" label="Free AI models" />
          <StatBadge value="100%" label="TypeScript frontend" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you'd expect,
            <br />
            <span className="text-gradient">and more</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built from scratch with real-world architecture — not a tutorial
            project.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="bg-secondary/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Tech Stack</h2>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
            {stack.map((t) => (
              <TechBadge key={t} label={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture callouts ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "WebSocket Architecture",
              icon: Activity,
              body: "Socket.IO events drive online status, message delivery, read receipts, typing indicators and group updates — all in under 50ms.",
            },
            {
              title: "AI Integration",
              icon: Bot,
              body: "OpenRouter proxies requests across 5 free LLMs with automatic failover. Busy model? The next one picks up seamlessly.",
            },
            {
              title: "Auth & Security",
              icon: Shield,
              body: "JWT with 7-day expiry, OTP email verification via Nodemailer, bcrypt hashing, rate limiting and CORS guard on every route.",
            },
          ].map(({ title, icon: Icon, body }) => (
            <div
              key={title}
              className="p-6 rounded-2xl border border-border bg-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden border-t border-border">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 50%, hsl(24 95% 53% / 0.10) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
          <Star className="w-8 h-8 text-primary mx-auto mb-6 animate-float" />
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            See it in action
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            No account needed. Click below to explore Oryn with a pre-loaded
            demo session.
          </p>
          <DemoLoginCard
            onDemoLogin={handleDemoLogin}
            isLoading={isDemoLoading}
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-secondary/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/oryn-icon.svg"
              alt="Oryn"
              className="h-6 w-auto opacity-70"
            />
            <span className="text-sm text-muted-foreground">
              Oryn — Built with ❤️ using MERN + Socket.IO
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/login"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Register
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
