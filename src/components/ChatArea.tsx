import { useEffect, useState } from "react";
import { useChatStore } from "../stores/chatStore";
import { socketService } from "../lib/socket";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import MediaModal from "./MediaModal";
import AboutModal from "./AboutModal";
import GroupInfoModal from "./GroupInfoModal";

interface ChatAreaProps {
  showBackButton?: boolean;
}

export default function ChatArea({ showBackButton = false }: ChatAreaProps) {
  const [showMedia, setShowMedia] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const { activeConversation } = useChatStore();

  useEffect(() => {
    const handler = () => setShowMedia(true);
    const aboutHandler = () => setShowAbout(true);
    const groupInfoHandler = () => setShowGroupInfo(true);
    window.addEventListener("open-view-media", handler as EventListener);
    window.addEventListener("open-about", aboutHandler as EventListener);
    window.addEventListener(
      "open-group-info",
      groupInfoHandler as EventListener
    );
    return () => {
      window.removeEventListener("open-view-media", handler as EventListener);
      window.removeEventListener("open-about", aboutHandler as EventListener);
      window.removeEventListener(
        "open-group-info",
        groupInfoHandler as EventListener
      );
    };
  }, []);

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
        <div className="text-center md:space-y-8 space-y-6 md:px-6 px-4">
          <div className="flex justify-center">
            <img
              className="md:h-28 h-24 w-auto object-contain"
              src="/Oryn Full.png"
              alt="Oryn Logo"
            />
          </div>
          <div className="md:space-y-4 space-y-3">
            <h2 className="md:text-4xl text-3xl font-bold text-foreground">
              Welcome to Oryn
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto md:text-xl text-lg leading-relaxed">
              Your intelligent conversation companion is ready to help. Select a
              conversation from the sidebar to continue, or start a new chat to
              begin.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 justify-center items-center md:text-base text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="md:w-3 md:h-3 w-2 h-2 bg-green-500 rounded-full"></div>
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

      <MediaModal
        isOpen={showMedia}
        onClose={() => setShowMedia(false)}
        conversationId={activeConversation?._id || ""}
      />

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {(activeConversation as any)?.isGroup && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          conversation={activeConversation as any}
        />
      )}
    </div>
  );
}
