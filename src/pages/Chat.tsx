import { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import { socketService } from "../lib/socket";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, token, updateUser } = useAuthStore();
  const {
    conversations,
    activeConversation,
    setConversations,
    setActiveConversation,
    addMessage,
    clearReplyTo,
    setUserOnline,
    setUserOffline,
    setUserTyping,
    removeUserTyping,
    updateMessage,
    updateUserInMessages,
    setLoadingConversations,
  } = useChatStore();

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const response = await api.get("/chat/conversations");
      setConversations(response.data);
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, [setConversations, setLoadingConversations]);

  // Handle mobile conversation selection
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find((c) => c._id === conversationId);
      if (conversation) {
        setActiveConversation(conversation);
        // If switching to AI conversation, clear any pending reply state
        if (
          conversation.participants.some(
            (p: any) =>
              p._id === "ai-assistant" || p.username === "AI Assistant"
          )
        ) {
          clearReplyTo();
        }
      } else {
        // Conversation not found, redirect to chat home
        navigate("/chat");
      }
    }
  }, [conversationId, conversations, setActiveConversation, navigate]);

  useEffect(() => {
    if (!token || !user) return;

    // Connect to socket
    socketService.connect(token);

    // Load initial conversations
    loadConversations();

    // Socket event listeners
    socketService.onNewMessage((message) => {
      let typedMessage = message as {
        _id: string;
        conversation: string;
        sender: {
          _id: string;
          username: string;
          email: string;
          avatar: string;
          isOnline: boolean;
          lastSeen: Date;
          isVerified: boolean;
        };
        content: string;
        messageType: "text" | "image" | "ai";
        imageUrl?: string;
        status: "sent" | "delivered" | "read";
        readBy: { user: string; readAt: Date }[];
        isAI: boolean;
        replyTo?:
          | {
              _id: string;
              content: string;
              sender: { _id: string; username: string };
            }
          | string
          | null;
        reactions?: Array<{ emoji: string; users: string[] }>;
        createdAt: Date;
        updatedAt: Date;
      };

      // Ensure replyTo is populated client-side if server sent only an id
      const stateSnapshot = useChatStore.getState();
      if (typedMessage.replyTo && typeof typedMessage.replyTo === "string") {
        const referenced = stateSnapshot.messages.find(
          (m) => m._id === (typedMessage.replyTo as unknown as string)
        );
        if (referenced) {
          typedMessage = {
            ...(typedMessage as any),
            replyTo: {
              _id: referenced._id,
              content: referenced.content,
              messageType: referenced.messageType as any,
              imageUrl: referenced.imageUrl,
              sender: {
                _id: referenced.sender._id,
                username: referenced.sender.username,
              },
            },
          } as any;
        }
      }

      useChatStore.setState((state) => {
        const exists = state.messages.find((m) => m._id === typedMessage._id);
        if (exists) {
          return {
            messages: state.messages.map((m) =>
              m._id === typedMessage._id ? (typedMessage as any) : m
            ),
          } as any;
        }

        const optimistic = state.messages.find(
          (m) => m._id.startsWith("temp-") && m.content === typedMessage.content
        );
        if (optimistic) {
          // If server reply lacks populated replyTo but optimistic had it, preserve it
          const merged = {
            ...(typedMessage as any),
            replyTo:
              (typeof (typedMessage as any).replyTo === "string" ||
                !(typedMessage as any).replyTo) &&
              optimistic.replyTo
                ? optimistic.replyTo
                : (typedMessage as any).replyTo,
          };
          return {
            messages: state.messages.map((m) =>
              m._id === optimistic._id ? (merged as any) : m
            ),
          } as any;
        }

        return { messages: [...state.messages, typedMessage as any] } as any;
      });

      // Update conversation ordering by bringing the convo to top
      setConversations((prev) => {
        const next = prev.map((c) =>
          c._id === typedMessage.conversation
            ? {
                ...c,
                lastMessage: typedMessage,
                updatedAt: new Date() as any,
              }
            : c
        );
        return [...next].sort((a: any, b: any) => {
          const aPinned = a.pinnedAt ? 1 : 0;
          const bPinned = b.pinnedAt ? 1 : 0;
          if (aPinned !== bPinned) return bPinned - aPinned;
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
      });

      // If not the active conversation and not sent by me, increment unread
      const { activeConversation, incrementUnread } = useChatStore.getState();
      if (
        (!activeConversation ||
          activeConversation._id !== typedMessage.conversation) &&
        typedMessage.sender._id !== user?._id
      ) {
        incrementUnread(typedMessage.conversation);
      }

      // Feedback on receive only for messages not sent by current user
      try {
        if (typedMessage.sender._id !== user?._id) {
          const prefs = usePreferencesStore.getState();
          if (prefs.soundEnabled) {
            const ctx = new (window.AudioContext ||
              (window as any).webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(660, ctx.currentTime);
            g.gain.setValueAtTime(0.04, ctx.currentTime);
            o.connect(g).connect(ctx.destination);
            o.start();
            o.stop(ctx.currentTime + 0.05);
          }
          if (prefs.vibrationEnabled && navigator.vibrate)
            navigator.vibrate(15);
        }
      } catch {}
    });

    // Delivery lifecycle listeners
    socketService.onMessageDelivered(({ messageId, deliveredAt }) => {
      updateMessage(messageId, {
        status: "delivered",
        updatedAt: deliveredAt as any,
      });
    });

    socketService.onMessageRead(({ messageId, readBy, readAt }) => {
      updateMessage(messageId, {
        status: "read",
        readBy: [{ user: readBy, readAt }],
        updatedAt: readAt as any,
      });
    });

    // Reaction updates
    socketService.onReactionUpdated(({ messageId, reactions }) => {
      updateMessage(messageId, { reactions } as any);
    });

    socketService.onUserOnline(({ userId, username }) => {
      setUserOnline(userId);
      toast.success(`${username} is online`, { duration: 2000 });
    });

    socketService.onUserOffline(({ userId, username }) => {
      setUserOffline(userId);
      toast(`${username} went offline`, { duration: 2000 });
    });

    socketService.onUserTyping(({ userId, username, isTyping }) => {
      const { activeConversation } = useChatStore.getState();
      if (activeConversation && isTyping) {
        setUserTyping(activeConversation._id, userId, username);
      } else if (activeConversation) {
        removeUserTyping(activeConversation._id, userId);
      }
    });

    socketService.onMessageRead(({ messageId, readBy, readAt }) => {
      updateMessage(messageId, {
        readBy: [{ user: readBy, readAt }],
      });
    });

    socketService.onError((error: { message: string }) => {
      toast.error(error.message);
    });

    // Listen for real-time avatar updates
    socketService.onAvatarUpdated(({ userId, username, avatar }) => {
      // Update current user's avatar if it's their own update
      if (user && userId === user._id) {
        updateUser({ avatar });
        toast.success("Avatar updated successfully!");
      } else {
        // Show notification for other users' avatar updates
        toast(`${username} updated their profile picture`, { duration: 3000 });
      }

      // Update user avatar in all messages and conversations
      updateUserInMessages(userId, { avatar });

      // Reload conversations to update avatars in the sidebar
      loadConversations();
    });

    // Listen for real-time profile updates
    socketService.onProfileUpdated(({ userId, username, email, avatar }) => {
      // Update current user's profile if it's their own update
      if (user && userId === user._id) {
        updateUser({ username, email, avatar });
        toast.success("Profile updated successfully!");
      } else {
        // Show notification for other users' profile updates
        toast(`${username} updated their profile`, { duration: 3000 });
      }

      // Update user info in all messages and conversations
      updateUserInMessages(userId, { username, email, avatar });

      // Reload conversations to update user info in the sidebar
      loadConversations();
    });

    // Listen for being added to a new conversation/group
    socketService.onConversationAdded((conv) => {
      const conversation = conv as any;
      setConversations((prev: any) => {
        // avoid duplicates
        if (prev.some((c: any) => c._id === conversation._id)) return prev;
        return [conversation, ...prev];
      });
      toast.success(
        conversation.isGroup
          ? `Added to group: ${conversation.groupName || "Group"}`
          : "New conversation started",
        { duration: 2500 }
      );
    });

    // Listen for conversation updates (e.g., group rename)
    socketService.onConversationUpdated((conv) => {
      const updated = conv as any;
      setConversations((prev: any) =>
        prev.map((c: any) => (c._id === updated._id ? updated : c))
      );
    });

    // Clear unread from other sessions
    socketService.onConversationClearedUnread(({ conversationId }) => {
      const { clearUnread } = useChatStore.getState();
      clearUnread(conversationId);
    });

    return () => {
      socketService.disconnect();
    };
  }, [
    token,
    user,
    updateUser,
    loadConversations,
    addMessage,
    setUserOnline,
    setUserOffline,
    setUserTyping,
    removeUserTyping,
    updateMessage,
    updateUserInMessages,
    setLoadingConversations,
  ]);

  return (
    <div className="h-screen bg-background flex">
      {/* Show sidebar when: Desktop (always) OR Mobile (no conversation selected) */}
      {(!isMobile || (isMobile && !conversationId)) && <Sidebar />}

      {/* Show single ChatArea when: Desktop (always) OR Mobile (conversation selected) */}
      {(!isMobile || (isMobile && conversationId && activeConversation)) && (
        <ChatArea showBackButton={isMobile} />
      )}
    </div>
  );
}
