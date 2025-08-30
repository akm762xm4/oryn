import { useChatStore } from "../stores/chatStore";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { MessageCircle } from "lucide-react";

export default function ChatArea() {
  const { activeConversation } = useChatStore();

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 mx-auto">
            <MessageCircle className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Welcome to Chat App
          </h2>
          <p className="text-muted-foreground max-w-md">
            Select a conversation from the sidebar to start chatting, or create
            a new one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </div>
  );
}
