import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import type { Conversation } from "../types";
import { Bot, Users } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
}

const ConversationList = memo(function ConversationList({
  conversations,
}: ConversationListProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeConversation, setActiveConversation, onlineUsers } =
    useChatStore();

  const handleConversationClick = (conversation: Conversation) => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile, navigate to the conversation route
      navigate(`/chat/${conversation._id}`);
    } else {
      // On desktop, just set active conversation if it's not already active
      if (activeConversation?._id !== conversation._id) {
        setActiveConversation(conversation);
      }
    }
  };

  const getConversationInfo = useCallback(
    (conversation: Conversation) => {
      if (conversation.isGroup) {
        return {
          name: conversation.groupName || "Group Chat",
          avatar: conversation.groupAvatar || "",
          isOnline: false,
          isAI: false,
        };
      }

      const otherUser = conversation.participants.find(
        (p) => p._id !== user?._id
      );

      if (!otherUser) {
        return {
          name: "AI Assistant",
          // avatar: "",
          // isOnline: false,
          isAI: true,
        };
      }

      // Check if it's AI conversation
      const isAI =
        otherUser._id === "ai-assistant" ||
        otherUser.username === "AI Assistant";

      return {
        name: otherUser.username,
        avatar: otherUser.avatar,
        isOnline: isAI || onlineUsers.has(otherUser._id),
        isAI,
      };
    },
    [user?._id, onlineUsers]
  );

  const formatLastMessage = (conversation: Conversation) => {
    if (!conversation.lastMessage) return "No messages yet";

    const { content, messageType, isAI } = conversation.lastMessage;

    if (messageType === "image") return "📷 Photo";
    if (messageType === "ai" || isAI) return `🤖 ${content}`;

    return content.length > 50 ? `${content.substring(0, 50)}...` : content;
  };

  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "";
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 md:p-8 px-6 text-center">
        <div className="w-20 h-20 md:w-16 md:h-16 bg-muted rounded-full flex items-center justify-center mb-6 md:mb-4">
          <Users className="w-10 h-10 md:w-8 md:h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl md:text-lg font-semibold md:font-medium text-foreground mb-3 md:mb-2">
          No conversations yet
        </h3>
        <p className="text-muted-foreground text-base md:text-sm leading-relaxed">
          Start a new chat to begin messaging
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-1 p-4 md:p-2">
      {conversations.map((conversation) => {
        const { name, avatar, isOnline, isAI } =
          getConversationInfo(conversation);
        const isActive = activeConversation?._id === conversation._id;

        return (
          <button
            key={conversation._id}
            type="button"
            onClick={() => handleConversationClick(conversation)}
            className={`w-full p-4 md:p-3 rounded-xl md:rounded-lg text-left transition-colors touch-manipulation ${
              isActive
                ? "bg-primary text-white shadow-md"
                : "hover:bg-muted active:bg-muted/80"
            }`}
          >
            <div className="flex items-center space-x-4 md:space-x-3">
              {/* Avatar */}
              <div className="relative">
                <div
                  className={`w-14 h-14 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                    isAI
                      ? "bg-gradient-to-br from-purple-500 to-blue-600"
                      : avatar
                      ? "bg-cover bg-center"
                      : "bg-primary"
                  }`}
                >
                  {isAI ? (
                    <Bot className="w-7 h-7 md:w-6 md:h-6 text-white" />
                  ) : avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium text-xl md:text-lg">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Online indicator */}
                {isOnline && !isAI && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-4 md:h-4 bg-green-500 border-2 border-background rounded-full"></div>
                )}

                {/* AI indicator */}
                {isAI && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-4 md:h-4 bg-gradient-to-br from-purple-500 to-blue-600 border-2 border-background rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2 md:mb-1">
                  <h3
                    className={`font-semibold md:font-medium text-base md:text-sm truncate ${
                      isActive ? "text-white" : "text-foreground"
                    }`}
                  >
                    {name}
                    {conversation.isGroup && (
                      <span className="ml-1 text-sm md:text-xs opacity-75">
                        ({conversation.participants.length})
                      </span>
                    )}
                  </h3>
                  {conversation.lastMessage && (
                    <span
                      className={`text-sm md:text-xs font-medium md:font-normal ${
                        isActive ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(conversation.updatedAt)}
                    </span>
                  )}
                </div>

                <p
                  className={`text-sm md:text-sm truncate leading-relaxed ${
                    isActive ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  {formatLastMessage(conversation)}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default ConversationList;
