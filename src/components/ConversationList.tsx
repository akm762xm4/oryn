import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import type { Conversation } from "../types";
import { Bot, Pin, Users } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
}

const ConversationList = memo(function ConversationList({
  conversations,
}: ConversationListProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeConversation,
    setActiveConversation,
    onlineUsers,
    unreadCounts,
    clearUnread,
  } = useChatStore();

  const handleConversationClick = (conversation: Conversation) => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile, navigate to the conversation route

      setActiveConversation(conversation);
      navigate(`/chat/${conversation._id}`);
    } else {
      // On desktop, just set active conversation if it's not already active
      if (activeConversation?._id !== conversation._id) {
        setActiveConversation(conversation);
      }
    }

    // Clear unread on open
    clearUnread(conversation._id);
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
      <div className="flex flex-col items-center justify-center p-8 md:p-8 px-6 text-center">
        <div className="md:w-20 md:h-20 w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 md:mb-4">
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

  // Sort: pinned first by pinnedAt desc, then by updatedAt desc
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = a.pinnedAt ? 1 : 0;
    const bPinned = b.pinnedAt ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    const aTime = (
      a.pinnedAt ? new Date(a.pinnedAt) : new Date(a.updatedAt)
    ).getTime();
    const bTime = (
      b.pinnedAt ? new Date(b.pinnedAt) : new Date(b.updatedAt)
    ).getTime();
    return bTime - aTime;
  });

  return (
    <div className="space-y-2 md:space-y-1 p-4 md:p-2">
      {sortedConversations.map((conversation) => {
        const { name, avatar, isOnline, isAI } =
          getConversationInfo(conversation);
        const isActive = activeConversation?._id === conversation._id;

        return (
          <button
            key={conversation._id}
            type="button"
            onClick={() => handleConversationClick(conversation)}
            className={`z-0 relative w-full md:p-4 p-2.5 rounded-xl md:rounded-lg text-left transition-colors touch-manipulation ${
              isActive
                ? "bg-primary text-white shadow-md"
                : "hover:bg-muted active:bg-muted/80"
            } ${conversation.pinnedAt ? "border" : ""}`}
          >
            <Pin
              fill="currentColor"
              className={`z-10 rotate-30 absolute -top-1 -right-1 md:w-5 md:h-5 w-4 h-4 text-yellow-500  ${
                conversation.pinnedAt ? "opacity-100" : "opacity-0"
              }`}
            />
            <div className="flex items-center space-x-2.5 md:space-x-4">
              {/* Avatar */}
              <div className="relative">
                <div
                  className={`md:w-14 md:h-14 w-12 h-12 rounded-full flex items-center justify-center border ${
                    isAI
                      ? "bg-gradient-to-br from-purple-500 to-blue-600"
                      : avatar
                      ? "bg-cover bg-center"
                      : "bg-primary"
                  }`}
                >
                  {isAI ? (
                    <Bot className="md:w-7 md:h-7 w-5.5 h-5.5 text-white" />
                  ) : avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium md:text-xl text-lg">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Online indicator */}
                {isOnline && !isAI && (
                  <div className="absolute -bottom-1 -right-1 md:w-5 md:h-5 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                )}

                {/* AI indicator */}
                {isAI && (
                  <div className="absolute -bottom-1 -right-1 md:w-5 md:h-5 w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-600 border-2 border-background rounded-full flex items-center justify-center">
                    <div className="absolute bottom-0.5 right-0.5 w-2 h-2  bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between md:mb-2 mb-1">
                  <h3
                    className={`md:font-semibold font-medium md:text-base text-sm truncate ${
                      isActive ? "text-white" : "text-foreground"
                    }`}
                  >
                    {name}
                    {conversation.isGroup && (
                      <span className="ml-1 md:text-sm text-xs opacity-75">
                        ({conversation.participants.length})
                      </span>
                    )}
                  </h3>
                  {conversation.lastMessage && (
                    <span
                      className={`md:text-sm text-xs md:font-medium font-normal ${
                        isActive ? "text-muted" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(conversation.updatedAt)}
                    </span>
                  )}
                </div>

                <p
                  className={`md:text-sm text-sm truncate leading-relaxed ${
                    isActive ? "text-muted" : "text-muted-foreground"
                  }`}
                >
                  {formatLastMessage(conversation)}
                  {unreadCounts[conversation._id] > 0 && (
                    <span
                      className={`${
                        isActive ? "text-muted" : "text-foreground"
                      } font-medium`}
                    >
                      {" "}
                      ({unreadCounts[conversation._id]})
                    </span>
                  )}
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
