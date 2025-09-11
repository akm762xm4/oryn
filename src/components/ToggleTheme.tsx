import { Sun, Moon } from "lucide-react";

export const ThemeToggle = ({
  isDark,
  toggleTheme,
}: {
  isDark: boolean;
  toggleTheme: () => void;
}) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input
        aria-label="Toggle dark mode"
        type="checkbox"
        checked={isDark}
        onChange={toggleTheme}
        className="sr-only"
      />
      <div
        className={`relative h-10 w-20 rounded-full border border-border transition-colors ${
          isDark ? "bg-[#0b0f2a]" : "bg-muted"
        }`}
      >
        {/* Knob */}
        <div
          className={`absolute top-1/2 left-1 -translate-y-1/2 h-8 w-8 rounded-full bg-background text-foreground ring-1 ring-border shadow flex items-center justify-center transition-transform duration-300 ease-out ${
            isDark ? "translate-x-10" : "translate-x-0"
          }`}
        >
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </div>
        {/* Optional subtle outline to match app aesthetics */}
        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-primary/30" />
      </div>
    </label>
  );
};
