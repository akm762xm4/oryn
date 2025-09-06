import { create } from "zustand";
import type { ChatState } from "../types";

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: new Map(),
  isLoadingConversations: false,
  aiGenerating: false,
  unreadCounts: {},
  // isLoadingMessages: false,

  setConversations: (conversationsOrUpdater) =>
    set((state) => {
      const conversations =
        typeof conversationsOrUpdater === "function"
          ? conversationsOrUpdater(state.conversations)
          : conversationsOrUpdater;
      return { conversations };
    }),

  toggleConversationPin: (conversationId) =>
    set((state) => {
      const updatedConversations = state.conversations.map((conv) =>
        conv._id === conversationId
          ? {
              ...conv,
              pinnedAt: conv.pinnedAt ? null : new Date(),
            }
          : conv
      );
      let updatedActiveConversation = state.activeConversation;
      if (state.activeConversation?._id === conversationId) {
        const found = updatedConversations.find(
          (conv) => conv._id === conversationId
        );
        if (found) updatedActiveConversation = found;
      }
      return {
        conversations: updatedConversations,
        activeConversation: updatedActiveConversation,
      };
    }),

  setLoadingConversations: (isLoading: boolean) =>
    set({ isLoadingConversations: isLoading }),

  // setLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),

  setActiveConversation: (conversation) =>
    set((state) => {
      if (state.activeConversation?._id !== conversation?._id) {
        return { activeConversation: conversation, messages: [] };
      }
      return { activeConversation: conversation };
    }),

  setMessages: (messagesOrUpdater) =>
    set((state) => ({
      messages:
        typeof messagesOrUpdater === "function"
          ? messagesOrUpdater(state.messages)
          : messagesOrUpdater,
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      conversations: state.conversations.map((conv) =>
        conv._id === message.conversation
          ? { ...conv, lastMessage: message, updatedAt: new Date() }
          : conv
      ),
      unreadCounts:
        state.activeConversation &&
        state.activeConversation._id === message.conversation
          ? { ...state.unreadCounts, [message.conversation]: 0 }
          : {
              ...state.unreadCounts,
              [message.conversation]:
                (state.unreadCounts[message.conversation] || 0) + 1,
            },
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

  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    })),

  clearUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),

  setAiGenerating: (isGenerating: boolean) =>
    set({ aiGenerating: isGenerating }),
}));
