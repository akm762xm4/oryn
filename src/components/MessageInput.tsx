import { useState, useRef, useEffect } from "react";
import Button from "./ui/Button";
import { Send, Image } from "lucide-react";
import { useChatStore } from "../stores/chatStore";
import { useAuthStore } from "../stores/authStore";
import { socketService } from "../lib/socket";
import api from "../lib/api";
import toast from "react-hot-toast";
import { usePreferencesStore } from "../stores/preferencesStore";
import { getCloudinaryThumbUrl } from "../lib/images";

export default function MessageInput() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { soundEnabled, vibrationEnabled } = usePreferencesStore();
  const { user } = useAuthStore();

  const {
    activeConversation,
    addMessage,
    updateMessage,
    setAiGenerating,
    replyTo,
    clearReplyTo,
    // isLoadingMessages
  } = useChatStore();

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    // Check if current conversation is with AI
    if (activeConversation) {
      const isAIConversation = activeConversation.participants.some(
        (p) => p._id === "ai-assistant" || p.username === "AI Assistant"
      );
      setIsAIMode(isAIConversation);
    }
  }, [activeConversation]);

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!activeConversation) return;

    // Send typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socketService.setTyping(activeConversation._id, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.setTyping(activeConversation._id, false);
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !message.trim() ||
      !activeConversation ||
      isSending
      // ||isLoadingMessages
    )
      return;

    const messageContent = message.trim();
    setMessage("");
    setIsSending(true);

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      socketService.setTyping(activeConversation._id, false);
    }

    try {
      if (isAIMode) {
        // Optimistically add user's message immediately
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
          _id: tempId,
          conversation: activeConversation._id,
          sender: user || { _id: "me" },
          content: messageContent,
          messageType: "text" as const,
          status: "sent" as const,
          readBy: [],
          isAI: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
        addMessage(optimisticMessage);

        // Show AI generating state
        setAiGenerating(true);

        // Send message to AI conversation via API
        const response = await api.post("/chat/messages", {
          conversationId: activeConversation._id,
          content: messageContent,
          messageType: "text",
          replyTo: typeof replyTo === "string" ? replyTo : replyTo?._id,
        });

        // Replace optimistic user message if server returned it
        if (response.data.userMessage) {
          updateMessage(tempId, response.data.userMessage);
          addMessage(response.data.aiMessage);
        } else {
          // If API returns a single combined message, append it (AI response will come via socket or payload)
          addMessage(response.data);
        }

        setAiGenerating(false);
      } else {
        // Optimistic add for non-AI: insert temp message so reply preview shows instantly
        const tempId = `temp-${Date.now()}`;
        addMessage({
          _id: tempId,
          conversation: activeConversation._id,
          sender: user || ({ _id: "me" } as any),
          content: messageContent,
          messageType: "text" as const,
          status: "sent" as const,
          readBy: [],
          isAI: false,
          replyTo:
            typeof replyTo === "string"
              ? (replyTo as any)
              : replyTo
              ? {
                  _id: (replyTo as any)._id,
                  content: (replyTo as any).content,
                  messageType: (replyTo as any).messageType,
                  imageUrl: (replyTo as any).imageUrl,
                  sender: (replyTo as any).sender,
                }
              : null,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
        } as any);

        // Send regular message via socket; server will broadcast enriched message
        socketService.sendMessage({
          conversationId: activeConversation._id,
          content: messageContent,
          messageType: "text" as const,
          replyTo:
            typeof replyTo === "string" ? replyTo : (replyTo as any)?._id,
        });
      }
      // Clear reply state on successful send
      if (replyTo) clearReplyTo();
      // Clear reply state on successful send
      if (replyTo) clearReplyTo();

      // Feedback
      if (soundEnabled) {
        const ctx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(880, ctx.currentTime);
        g.gain.setValueAtTime(0.05, ctx.currentTime);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.05);
      }
      if (vibrationEnabled && navigator.vibrate) navigator.vibrate(20);
    } catch {
      toast.error("Failed to send message");
      setMessage(messageContent); // Restore message on error
      setAiGenerating(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setIsSending(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", file);
      formData.append("conversationId", activeConversation._id);

      // Upload image (you'll need to implement this endpoint)
      const response = await api.post("/chat/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Optimistic add for image message as well
      const tempId = `temp-${Date.now()}`;
      addMessage({
        _id: tempId,
        conversation: activeConversation._id,
        sender: user || ({ _id: "me" } as any),
        content: "",
        messageType: "image" as const,
        imageUrl: response.data.imageUrl,
        status: "sent" as const,
        readBy: [],
        isAI: false,
        replyTo:
          typeof replyTo === "string"
            ? (replyTo as any)
            : replyTo
            ? {
                _id: (replyTo as any)._id,
                content: (replyTo as any).content,
                messageType: (replyTo as any).messageType,
                imageUrl: (replyTo as any).imageUrl,
                sender: (replyTo as any).sender,
              }
            : null,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      } as any);

      // Send image message via socket
      socketService.sendMessage({
        conversationId: activeConversation._id,
        content: "",
        messageType: "image",
        imageUrl: response.data.imageUrl,
        replyTo: typeof replyTo === "string" ? replyTo : (replyTo as any)?._id,
      });

      toast.success("Image sent successfully");
      if (replyTo) clearReplyTo();
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsSending(false);
    }

    // Reset file input
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!activeConversation) return null;

  return (
    <div className="border-t border-border bg-background p-2  sticky bottom-0 left-0 w-full z-20">
      {/* Hide reply preview in AI conversations */}
      {replyTo && !isAIMode && (
        <div className="mx-1 mb-2 p-2 rounded-lg bg-muted text-xs flex items-start justify-between border-l-2 border-primary/60">
          <div className="flex items-start gap-2 pr-2 min-w-0">
            {((replyTo as any).imageUrl ||
              (replyTo as any).messageType === "image") && (
              <img
                src={getCloudinaryThumbUrl((replyTo as any).imageUrl)}
                alt="reply preview"
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="font-medium truncate">
                {replyTo.sender?.username}
              </div>
              <div className="opacity-80 truncate">
                {(replyTo as any).messageType === "image"
                  ? replyTo.content?.trim()
                    ? replyTo.content.slice(0, 120)
                    : "Photo"
                  : replyTo.content?.slice(0, 120)}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-2 px-2"
            onClick={clearReplyTo}
            aria-label="Cancel reply"
            title="Cancel reply"
          >
            ✕
          </Button>
        </div>
      )}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 md:gap-3   rounded-lg"
      >
        {/* Image upload */}
        {!isAIMode && (
          <div className="flex">
            <label
              className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-colors touch-manipulation ${
                isSending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-muted active:bg-muted/80 cursor-pointer"
              }`}
            >
              <Image className="w-6 h-6 md:w-7 md:h-7 text-muted-foreground" />
              <input
                title="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isSending}
              />
            </label>
          </div>
        )}

        {/* Message input */}
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAIMode ? "Ask AI anything..." : "Type a message..."}
          className="flex-1 px-4 md:px-5 py-2.5 md:py-3 text-sm md:text-base bg-muted rounded-2xl md:rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary resize-none min-h-[44px] md:min-h-[48px] max-h-32 overflow-hidden touch-manipulation"
          rows={1}
          disabled={isSending}
        />

        {/* Send button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-shrink-0 p-3 md:p-4 rounded-full shadow-md"
          disabled={!message.trim() || isSending}
          isLoading={isSending}
        >
          {!isSending && <Send className="w-5 h-5 md:w-6 md:h-6" />}
        </Button>
      </form>

      {/* AI mode notice */}
      {isAIMode && (
        <div className="mt-1 text-xs md:text-sm text-muted-foreground text-center">
          🤖 You're chatting with AI Assistant
        </div>
      )}
    </div>
  );
}
