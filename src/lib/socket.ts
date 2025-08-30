import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;

    this.socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      // Connected to server
    });

    this.socket.on("disconnect", () => {
      // Disconnected from server
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
  }) {
    this.socket?.emit("sendMessage", data);
  }

  joinConversation(conversationId: string) {
    this.socket?.emit("joinConversation", conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("leaveConversation", conversationId);
  }

  // Typing indicators
  setTyping(conversationId: string, isTyping: boolean) {
    this.socket?.emit("typing", { conversationId, isTyping });
  }

  // Message status
  markAsRead(conversationId: string, messageId: string) {
    this.socket?.emit("markAsRead", { conversationId, messageId });
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

  onMessageRead(
    callback: (data: {
      messageId: string;
      readBy: string;
      readAt: Date;
    }) => void
  ) {
    this.socket?.on("messageRead", callback);
  }

  onError(callback: (error: { message: string }) => void) {
    this.socket?.on("error", callback);
  }

  // Remove listeners
  off(event: string, callback?: (...args: unknown[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
