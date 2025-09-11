import { Settings, User, Moon, Sun, LogOut } from "lucide-react";
import { useThemeStore } from "../stores/themeStore";
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui";
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
      className="p-3 md:p-2 rounded-xl md:rounded-lg hover:bg-muted transition-colors touch-manipulation"
      title="Profile settings"
    >
      <Settings className="w-5 h-5 md:w-4 md:h-4" />
    </Button>
  );

  return (
    <DropdownMenu trigger={trigger} className="w-64">
      <DropdownMenuSeparator>Profile & Account</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={onShowProfile}
        icon={<User className="w-4 h-4" />}
      >
        Profile Settings
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onShowChangePassword} icon={<span>🔒</span>}>
        Privacy & Security
      </DropdownMenuItem>

      <DropdownMenuSeparator>Preferences</DropdownMenuSeparator>

      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="flex items-center space-x-3 text-sm">
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span>Appearance</span>
        </span>
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </div>

      <DropdownMenuItem onClick={onShowPreferences} icon={<span>🔊</span>}>
        Sound & Vibration
      </DropdownMenuItem>

      <DropdownMenuSeparator>Support</DropdownMenuSeparator>

      <DropdownMenuItem onClick={onShowAbout} icon={<span>ℹ️</span>}>
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
