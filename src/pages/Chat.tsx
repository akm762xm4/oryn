import { useEffect, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { socketService } from "../lib/socket";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function Chat() {
  const { user, token } = useAuthStore();
  const {
    setConversations,
    addMessage,
    setUserOnline,
    setUserOffline,
    setUserTyping,
    removeUserTyping,
    updateMessage,
  } = useChatStore();

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get("/chat/conversations");
      setConversations(response.data);
    } catch {
      toast.error("Failed to load conversations");
    }
  }, [setConversations]);

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
      if (isTyping) {
        setUserTyping("current", userId, username);
      } else {
        removeUserTyping("current", userId);
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

    return () => {
      socketService.disconnect();
    };
  }, [
    token,
    user,
    loadConversations,
    addMessage,
    setUserOnline,
    setUserOffline,
    setUserTyping,
    removeUserTyping,
    updateMessage,
  ]);

  return (
    <div className="h-screen bg-background flex">
      <Sidebar />
      <ChatArea />
    </div>
  );
}
