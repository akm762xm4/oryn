import { useEffect, useState } from "react";
import { useChatStore } from "../stores/chatStore";
import { socketService } from "../lib/socket";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import MediaModal from "./MediaModal";
import AboutModal from "./AboutModal";
import GroupInfoModal from "./GroupInfoModal";
import { MessageCircle, Bot, Users } from "lucide-react";

interface ChatAreaProps {
  showBackButton?: boolean;
}

export default function ChatArea({ showBackButton = false }: ChatAreaProps) {
  const [showMedia, setShowMedia] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const { activeConversation } = useChatStore();

  useEffect(() => {
    const h1 = () => setShowMedia(true);
    const h2 = () => setShowAbout(true);
    const h3 = () => setShowGroupInfo(true);
    window.addEventListener("open-view-media", h1 as EventListener);
    window.addEventListener("open-about", h2 as EventListener);
    window.addEventListener("open-group-info", h3 as EventListener);
    return () => {
      window.removeEventListener("open-view-media", h1 as EventListener);
      window.removeEventListener("open-about", h2 as EventListener);
      window.removeEventListener("open-group-info", h3 as EventListener);
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
      <div className="flex-1 flex items-center justify-center bg-background overflow-hidden relative">
        {/* Subtle background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, hsl(24 95% 53% / 0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center px-6 max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src="/oryn-wordmark.svg"
                alt="Oryn"
                className="h-20 w-auto"
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">
            Welcome to Oryn
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
            Your intelligent conversation companion. Select an existing
            conversation or start something new.
          </p>

          {/* Feature hints */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: MessageCircle, label: "Start a chat" },
              { icon: Bot, label: "Ask AI" },
              { icon: Users, label: "Create group" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Ready to chat
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
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
