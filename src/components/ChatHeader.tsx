import { useState } from "react";
import { Phone, Video, MoreVertical, Search, Bot, Users } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { formatDistanceToNow } from "date-fns";

export default function ChatHeader() {
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuthStore();
  const { activeConversation, onlineUsers } = useChatStore();

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
      <div className="flex items-center justify-between">
        {/* Left side - User info */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isAI
                  ? "bg-accent"
                  : avatar
                  ? "bg-cover bg-center"
                  : "bg-primary"
              }`}
            >
              {isAI ? (
                <Bot className="w-5 h-5 text-white" />
              ) : avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-medium">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Online indicator */}
            {isOnline && !isAI && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent border-2 border-background rounded-full"></div>
            )}
          </div>

          {/* Name and status */}
          <div>
            <h2 className="font-semibold text-foreground flex items-center">
              {name}
              {activeConversation.isGroup && (
                <Users className="w-4 h-4 ml-2 text-muted-foreground" />
              )}
              {isAI && <Bot className="w-4 h-4 ml-2 text-accent" />}
            </h2>
            <p
              className={`text-sm ${
                isOnline ? "text-accent" : "text-muted-foreground"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Search messages"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>

          {!isAI && (
            <>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Voice call"
              >
                <Phone className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                type="button"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Video call"
              >
                <Video className="w-5 h-5 text-muted-foreground" />
              </button>
            </>
          )}

          <button
            type="button"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="More options"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary"
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}
