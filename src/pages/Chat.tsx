import { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
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
    try {
      const response = await api.get("/chat/conversations");
      setConversations(response.data);
    } catch {
      toast.error("Failed to load conversations");
    }
  }, [setConversations]);

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
      addMessage(
        message as {
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
        }
      );
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
  ]);

  // Mobile: Show only ChatArea when conversation is selected
  const showMobileChat = isMobile && conversationId && activeConversation;

  return (
    <div className="h-screen bg-background flex">
      {/* Desktop: Always show both sidebar and chat area */}
      {!isMobile && (
        <>
          <Sidebar />
          <ChatArea />
        </>
      )}

      {/* Mobile: Show sidebar (conversation list) when no conversation selected */}
      {isMobile && !conversationId && <Sidebar />}

      {/* Mobile: Show chat area when conversation is selected */}
      {showMobileChat && <ChatArea showBackButton={true} />}
    </div>
  );
}
