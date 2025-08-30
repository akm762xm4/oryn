import { useEffect, useRef, useState, useCallback, memo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { socketService } from "../lib/socket";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import api from "../lib/api";
import toast from "react-hot-toast";

const MessageList = memo(function MessageList() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const { user } = useAuthStore();
  const { activeConversation, messages, setMessages, typingUsers } =
    useChatStore();

  const loadMessages = useCallback(
    async (pageNum = 1) => {
      if (!activeConversation || isLoadingRef.current) return;

      isLoadingRef.current = true;
      setIsLoading(true);
      try {
        const response = await api.get(
          `/chat/conversations/${activeConversation._id}/messages?page=${pageNum}&limit=50`
        );

        if (pageNum === 1) {
          setMessages(response.data);
        } else {
          setMessages((prevMessages: any) => [
            ...response.data,
            ...prevMessages,
          ]);
        }

        setHasMore(response.data.length === 50);
        setPage(pageNum);
      } catch {
        toast.error("Failed to load messages");
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [activeConversation, setMessages]
  );

  useEffect(() => {
    if (activeConversation) {
      loadMessages();
      socketService.joinConversation(activeConversation._id);
    }

    return () => {
      if (activeConversation) {
        socketService.leaveConversation(activeConversation._id);
      }
    };
  }, [activeConversation, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      loadMessages(page + 1);
    }
  }, [hasMore, loadMessages, page]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const shouldShowDateSeparator = (
    currentMessage: { createdAt: string | Date },
    previousMessage: { createdAt: string | Date } | null
  ) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt);
    const previousDate = new Date(previousMessage.createdAt);

    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const getTypingUsersForConversation = () => {
    if (!activeConversation) return [];

    const typingInThisConv = [];
    for (const [key, username] of typingUsers.entries()) {
      if (key.startsWith(activeConversation._id)) {
        const userId = key.split("-")[1];
        if (userId !== user?._id) {
          typingInThisConv.push(username);
        }
      }
    }
    return typingInThisConv;
  };

  if (!activeConversation) return null;

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={(e) => {
        const { scrollTop } = e.currentTarget;
        if (scrollTop === 0 && hasMore) {
          loadMoreMessages();
        }
      }}
    >
      {/* Load more indicator */}
      {isLoading && page > 1 && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator = shouldShowDateSeparator(
          message,
          previousMessage
        );
        const isOwn = message.sender._id === user?._id;
        const showAvatar =
          !isOwn &&
          (!messages[index + 1] ||
            messages[index + 1].sender._id !== message.sender._id ||
            shouldShowDateSeparator(messages[index + 1], message));

        return (
          <div key={message._id}>
            {/* Date separator */}
            {showDateSeparator && (
              <div className="flex items-center justify-center my-6">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDateSeparator(new Date(message.createdAt))}
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            <MessageBubble
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
            />
          </div>
        );
      })}

      {/* Typing indicator */}
      <TypingIndicator users={getTypingUsersForConversation()} />

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;
