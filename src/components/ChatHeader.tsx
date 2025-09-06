import { useState, useRef, useEffect } from "react";
import type { Conversation } from "../types";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Bot, Users, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { formatDistanceToNow } from "date-fns";
import api from "../lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "./ConfirmModal";

interface ChatHeaderProps {
  showBackButton?: boolean;
}

export default function ChatHeader({
  showBackButton = false,
}: ChatHeaderProps) {
  // const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeConversation,
    onlineUsers,
    messages,
    setMessages,
    setConversations,
    setActiveConversation,
    toggleConversationPin,
  } = useChatStore();

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

  const handleClearChat = async () => {
    if (!activeConversation || isClearing || messages.length === 0) return;

    try {
      setIsClearing(true);
      setShowMenu(false);

      // Call backend API to clear messages
      await api.delete(
        `/chat/conversations/${activeConversation._id}/messages`
      );

      // Clear messages from local state
      setMessages([]);
      setActiveConversation(null);
      setConversations((convs: Conversation[]) => {
        const updated = convs.map((c) => {
          if (c._id === activeConversation._id) {
            return { ...c, lastMessage: undefined };
          }
          return c;
        });
        return updated;
      });
      toast.success("Chat cleared successfully");
    } catch (error) {
      console.error("Failed to clear chat:", error);
      toast.error("Failed to clear chat");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation || isClearing) return;
    try {
      setIsClearing(true);
      setShowMenu(false);
      await api.delete(`/chat/conversations/${activeConversation._id}`);
      toast.success("Conversation deleted");
      navigate("/chat");
      //remove recently deleted conversation from conversations list
      setConversations((convs: Conversation[]) => {
        const updated = convs.filter((c) => c._id !== activeConversation._id);
        // If the deleted conversation was active, clear it
        if (
          activeConversation &&
          !updated.some((c) => c._id === activeConversation._id)
        ) {
          setActiveConversation(null);
        }
        return updated;
      });
      setMessages([]);
    } catch (e) {
      toast.error("Failed to delete conversation");
    } finally {
      setIsClearing(false);
    }
  };

  if (!activeConversation) return null;

  const getConversationInfo = () => {
    if (activeConversation.isGroup) {
      return {
        name: activeConversation.groupName || "Group Chat",
        subtitle: `${activeConversation.participants.length} members`,
        avatar: activeConversation.groupAvatar || "",
        isOnline: false,
        isAI: false,
      };
    }

    const otherUser = activeConversation.participants.find(
      (p) => p._id !== user?._id
    );

    if (!otherUser) {
      return {
        name: "AI Assistant",
        subtitle: "AI Assistant - Always available",
        // avatar: "",
        // isOnline: false,
        isAI: true,
      };
    }

    const isAI = otherUser._id === "ai-assistant";
    const isOnline = isAI || onlineUsers.has(otherUser._id);

    return {
      name: otherUser.username,
      subtitle: isAI
        ? "AI Assistant - Always available"
        : isOnline
        ? "Online"
        : `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), {
            addSuffix: true,
          })}`,
      avatar: otherUser.avatar,
      isOnline,
      isAI,
    };
  };

  const { name, subtitle, avatar, isOnline, isAI } = getConversationInfo();

  return (
    <div className="bg-background border-b border-border p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Left side - Back button and User info */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Back button for mobile */}
          {showBackButton && (
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="p-2 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors md:hidden"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center overflow-hidden ${
                isAI
                  ? "bg-gradient-to-br from-purple-500 to-blue-600"
                  : avatar
                  ? "bg-cover bg-center"
                  : "bg-primary"
              }`}
            >
              {isAI ? (
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
              ) : avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-medium text-base md:text-lg">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Online indicator */}
            {isOnline && !isAI && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base md:text-lg text-foreground flex items-center truncate">
              {name}
              {activeConversation.isGroup && (
                <Users className="w-4 h-4 md:w-5 md:h-5 ml-1 text-muted-foreground flex-shrink-0" />
              )}
              {isAI && (
                <Bot className="w-4 h-4 md:w-5 md:h-5 ml-1 text-accent flex-shrink-0" />
              )}
            </h2>
            <p className="text-xs md:text-sm truncate text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-1 md:space-x-2">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 md:p-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors"
              title="More options"
            >
              <MoreVertical className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <div className="px-4 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Chat Management
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setShowMenu(false);
                        await api.post(
                          `/chat/conversations/${activeConversation._id}/pin`
                        );
                        toggleConversationPin(activeConversation._id);

                        toast.success(
                          `Conversation ${
                            activeConversation.pinnedAt ? "unpinned" : "pinned"
                          } successfully`
                        );
                      } catch {
                        toast.error("Failed to update pin");
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      📌
                    </span>
                    <span>
                      {activeConversation.pinnedAt
                        ? "Unpin Conversation"
                        : "Pin Conversation"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      toast("Notifications muted");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      🔕
                    </span>
                    <span>Mute Notifications</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      toast("Marked as unread");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      📩
                    </span>
                    <span>Mark as Unread</span>
                  </button>

                  <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Media & Data
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      window.dispatchEvent(new CustomEvent("open-view-media"));
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      🖼️
                    </span>
                    <span>View Media & Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      toast("Export chat coming soon");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      📂
                    </span>
                    <span>Export Chat</span>
                  </button>

                  <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Cleanup
                  </div>
                  <button
                    type="button"
                    onClick={handleClearChat}
                    disabled={isClearing || messages.length === 0}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      🧹
                    </span>
                    <span>{isClearing ? "Clearing..." : "Clear Chat"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3 text-destructive"
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center">
                      🗑️
                    </span>
                    <span>Delete Conversation</span>
                  </button>

                  {!isAI && (
                    <>
                      <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        User Actions
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          toast("User blocked");
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                      >
                        <span className="w-4 h-4 inline-flex items-center justify-center">
                          🚫
                        </span>
                        <span>Block User</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          toast("Report submitted");
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3"
                      >
                        <span className="w-4 h-4 inline-flex items-center justify-center">
                          📝
                        </span>
                        <span>Report User</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      {/* {showSearch && (
        <div className="mt-3 md:mt-4">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-sm md:text-base bg-muted rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary"
              autoFocus
            />
          </div>
        </div>
      )} */}
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConversation}
          title="Delete Conversation"
          description="This will permanently delete all messages in this conversation."
          confirmText="Delete"
        />
      )}
    </div>
  );
}
