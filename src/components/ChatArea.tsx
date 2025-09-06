import { useChatStore } from "../stores/chatStore";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useEffect, useState } from "react";
import { socketService } from "../lib/socket";

interface ChatAreaProps {
  showBackButton?: boolean;
}

export default function ChatArea({ showBackButton = false }: ChatAreaProps) {
  const [showMedia, setShowMedia] = useState(false);
  const { messages } = useChatStore();

  useEffect(() => {
    const handler = () => setShowMedia(true);
    window.addEventListener("open-view-media", handler as EventListener);
    return () =>
      window.removeEventListener("open-view-media", handler as EventListener);
  }, []);
  const { activeConversation } = useChatStore();

  useEffect(() => {
    if (!activeConversation) return;

    socketService.joinConversation(activeConversation._id);

    return () => {
      socketService.leaveConversation(activeConversation._id);
    };
  }, [activeConversation?._id]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-8 md:space-y-6 px-6 md:px-4">
          <div className="flex justify-center">
            <img
              className="h-28 md:h-24 w-auto object-contain"
              src="/Oryn Full.png"
              alt="Oryn Logo"
            />
          </div>
          <div className="space-y-4 md:space-y-3">
            <h2 className="text-4xl md:text-3xl font-bold text-foreground">
              Welcome to Oryn
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-xl md:text-lg leading-relaxed">
              Your intelligent conversation companion is ready to help. Select a
              conversation from the sidebar to continue, or start a new chat to
              begin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-base md:text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 md:w-2 md:h-2 bg-green-500 rounded-full"></div>
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
      {showMedia && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowMedia(false)}
        >
          <div
            className="bg-background rounded-2xl p-4 max-w-3xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-3">Media & Files</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {messages
                .filter((m) => m.messageType === "image" && m.imageUrl)
                .map((m) => (
                  <img
                    key={m._id}
                    src={m.imageUrl!}
                    alt="media"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ))}
              {messages.filter((m) => m.messageType === "image" && m.imageUrl)
                .length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No media yet in this chat.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
