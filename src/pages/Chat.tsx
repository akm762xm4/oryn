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
      const typedMessage = message as {
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
        createdAt: Date;
        updatedAt: Date;
      };

      // Check if message already exists to prevent duplicates
      const { messages } = useChatStore.getState();
      const messageExists = messages.some(
        (msg) => msg._id === typedMessage._id
      );

      if (!messageExists) {
        addMessage(typedMessage);

        // Feedback on receive
        try {
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
        } catch {}
      }
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
