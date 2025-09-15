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

// Lazy load pages with prefetch hints
const Login = lazy(() => {
  // Prefetch chat page after login loads
  import("./pages/Chat");
  return import("./pages/Login");
});
const Register = lazy(() => import("./pages/Register"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const Chat = lazy(() => {
  // Prefetch other pages after chat loads
  import("./pages/Login");
  return import("./pages/Chat");
});

// Memoized loading component
const LoadingComponent = memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-foreground">Loading...</span>
    </div>
  </div>
));
LoadingComponent.displayName = "LoadingComponent";

function App() {
  const { isAuthenticated } = useAuthStore();
  const { isDark, setTheme } = useThemeStore();

  useEffect(() => {
    const initializeApp = async () => {
      // Record app start time
      performanceMonitor.recordMetric("app-start", {
        loadTime: performance.now(),
        renderTime: 0,
      });

      // Preload critical resources
      preloadCriticalResources();

      // Initialize theme
      const savedTheme = localStorage.getItem("theme-storage");
      if (savedTheme) {
        try {
          const { state } = JSON.parse(savedTheme);
          setTheme(state.isDark);
        } catch (error) {
          console.error("Error parsing saved theme:", error);
          // Fallback to system preference
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          setTheme(prefersDark);
        }
      } else {
        // Default to system preference
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setTheme(prefersDark);
      }
    };

    initializeApp();

    // Cleanup performance monitor on unmount
    return () => {
      performanceMonitor.cleanup();
    };
  }, [setTheme]);

  return (
    <ErrorBoundary>
      <NetworkErrorBoundary>
        <div className="min-h-screen">
          <Router>
            <Suspense fallback={<LoadingComponent />}>
              <Routes>
                <Route
                  path="/login"
                  element={
                    !isAuthenticated ? <Login /> : <Navigate to="/chat" />
                  }
                />
                <Route
                  path="/register"
                  element={
                    !isAuthenticated ? <Register /> : <Navigate to="/chat" />
                  }
                />
                <Route
                  path="/verify-otp"
                  element={
                    !isAuthenticated ? <VerifyOTP /> : <Navigate to="/chat" />
                  }
                />
                <Route
                  path="/chat"
                  element={
                    isAuthenticated ? <Chat /> : <Navigate to="/login" />
                  }
                />
                <Route
                  path="/chat/:conversationId"
                  element={
                    isAuthenticated ? <Chat /> : <Navigate to="/login" />
                  }
                />
                <Route
                  path="/"
                  element={
                    <Navigate to={isAuthenticated ? "/chat" : "/login"} />
                  }
                />
              </Routes>
            </Suspense>
          </Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: isDark ? "dark-toast" : "",
            }}
          />
        </div>
      </NetworkErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
