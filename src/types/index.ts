export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: Date;
  isVerified: boolean;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  messageType: "text" | "image" | "ai";
  imageUrl?: string;
  status: "sent" | "delivered" | "read";
  readBy: Array<{
    user: string;
    readAt: Date;
  }>;
  isAI: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  _id: string;
  participants: User[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  admin?: string;
  lastMessage?: Message;
  pinnedAt?: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, remember?: boolean) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>;
  isLoadingConversations: boolean;
  aiGenerating: boolean;
  unreadCounts: Record<string, number>;
  // isLoadingMessages: boolean;
  setConversations: (
    conversationsOrUpdater:
      | Conversation[]
      | ((conversations: Conversation[]) => Conversation[])
  ) => void;
  toggleConversationPin: (conversationId: string) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setUserTyping: (
    conversationId: string,
    userId: string,
    username: string
  ) => void;
  removeUserTyping: (conversationId: string, userId: string) => void;
  updateUserInMessages: (userId: string, updates: Partial<User>) => void;
  setLoadingConversations: (isLoading: boolean) => void;
  setAiGenerating: (isGenerating: boolean) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  // setLoadingMessages: (isLoading: boolean) => void;
}
