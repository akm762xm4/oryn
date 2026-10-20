import {
  Settings, User, Lock, Moon, Sun, LogOut, Volume2, Info,
} from "lucide-react";
import { useThemeStore } from "../stores/themeStore";
import { Button, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "./ui";
import { ThemeToggle } from "./ToggleTheme";

interface SettingsMenuProps {
  onShowProfile: () => void;
  onShowPreferences: () => void;
  onShowChangePassword: () => void;
  onShowLogoutConfirm: () => void;
  onShowAbout: () => void;
}

export default function SettingsMenu({
  onShowProfile,
  onShowPreferences,
  onShowChangePassword,
  onShowLogoutConfirm,
  onShowAbout,
}: SettingsMenuProps) {
  const { isDark, toggleTheme } = useThemeStore();

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="hover:bg-muted transition-colors"
      title="Settings"
    >
      <Settings className="w-4 h-4" />
    </Button>
  );

  return (
    <DropdownMenu trigger={trigger} className="w-60">
      <DropdownMenuSeparator>Profile & Account</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={onShowProfile}
        icon={<User className="w-4 h-4" />}
      >
        Profile Settings
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={onShowChangePassword}
        icon={<Lock className="w-4 h-4" />}
      >
        Privacy & Security
      </DropdownMenuItem>

      <DropdownMenuSeparator>Preferences</DropdownMenuSeparator>

      {/* Appearance row — inline toggle */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="flex items-center gap-3 text-sm text-foreground">
          {isDark
            ? <Moon className="w-4 h-4 text-muted-foreground" />
            : <Sun className="w-4 h-4 text-muted-foreground" />}
          Appearance
        </span>
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </div>

      <DropdownMenuItem
        onClick={onShowPreferences}
        icon={<Volume2 className="w-4 h-4" />}
      >
        Sound & Vibration
      </DropdownMenuItem>

      <DropdownMenuSeparator>Support</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={onShowAbout}
        icon={<Info className="w-4 h-4" />}
      >
        About Oryn
      </DropdownMenuItem>

      <DropdownMenuSeparator>Danger Zone</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={onShowLogoutConfirm}
        icon={<LogOut className="w-4 h-4" />}
        destructive
      >
        Logout
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
