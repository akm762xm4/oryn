import { memo, useCallback } from "react";
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
  const { user } = useAuthStore();
  const { activeConversation, setActiveConversation, onlineUsers } =
    useChatStore();

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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No conversations yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Start a new chat to begin messaging
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conversation) => {
        const { name, avatar, isOnline, isAI } =
          getConversationInfo(conversation);
        const isActive = activeConversation?._id === conversation._id;

        return (
          <button
            key={conversation._id}
            type="button"
            onClick={() => setActiveConversation(conversation)}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              isActive ? "bg-primary text-white" : "hover:bg-muted"
            }`}
            disabled={conversation._id === activeConversation?._id}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isAI
                      ? "bg-accent"
                      : avatar
                      ? "bg-cover bg-center"
                      : "bg-primary"
                  }`}
                >
                  {isAI ? (
                    <Bot className="w-6 h-6 text-white" />
                  ) : avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium text-lg">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Online indicator */}
                {isOnline && !isAI && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent border-2 border-background rounded-full"></div>
                )}

                {/* AI indicator */}
                {isAI && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent border-2 border-background rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`font-medium truncate ${
                      isActive ? "text-white" : "text-foreground"
                    }`}
                  >
                    {name}
                    {conversation.isGroup && (
                      <span className="ml-1 text-xs opacity-75">
                        ({conversation.participants.length})
                      </span>
                    )}
                  </h3>
                  {conversation.lastMessage && (
                    <span
                      className={`text-xs ${
                        isActive ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(conversation.updatedAt)}
                    </span>
                  )}
                </div>

                <p
                  className={`text-sm truncate ${
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
