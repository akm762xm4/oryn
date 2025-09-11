import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;

    this.socket = io(
      import.meta.env.DEV
        ? "http://localhost:5000"
        : import.meta.env.VITE_API_URL?.replace("/api", "") ||
            "http://localhost:5000",
      {
        auth: {
          token: this.token,
        },
        transports: ["polling", "websocket"],
      }
    );

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // Message methods
  sendMessage(data: {
    conversationId: string;
    content: string;
    messageType?: string;
    imageUrl?: string;
    replyTo?: string;
  }) {
    this.socket?.emit("sendMessage", data);
  }

  toggleReaction(messageId: string, emoji: string) {
    this.socket?.emit("toggleReaction", { messageId, emoji });
  }

  joinConversation(conversationId: string) {
    this.socket?.emit("joinConversation", conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("leaveConversation", conversationId);
  }

  // Typing indicators
  setTyping(conversationId: string, isTyping: boolean) {
    console.log("🔄 Sending typing:", { conversationId, isTyping });
    this.socket?.emit("typing", { conversationId, isTyping });
  }

  // Message status
  markAsRead(conversationId: string, messageId: string) {
    this.socket?.emit("markAsRead", { conversationId, messageId });
  }

  onMessageDelivered(
    callback: (data: { messageId: string; deliveredAt: Date }) => void
  ) {
    this.socket?.on("messageDelivered", callback);
  }

  onMessageRead(
    callback: (data: {
      messageId: string;
      readBy: string;
      readAt: Date;
    }) => void
  ) {
    this.socket?.on("messageRead", callback);
  }

  onReactionUpdated(
    callback: (data: {
      messageId: string;
      reactions: Array<{ emoji: string; users: string[] }>;
    }) => void
  ) {
    this.socket?.on("reactionUpdated", callback);
  }

  // Event listeners
  onNewMessage(callback: (message: unknown) => void) {
    this.socket?.on("newMessage", callback);
  }

  onUserTyping(
    callback: (data: {
      userId: string;
      username: string;
      isTyping: boolean;
    }) => void
  ) {
    this.socket?.on("userTyping", callback);
  }

  onUserOnline(callback: (data: { userId: string; username: string }) => void) {
    this.socket?.on("userOnline", callback);
  }

  onUserOffline(
    callback: (data: {
      userId: string;
      username: string;
      lastSeen: Date;
    }) => void
  ) {
    this.socket?.on("userOffline", callback);
  }

  onError(callback: (error: { message: string }) => void) {
    this.socket?.on("error", callback);
  }

  // Conversation events
  onConversationAdded(callback: (conversation: unknown) => void) {
    this.socket?.on("conversationAdded", callback);
  }

  onConversationClearedUnread(
    callback: (data: { conversationId: string }) => void
  ) {
    this.socket?.on("conversationClearedUnread", callback);
  }

  onConversationUpdated(callback: (conversation: unknown) => void) {
    this.socket?.on("conversationUpdated", callback);
  }

  // Profile update listeners
  onAvatarUpdated(
    callback: (data: {
      userId: string;
      username: string;
      avatar: string;
    }) => void
  ) {
    this.socket?.on("avatarUpdated", callback);
  }

  onProfileUpdated(
    callback: (data: {
      userId: string;
      username: string;
      email: string;
      avatar: string;
    }) => void
  ) {
    this.socket?.on("profileUpdated", callback);
  }

  // Remove listeners
  off(event: string, callback?: (...args: unknown[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
