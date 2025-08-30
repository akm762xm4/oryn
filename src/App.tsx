import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";
import { useEffect, lazy, Suspense } from "react";
import "./index.css";

// Lazy load non-critical pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const Chat = lazy(() => import("./pages/Chat"));

function App() {
  const { isAuthenticated } = useAuthStore();
  const { isDark, setTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme on app load
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
  }, [setTheme]);

  return (
    <div className="min-h-screen">
      <Router>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              Loading...
            </div>
          }
        >
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <Login /> : <Navigate to="/chat" />}
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
              element={isAuthenticated ? <Chat /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />}
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
  );
}

export default App;
