import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Bot, X } from "lucide-react";
import { Button, Input, Avatar } from "./ui";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { socketService } from "../lib/socket";
import ConversationList from "./ConversationList";
import ConversationSkeleton from "./skeletons/ConversationSkeleton";
import NewChatModal from "./NewChatModal";
import UserProfile from "./UserProfile";
import LogoutConfirmModal from "./LogoutConfirmModal";
import SettingsMenu from "./SettingsMenu";
import PreferencesModal from "./PreferencesModal";
import ChangePasswordModal from "./ChangePasswordModal";
import SuggestedUsers from "./SuggestedUsers";
import api from "../lib/api";
import toast from "react-hot-toast";
import AboutModal from "./AboutModal";

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [suggested, setSuggested] = useState<
    { _id: string; username: string; avatar?: string }[]
  >([]);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    conversations,
    setConversations,
    setActiveConversation,
    isLoadingConversations,
  } = useChatStore();

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
  }, [user?._id, conversations.length]);

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
            <SettingsMenu
              onShowProfile={() => setShowProfile(true)}
              onShowPreferences={() => setShowPrefs(true)}
              onShowChangePassword={() => setShowChangePass(true)}
              onShowLogoutConfirm={() => setShowLogoutConfirm(true)}
              onShowAbout={() => setShowAbout(true)}
            />
          </div>
        </div>

        {/* Search */}
        <Input
          leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
          rightIcon={
            searchQuery ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={clearSearch}
                className="absolute top-1/2 right-0 transform -translate-y-1/2 p-1 md:p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors touch-manipulation"
                title="Clear search"
              >
                <X className="w-4 h-4 md:w-3 md:h-3 text-muted-foreground" />
              </Button>
            ) : undefined
          }
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="touch-manipulation py-3 md:py-3.5 md:text-sm text-xs"
        />
      </div>

      {/* Action Buttons */}
      <div className="p-4 md:p-4 px-6 md:px-4 border-b border-border">
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowNewChat(true)}
            size="lg"
            className="flex-1 py-4 md:py-2 px-6 md:px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
          <Button
            onClick={createAIConversation}
            size="lg"
            className="py-4 md:py-2 px-6 md:px-4 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-md"
            title="Chat with AI"
          >
            <Bot className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <ConversationSkeleton />
        ) : (
          <>
            <ConversationList conversations={filteredConversations} />
            <SuggestedUsers users={suggested} onStartChat={startChatWith} />
          </>
        )}
      </div>

      {/* User Info */}
      {}
      <div className="p-4 border-t border-border hidden md:block">
        <Button
          variant="ghost"
          onClick={() => setShowProfile(true)}
          className="w-full justify-start p-2 h-auto hover:bg-muted"
        >
          <Avatar src={user?.avatar} name={user?.username || ""} size="md" />
          <div className="flex-1 min-w-0 text-left ml-3">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <div className="w-3 h-3 bg-accent rounded-full"></div>
        </Button>
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

      {showAbout && (
        <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      )}

      <PreferencesModal
        isOpen={showPrefs}
        onClose={() => setShowPrefs(false)}
      />

      <ChangePasswordModal
        isOpen={showChangePass}
        onClose={() => setShowChangePass(false)}
      />
    </div>
  );
}
