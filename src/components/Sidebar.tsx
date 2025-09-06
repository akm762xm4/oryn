import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bot,
  User,
  X,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { useThemeStore } from "../stores/themeStore";
import { socketService } from "../lib/socket";
import ConversationList from "./ConversationList";
import ConversationSkeleton from "./skeletons/ConversationSkeleton";
import NewChatModal from "./NewChatModal";
import UserProfile from "./UserProfile";
import LogoutConfirmModal from "./LogoutConfirmModal";
import api from "../lib/api";
import { usePreferencesStore } from "../stores/preferencesStore";
import toast from "react-hot-toast";

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    conversations,
    setConversations,
    setActiveConversation,
    isLoadingConversations,
  } = useChatStore();
  const [suggested, setSuggested] = useState<
    { _id: string; username: string; avatar?: string }[]
  >([]);
  const { isDark, toggleTheme } = useThemeStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const {
    soundEnabled,
    vibrationEnabled,
    setSoundEnabled,
    setVibrationEnabled,
  } = usePreferencesStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;

    if (conv.isGroup) {
      return conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      const otherUser = conv.participants.find((p) => p._id !== user?._id);
      return otherUser?.username
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    }
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const createAIConversation = async () => {
    try {
      // Create an AI conversation
      const response = await api.post("/chat/conversations", {
        isAI: true,
        isGroup: false,
      });

      const isMobile = window.innerWidth < 768;

      // Always set active conversation first so UI is ready
      setActiveConversation(response.data);

      if (isMobile) {
        // Navigate immediately on mobile
        navigate(`/chat/${response.data._id}`);
      }

      toast.success("AI chat started!");
    } catch (error) {
      console.error("AI conversation error:", error);
      toast.error("Failed to start AI chat");
    }
  };

  // Load suggested users (simple heuristic via search without query)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/chat/search/users", { params: { q: "" } });
        const others = (res.data || [])
          .filter((u: any) => u._id !== user?._id)
          .slice(0, 5);
        // eliminate who are in conversations already
        setSuggested(
          others.filter(
            (u: any) =>
              !conversations.some((c) =>
                c.participants.find((p) => p._id === u._id)
              )
          )
        );
      } catch {
        // ignore
      }
    })();
  }, [user?._id]);

  const startChatWith = async (userId: string) => {
    try {
      const res = await api.post("/chat/conversations", {
        isGroup: false,
        participantId: userId,
      });
      setActiveConversation(res.data);
      setConversations((convs) => {
        // If conversation already exists, don't add
        if (convs.some((c) => c._id === res.data._id)) return convs;
        return [res.data, ...convs];
      });
      if (window.innerWidth < 768) navigate(`/chat/${res.data._id}`);
    } catch {
      toast.error("Failed to start chat");
    }
  };

  return (
    <div className="w-full md:w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-4 px-6 md:px-4 border-b border-border">
        <div className="flex items-center justify-between mb-6 md:mb-4">
          <div className="flex items-center space-x-2">
            <img
              src="/Oryn Full.png"
              alt="Oryn"
              className="h-10 md:h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center space-x-2 md:space-x-1">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(true)}
                className="p-3 md:p-2 rounded-xl md:rounded-lg hover:bg-muted transition-colors touch-manipulation"
                title="Profile settings"
              >
                <Settings className="w-5 h-5 md:w-4 md:h-4" />
              </button>
              {/* Popup Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <div className="px-4 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Profile & Account
                    </div>
                    <button
                      onClick={() => {
                        setShowProfile(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        toast("Privacy & Security coming soon");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                    >
                      <span className="w-4 h-4 inline-flex items-center justify-center">
                        🔒
                      </span>
                      <span>Privacy & Security</span>
                    </button>

                    <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Preferences
                    </div>
                    <button
                      onClick={() => {
                        toggleTheme();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                    >
                      {isDark ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                      <span>Appearance</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowPrefs(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                    >
                      <span className="w-4 h-4 inline-flex items-center justify-center">
                        🔊
                      </span>
                      <span>Sound & Vibration</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        toast("Notification settings coming soon");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                    >
                      <span className="w-4 h-4 inline-flex items-center justify-center">
                        🔔
                      </span>
                      <span>Notification Settings</span>
                    </button>

                    <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Support
                    </div>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        toast("Help & Support coming soon");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                    >
                      <span className="w-4 h-4 inline-flex items-center justify-center">
                        ❓
                      </span>
                      <span>Help & Support</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        toast("Oryn v1.0.0");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                    >
                      <span className="w-4 h-4 inline-flex items-center justify-center">
                        ℹ️
                      </span>
                      <span>About Oryn</span>
                    </button>

                    <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Danger Zone
                    </div>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3 text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 md:left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 md:pl-10 pr-12 md:pr-10 py-4 md:py-2 text-base md:text-sm bg-muted rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary touch-manipulation"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 md:right-3 top-1/2 transform -translate-y-1/2 p-1 md:p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors touch-manipulation"
              title="Clear search"
            >
              <X className="w-4 h-4 md:w-3 md:h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 md:p-4 px-6 md:px-4 border-b border-border">
        <div className="flex space-x-3 md:space-x-2">
          <button
            type="button"
            onClick={() => setShowNewChat(true)}
            className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white py-4 md:py-2 px-6 md:px-4 rounded-xl md:rounded-lg hover:bg-primary/90 transition-colors touch-manipulation shadow-sm"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="text-base md:text-sm font-medium">New Chat</span>
          </button>
          <button
            type="button"
            onClick={createAIConversation}
            className="flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 text-white py-4 md:py-2 px-6 md:px-4 rounded-xl md:rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 shadow-md touch-manipulation"
            title="Chat with AI"
          >
            <Bot className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <ConversationSkeleton />
        ) : (
          <>
            <ConversationList conversations={filteredConversations} />
            {/* Suggested users */}
            {suggested.length > 0 && (
              <div className="mt-4 p-4 border-t">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Suggested
                </div>
                <div className="flex flex-col gap-2">
                  {suggested.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => startChatWith(s._id)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white">
                        {s.avatar ? (
                          <img
                            src={s.avatar}
                            alt={s.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {s.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-sm">{s.username}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Info */}
      {}
      <div className="p-4 md:p-4 px-6 md:px-4 border-t border-border transition-all duration-300 hidden md:block ">
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="w-full flex items-center space-x-4 md:space-x-3 p-2 md:p-0 rounded-xl md:rounded-none hover:bg-muted md:hover:bg-transparent transition-colors touch-manipulation"
        >
          <div className="w-12 h-12 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 md:w-6 md:h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-base md:text-sm font-medium text-foreground truncate">
              {user?.username}
            </p>
            <p className="text-sm md:text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <div className="w-4 h-4 md:w-3 md:h-3 bg-accent rounded-full"></div>
        </button>
      </div>

      {/* Modals */}
      {showNewChat && (
        <NewChatModal
          isOpen={showNewChat}
          onClose={() => setShowNewChat(false)}
        />
      )}

      {showProfile && (
        <UserProfile
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showLogoutConfirm && (
        <LogoutConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}

      {showPrefs && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPrefs(false)}
        >
          <div
            className="bg-background rounded-2xl w-full max-w-md p-6 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Sound & Vibration</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm">Sound effects</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Vibration / Haptics</span>
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={(e) => setVibrationEnabled(e.target.checked)}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-muted"
                onClick={() => setShowPrefs(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
