import { useState } from "react";
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
import toast from "react-hot-toast";

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { conversations, setActiveConversation, isLoadingConversations } =
    useChatStore();
  const { isDark, toggleTheme } = useThemeStore();

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

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const createAIConversation = async () => {
    try {
      // Create an AI conversation
      const response = await api.post("/chat/conversations", {
        isAI: true,
        isGroup: false,
      });

      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // On mobile, navigate to the AI conversation
        navigate(`/chat/${response.data._id}`);
      } else {
        // On desktop, just set active conversation
        setActiveConversation(response.data);
      }

      toast.success("AI chat started!");
    } catch (error) {
      console.error("AI conversation error:", error);
      toast.error("Failed to start AI chat");
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
            <button
              type="button"
              onClick={toggleTheme}
              className="p-3 md:p-2 rounded-xl md:rounded-lg hover:bg-muted transition-colors touch-manipulation"
              title="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 md:w-4 md:h-4" />
              ) : (
                <Moon className="w-5 h-5 md:w-4 md:h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="p-3 md:p-2 rounded-xl md:rounded-lg hover:bg-muted transition-colors touch-manipulation"
              title="Profile settings"
            >
              <Settings className="w-5 h-5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="p-3 md:p-2 rounded-xl md:rounded-lg hover:bg-muted transition-colors text-destructive touch-manipulation"
              title="Logout"
            >
              <LogOut className="w-5 h-5 md:w-4 md:h-4" />
            </button>
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
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
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
          <ConversationList conversations={filteredConversations} />
        )}
      </div>

      {/* User Info */}
      <div
        className={`p-4 md:p-4 px-6 md:px-4 border-t border-border transition-all duration-300 ${
          isSearchFocused ? "md:block hidden" : "block"
        }`}
      >
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
    </div>
  );
}
