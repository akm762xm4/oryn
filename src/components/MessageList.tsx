import { useEffect, useRef, useState, useCallback, memo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { useBackgroundStore } from "../stores/backgroundStore";
import { socketService } from "../lib/socket";
import { LoadingSpinner, AIGeneratingIndicator, DateSeparator } from "./ui";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { MessageListSkeleton } from "./skeletons/MessageSkeleton";
import api from "../lib/api";
import toast from "react-hot-toast";
import type { Message } from "../types";

const MessageList = memo(function MessageList() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  const previousMessageCountRef = useRef(0);
  const typingRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuthStore();
  const {
    activeConversation,
    messages,
    setMessages,
    typingUsers,
    aiGenerating,
  } = useChatStore();
  const { getCurrentBackground } = useBackgroundStore();

  const currentBackground = getCurrentBackground();
  const isTheme = (currentBackground as any).isTheme;
  const themeGradient = (currentBackground as any).gradient as
    | string
    | undefined;

  const loadMessages = useCallback(
    async (pageNum = 1) => {
      if (!activeConversation || isLoadingRef.current) return;

      isLoadingRef.current = true;
      setIsLoading(true);

      // Set initial loading state for first page
      if (pageNum === 1) {
        setIsInitialLoading(true);
      }

      try {
        // Use smaller limit for initial load (faster), larger for pagination
        const limit = pageNum === 1 ? 20 : 30;

        const response = await api.get(
          `/chat/conversations/${activeConversation._id}/messages?page=${pageNum}&limit=${limit}&sort=desc`
        );

        const messagesData: Message[] = response.data;

        if (pageNum === 1) {
          // For initial load, messages come newest first, so reverse them for display
          setMessages(messagesData.reverse());
          // Messages load naturally at bottom, no scrolling
        } else {
          const container = messagesContainerRef.current;
          const scrollHeightBefore = container ? container.scrollHeight : 0;
          const scrollTopBefore = container ? container.scrollTop : 0;

          // Ensure messagesData is always an array
          const safeMessages = Array.isArray(messagesData)
            ? [...messagesData].reverse()
            : [];

          setMessages((prev: Message[]) => {
            const newMessages: Message[] = [...safeMessages, ...prev];

            // Restore scroll position after React paints
            requestAnimationFrame(() => {
              if (container) {
                const scrollHeightAfter = container.scrollHeight;
                const heightDifference = scrollHeightAfter - scrollHeightBefore;
                container.scrollTop = scrollTopBefore + heightDifference;
              }
            });

            return newMessages;
          });
        }

        setHasMore(response.data.length === limit);
        setPage(pageNum);
      } catch {
        toast.error("Failed to load messages");
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
        if (pageNum === 1) {
          setIsInitialLoading(false);
        }
      }
    },
    [activeConversation, messages, setMessages]
  );

  useEffect(() => {
    if (activeConversation) {
      // Check if conversation changed
      const conversationChanged =
        currentConversationIdRef.current !== activeConversation._id;

      if (conversationChanged) {
        // Reset state when switching conversations
        setMessages([]); // clear old messages
        setPage(1);
        setHasMore(true);
        setIsUserScrolling(false);
        previousMessageCountRef.current = 0;
        currentConversationIdRef.current = activeConversation._id;

        loadMessages(1); // fetch fresh messages for new conversation
      }

      socketService.joinConversation(activeConversation._id);
    }

    return () => {
      if (activeConversation) {
        socketService.leaveConversation(activeConversation._id);
      }
      // Cleanup scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeConversation?._id]); // Only depend on conversation ID

  // Mark recent messages as read on view
  useEffect(() => {
    if (!activeConversation) return;
    const unread = messages.filter(
      (m) =>
        m.sender._id !== user?._id &&
        !(m.readBy || []).some((r) => r.user === (user?._id || ""))
    );
    // Limit to last few to avoid spam
    unread.slice(-10).forEach((m) => {
      socketService.markAsRead(activeConversation._id, m._id);
    });
  }, [activeConversation?._id, messages.length]);

  // Auto-scroll when typing indicator appears (if at bottom)
  useEffect(() => {
    const typingUsersInConv = getTypingUsersForConversation();

    if (typingUsersInConv.length > 0 && !isUserScrolling) {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [typingUsers, isUserScrolling]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    const currentMessageCount = messages.length;
    const previousMessageCount = previousMessageCountRef.current;

    // Scroll to bottom if:
    // 1. It's the initial load (previous count was 0)
    // 2. New messages were added (count increased and we're not loading older messages)
    if (previousMessageCount === 0 && currentMessageCount > 0) {
      // Initial load - scroll to bottom to show latest messages
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } else if (
      currentMessageCount > previousMessageCount &&
      (!isLoading || page === 1)
    ) {
      // New messages received - scroll to bottom
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }

    // Update the previous count
    previousMessageCountRef.current = currentMessageCount;
  }, [messages.length, isLoading, page]);

  // No auto-scrolling for typing indicator - it just appears at bottom

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      loadMessages(page + 1);
    }
  }, [hasMore, loadMessages, page]);

  // No scrollToBottom function needed - user controls all scrolling

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;

    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMore) {
      loadMoreMessages();
    }

    // Track user scrolling behavior
    setIsUserScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset scrolling state after user stops scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
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

  // Show loading skeleton for initial load
  if (isInitialLoading && messages.length === 0) {
    return <MessageListSkeleton />;
  }

  // Empty state
  if (messages.length === 0 && !isInitialLoading) {
    return (
      <div
        className={`flex flex-1 items-center justify-center md:p-8 p-10 ${
          currentBackground.isImage
            ? ""
            : isTheme
            ? ""
            : currentBackground.value
        }`}
        style={
          currentBackground.isImage
            ? {
                backgroundImage: currentBackground.value,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
              }
            : isTheme && themeGradient
            ? {
                backgroundImage: themeGradient,
              }
            : {}
        }
      >
        <div className="text-center max-w-md ">
          <img
            className="w-[80%] mx-auto"
            src="/EmptyMsgState.png"
            alt="Empty Message State"
          />
          <h3 className="md:text-xl text-lg font-semibold text-secondary-foreground/90 mb-2">
            No messages yet
          </h3>
          <p className="md:text-sm text-xs text-secondary-foreground/70">
            Say hello to start the conversation. Your messages will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className={`relative flex flex-col flex-1 overflow-y-auto md:p-4 p-2 md:space-y-4 space-y-2 ${
        currentBackground.isImage ? "" : isTheme ? "" : currentBackground.value
      }`}
      style={
        currentBackground.isImage
          ? {
              backgroundImage: currentBackground.value,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
            }
          : isTheme && themeGradient
          ? {
              backgroundImage: themeGradient,
            }
          : {}
      }
      onScroll={handleScroll}
    >
      {/* Grain overlay for themed gradients */}
      {isTheme && (
        <div className="pointer-events-none absolute inset-0 grain-overlay" />
      )}
      {/* Load more indicator */}
      {isLoading && page > 1 && (
        <div className="text-center py-2">
          <LoadingSpinner />
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
          <div key={message._id} id={`message-${message._id}`}>
            {/* Date separator */}
            {showDateSeparator && (
              <DateSeparator>
                {formatDateSeparator(new Date(message.createdAt))}
              </DateSeparator>
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

      {/* AI generating indicator */}
      {aiGenerating && <AIGeneratingIndicator />}

      {/* Typing indicator */}
      <div ref={typingRef}>
        <TypingIndicator users={getTypingUsersForConversation()} />
      </div>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;
