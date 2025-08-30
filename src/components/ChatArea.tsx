import { useChatStore } from "../stores/chatStore";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface ChatAreaProps {
  showBackButton?: boolean;
}

export default function ChatArea({ showBackButton = false }: ChatAreaProps) {
  const { activeConversation } = useChatStore();

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-6 px-4">
          <div className="flex justify-center">
            <img
              className="h-24 w-auto object-contain"
              src="./Oryn Full.png"
              alt="Oryn Logo"
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome to Oryn
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
              Your intelligent conversation companion is ready to help. Select a
              conversation from the sidebar to continue, or start a new chat to
              begin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Ready to chat
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <ChatHeader showBackButton={showBackButton} />
      <MessageList />
      <MessageInput />
    </div>
  );
}
