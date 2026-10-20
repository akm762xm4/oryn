import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";
import { useEffect, lazy, Suspense, memo } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NetworkErrorBoundary } from "./components/NetworkErrorBoundary";
import {
  performanceMonitor,
  preloadCriticalResources,
} from "./lib/performance";
import "./index.css";

// Lazy load pages
const AuthPage = lazy(() => { import("./pages/Chat"); return import("./pages/Login"); });
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Showcase = lazy(() => import("./pages/Showcase"));
const Chat = lazy(() => { import("./pages/Login"); return import("./pages/Chat"); });

const LoadingComponent = memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Loading…</span>
    </div>
  </div>
));
LoadingComponent.displayName = "LoadingComponent";

function App() {
  const { isAuthenticated } = useAuthStore();
  const { setTheme } = useThemeStore();

  useEffect(() => {
    const init = async () => {
      performanceMonitor.recordMetric("app-start", {
        loadTime: performance.now(),
        renderTime: 0,
      });
      preloadCriticalResources();
      const saved = localStorage.getItem("theme-storage");
      if (saved) {
        try {
          const { state } = JSON.parse(saved);
          setTheme(state.isDark);
        } catch {
          setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
      } else {
        setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    };
    init();
    return () => performanceMonitor.cleanup();
  }, [setTheme]);

  return (
    <ErrorBoundary>
      <NetworkErrorBoundary>
        <div className="min-h-screen">
          <Router>
            <Suspense fallback={<LoadingComponent />}>
              <Routes>
                {/* Public showcase / landing */}
                <Route path="/showcase" element={<Showcase />} />

                {/* Auth pages — redirect to chat if already logged in */}
                <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/chat" />} />
                <Route path="/register" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/chat" />} />
                <Route path="/verify-otp" element={!isAuthenticated ? <VerifyOTP /> : <Navigate to="/chat" />} />
                <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/chat" />} />
                <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/chat" />} />

                {/* App */}
                <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
                <Route path="/chat/:conversationId" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />

                {/* Root redirect */}
                <Route path="/" element={<Navigate to={isAuthenticated ? "/chat" : "/showcase"} />} />
              </Routes>
            </Suspense>
          </Router>

          <Toaster
            position="bottom-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.875rem",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 24px hsl(var(--foreground) / 0.12)",
                maxWidth: "360px",
              },
              success: {
                iconTheme: {
                  primary: "hsl(var(--primary))",
                  secondary: "hsl(var(--primary-foreground))",
                },
              },
              error: {
                iconTheme: {
                  primary: "hsl(var(--destructive))",
                  secondary: "hsl(var(--destructive-foreground))",
                },
              },
            }}
          />
        </div>
      </NetworkErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
