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
      setActiveConversation(conversation);
      navigate(`/chat/${conversation._id}`);
    } else {
      if (activeConversation?._id !== conversation._id) {
        setActiveConversation(conversation);
      }
    }
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

      const otherUser = conversation.participants.find((p) => p._id !== user?._id);

      if (!otherUser) {
        return { name: "AI Assistant", avatar: "", isOnline: false, isAI: true };
      }

      const isAI = otherUser._id === "ai-assistant" || otherUser.username === "AI Assistant";

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
    if (messageType === "ai" || isAI) return `AI: ${content}`;
    return content.length > 45 ? `${content.substring(0, 45)}…` : content;
  };

  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: false })
        .replace("about ", "")
        .replace(" minutes", "m")
        .replace(" minute", "m")
        .replace(" hours", "h")
        .replace(" hour", "h")
        .replace(" days", "d")
        .replace(" day", "d")
        .replace("less than a m", "<1m");
    } catch {
      return "";
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
          <Users className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
        <p className="text-xs text-muted-foreground">Start a new chat to begin messaging</p>
      </div>
    );
  }

  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = a.pinnedAt ? 1 : 0;
    const bPinned = b.pinnedAt ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    const aTime = (a.pinnedAt ? new Date(a.pinnedAt) : new Date(a.updatedAt)).getTime();
    const bTime = (b.pinnedAt ? new Date(b.pinnedAt) : new Date(b.updatedAt)).getTime();
    return bTime - aTime;
  });

  return (
    <div className="px-2 py-1">
      {sortedConversations.map((conversation) => {
        const { name, avatar, isOnline, isAI } = getConversationInfo(conversation);
        const isActive = activeConversation?._id === conversation._id;
        const unread = unreadCounts[conversation._id] || 0;

        return (
          <button
            key={conversation._id}
            type="button"
            onClick={() => handleConversationClick(conversation)}
            className={[
              "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 touch-manipulation mb-0.5",
              isActive
                ? "bg-primary shadow-sm"
                : "hover:bg-muted/70 active:bg-muted",
              conversation.pinnedAt ? "border border-border/60" : "",
            ].join(" ")}
          >
            {/* Pin badge */}
            {conversation.pinnedAt && (
              <Pin
                fill="currentColor"
                className={`absolute top-1.5 right-2 w-3 h-3 ${
                  isActive ? "text-primary-foreground/60" : "text-primary/60"
                }`}
              />
            )}

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className={[
                  "w-10 h-10 rounded-full flex items-center justify-center overflow-hidden text-sm font-semibold",
                  isAI
                    ? "bg-gradient-to-br from-violet-500 to-amber-400"
                    : avatar
                    ? ""
                    : isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/15 text-primary",
                ].join(" ")}
              >
                {isAI ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {/* Online dot */}
              {isOnline && !isAI && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
              )}
              {/* AI pulse */}
              {isAI && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full animate-pulse" />
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              {/* Row 1: name + time */}
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span
                  className={[
                    "text-sm font-semibold truncate leading-tight",
                    isActive ? "text-primary-foreground" : "text-foreground",
                  ].join(" ")}
                >
                  {name}
                  {conversation.isGroup && (
                    <span className="ml-1 text-xs font-normal opacity-60">
                      ({conversation.participants.length})
                    </span>
                  )}
                </span>
                {conversation.lastMessage && (
                  <span
                    className={[
                      "text-[10px] whitespace-nowrap flex-shrink-0 leading-tight",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {formatTime(conversation.updatedAt)}
                  </span>
                )}
              </div>

              {/* Row 2: last message + unread badge */}
              <div className="flex items-center justify-between gap-2">
                <p
                  className={[
                    "text-xs truncate leading-snug",
                    isActive ? "text-primary-foreground/75" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {formatLastMessage(conversation)}
                </p>
                {unread > 0 && (
                  <span
                    className={[
                      "flex-shrink-0 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full flex items-center justify-center text-[9px] font-bold",
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : "bg-primary text-primary-foreground",
                    ].join(" ")}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default ConversationList;
