import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Video,
  MoreVertical,
  Search,
  Bot,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { formatDistanceToNow } from "date-fns";

interface ChatHeaderProps {
  showBackButton?: boolean;
}

export default function ChatHeader({
  showBackButton = false,
}: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
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
    <div className="bg-background border-b border-border p-4 md:p-4 px-6 md:px-4">
      <div className="flex items-center justify-between">
        {/* Left side - Back button and User info */}
        <div className="flex items-center space-x-4 md:space-x-3">
          {/* Back button for mobile */}
          {showBackButton && (
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="p-3 md:p-2 rounded-xl md:rounded-lg hover:bg-muted active:bg-muted/80 transition-colors md:hidden touch-manipulation"
              title="Back to conversations"
            >
              <ArrowLeft className="w-6 h-6 md:w-5 md:h-5 text-muted-foreground" />
            </button>
          )}
          {/* Avatar */}
          <div className="relative">
            <div
              className={`w-12 h-12 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                isAI
                  ? "bg-gradient-to-br from-purple-500 to-blue-600"
                  : avatar
                  ? "bg-cover bg-center"
                  : "bg-primary"
              }`}
            >
              {isAI ? (
                <Bot className="w-6 h-6 md:w-5 md:h-5 text-white" />
              ) : avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-medium text-lg md:text-base">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Online indicator */}
            {isOnline && !isAI && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-3 md:h-3 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold md:font-semibold text-lg md:text-base text-foreground flex items-center truncate">
              {name}
              {activeConversation.isGroup && (
                <Users className="w-5 h-5 md:w-4 md:h-4 ml-2 text-muted-foreground flex-shrink-0" />
              )}
              {isAI && (
                <Bot className="w-5 h-5 md:w-4 md:h-4 ml-2 text-accent flex-shrink-0" />
              )}
            </h2>
            <p
              className={`text-base md:text-sm truncate ${
                isOnline ? "text-accent" : "text-muted-foreground"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="p-3 md:p-2 rounded-xl md:rounded-lg hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
            title="Search messages"
          >
            <Search className="w-6 h-6 md:w-5 md:h-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="p-3 md:p-2 rounded-xl md:rounded-lg hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
            title="More options"
          >
            <MoreVertical className="w-6 h-6 md:w-5 md:h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="mt-6 md:mt-4">
          <div className="relative">
            <Search className="absolute left-4 md:left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              className="w-full pl-12 md:pl-10 pr-4 py-4 md:py-2 text-base md:text-sm bg-muted rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary touch-manipulation"
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}
