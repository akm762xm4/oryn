import { useState } from "react";
import {
  Search,
  Plus,
  Settings,
  LogOut,
  Moon,
  Sun,
  MessageCircle,
  Bot,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { useThemeStore } from "../stores/themeStore";
import { socketService } from "../lib/socket";
import ConversationList from "./ConversationList";
import NewChatModal from "./NewChatModal";
import UserProfile from "./UserProfile";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuthStore();
  const { conversations, setActiveConversation } = useChatStore();
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
    toast.success("Logged out successfully");
  };

  const createAIConversation = async () => {
    try {
      // Create an AI conversation
      const response = await api.post("/chat/conversations", {
        isAI: true,
        isGroup: false,
      });

      // The backend now handles adding the virtual AI participant
      setActiveConversation(response.data);
      toast.success("AI chat started!");
    } catch (error) {
      console.error("AI conversation error:", error);
      toast.error("Failed to start AI chat");
    }
  };

  return (
    <div className="w-80 bg-card border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-2 rounded-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Chats</h1>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Profile settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-destructive"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowNewChat(true)}
            className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
          <button
            type="button"
            onClick={createAIConversation}
            className="flex items-center justify-center bg-accent text-white py-2 px-4 rounded-lg hover:bg-accent/90 transition-colors"
            title="Chat with AI"
          >
            <Bot className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList conversations={filteredConversations} />
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <div className="w-3 h-3 bg-accent rounded-full"></div>
        </div>
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
    </div>
  );
}
