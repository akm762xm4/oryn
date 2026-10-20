import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Bot, X } from "lucide-react";
import { Button, Avatar } from "./ui";
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
    }
    const other = conv.participants.find((p) => p._id !== user?._id);
    return other?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const createAIConversation = async () => {
    try {
      const response = await api.post("/chat/conversations", {
        isAI: true,
        isGroup: false,
      });
      setActiveConversation(response.data);
      if (window.innerWidth < 768) navigate(`/chat/${response.data._id}`);
      toast.success("AI chat started!");
    } catch {
      toast.error("Failed to start AI chat");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/chat/search/users", { params: { q: "" } });
        const others = (res.data || [])
          .filter((u: any) => u._id !== user?._id)
          .slice(0, 5);
        setSuggested(
          others.filter(
            (u: any) =>
              !conversations.some((c) =>
                c.participants.find((p) => p._id === u._id),
              ),
          ),
        );
      } catch {
        /* ignore */
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
        if (convs.some((c) => c._id === res.data._id)) return convs;
        return [res.data, ...convs];
      });
      if (window.innerWidth < 768) navigate(`/chat/${res.data._id}`);
    } catch {
      toast.error("Failed to start chat");
    }
  };

  return (
    <div
      className="w-full md:w-72 lg:w-80 flex flex-col"
      style={{
        background: "hsl(var(--sidebar-bg))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      {/* ── Header ── */}
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img src="/oryn-wordmark.svg" alt="Oryn" className="h-8 w-auto" />
            {/* <span className="font-bold text-foreground text-base tracking-tight">Oryn</span> */}
          </div>
          <SettingsMenu
            onShowProfile={() => setShowProfile(true)}
            onShowPreferences={() => setShowPrefs(true)}
            onShowChangePassword={() => setShowChangePass(true)}
            onShowLogoutConfirm={() => setShowLogoutConfirm(true)}
            onShowAbout={() => setShowAbout(true)}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            className="w-full h-9 bg-card text-foreground text-sm border border-border rounded-xl pl-9 pr-9 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div
        className="px-4 py-3 border-b flex gap-2"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
      >
        <Button
          onClick={() => setShowNewChat(true)}
          size="md"
          className="flex-1"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
        <Button
          onClick={createAIConversation}
          size="icon"
          className="bg-gradient-to-br from-violet-500 to-primary hover:opacity-90 shadow-md h-9 w-9 flex-shrink-0"
          title="Chat with AI Assistant"
        >
          <Bot className="w-4 h-4 text-white" />
        </Button>
      </div>

      {/* ── Conversations list ── */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoadingConversations ? (
          <ConversationSkeleton />
        ) : (
          <>
            <ConversationList conversations={filteredConversations} />
            <SuggestedUsers users={suggested} onStartChat={startChatWith} />
          </>
        )}
      </div>

      {/* ── Current user footer ── */}
      <div
        className="px-3 py-3 border-t hidden md:block"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
      >
        <button
          onClick={() => setShowProfile(true)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors text-left"
        >
          <Avatar src={user?.avatar} name={user?.username || ""} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
        </button>
      </div>

      {/* Modals */}
      {showNewChat && (
        <NewChatModal isOpen onClose={() => setShowNewChat(false)} />
      )}
      {showProfile && (
        <UserProfile isOpen onClose={() => setShowProfile(false)} />
      )}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          isOpen
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}
      {showAbout && <AboutModal isOpen onClose={() => setShowAbout(false)} />}
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
