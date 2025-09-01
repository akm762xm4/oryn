import { create } from "zustand";
import type { ChatState } from "../types";

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: new Map(),
  isLoadingConversations: false,
  // isLoadingMessages: false,

  setConversations: (conversations) => set({ conversations }),

  setLoadingConversations: (isLoading: boolean) =>
    set({ isLoadingConversations: isLoading }),

  // setLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),

  setActiveConversation: (conversation) =>
    set({
      activeConversation: conversation,
      messages: [], // Clear messages when switching conversations
    }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      conversations: state.conversations.map((conv) =>
        conv._id === message.conversation
          ? { ...conv, lastMessage: message, updatedAt: new Date() }
          : conv
      ),
    })),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  setUserOnline: (userId) =>
    set((state) => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    })),

  setUserOffline: (userId) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    }),

  setUserTyping: (conversationId, userId, username) =>
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      newTypingUsers.set(`${conversationId}-${userId}`, username);
      return { typingUsers: newTypingUsers };
    }),

  removeUserTyping: (conversationId, userId) =>
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      newTypingUsers.delete(`${conversationId}-${userId}`);
      return { typingUsers: newTypingUsers };
    }),

  updateUserInMessages: (userId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.sender._id === userId
          ? { ...msg, sender: { ...msg.sender, ...updates } }
          : msg
      ),
      conversations: state.conversations.map((conv) => ({
        ...conv,
        participants: conv.participants.map((participant) =>
          participant._id === userId
            ? { ...participant, ...updates }
            : participant
        ),
      })),
    })),
}));
