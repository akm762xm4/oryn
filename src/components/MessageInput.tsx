import { useState, useRef, useEffect } from "react";
import { Send, Image } from "lucide-react";
import { useChatStore } from "../stores/chatStore";
import { socketService } from "../lib/socket";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function MessageInput() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    activeConversation,
    addMessage,
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
        // Send message to AI conversation via API (will auto-generate AI response)
        const response = await api.post("/chat/messages", {
          conversationId: activeConversation._id,
          content: messageContent,
          messageType: "text",
        });

        // Handle response - could be single message or both user + AI message
        if (response.data.userMessage && response.data.aiMessage) {
          addMessage(response.data.userMessage);
          addMessage(response.data.aiMessage);
        } else {
          addMessage(response.data);
        }
      } else {
        // Send regular message via socket
        socketService.sendMessage({
          conversationId: activeConversation._id,
          content: messageContent,
          messageType: "text",
        });
      }
    } catch {
      toast.error("Failed to send message");
      setMessage(messageContent); // Restore message on error
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

      // Send image message via socket
      socketService.sendMessage({
        conversationId: activeConversation._id,
        content: "",
        messageType: "image",
        imageUrl: response.data.imageUrl,
      });

      toast.success("Image sent successfully");
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
    <div className="border-t border-border p-4 md:p-4 px-6 md:px-4 bg-background">
      <form
        onSubmit={handleSendMessage}
        className="flex items-end space-x-3 md:space-x-3"
      >
        {/* Image upload */}
        {!isAIMode && (
          <div className="flex space-x-2">
            <label
              className={`p-3 md:p-2 rounded-xl md:rounded-lg transition-colors touch-manipulation ${
                // isLoadingMessages ||
                isSending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-muted active:bg-muted/80 cursor-pointer"
              }`}
            >
              <Image className="w-7 h-7 md:w-6 md:h-6 text-muted-foreground" />
              <input
                title="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={
                  isSending
                  // || isLoadingMessages
                }
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
          className="flex-1 px-5 md:px-4 py-4 md:py-3 text-base md:text-sm bg-muted rounded-3xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary resize-none min-h-[52px] md:min-h-[48px] max-h-32 overflow-hidden touch-manipulation"
          rows={1}
          disabled={
            isSending
            // || isLoadingMessages
          }
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={
            !message.trim() || isSending
            // || isLoadingMessages
          }
          className="p-4 md:p-3 bg-primary text-white rounded-full hover:bg-primary/90 active:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation shadow-md"
        >
          {isSending ? (
            <div className="w-6 h-6 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-6 h-6 md:w-5 md:h-5" />
          )}
        </button>
      </form>

      {/* AI mode notice */}
      {isAIMode && (
        <div className="mt-3 md:mt-2 text-sm md:text-xs text-muted-foreground text-center">
          🤖 You're chatting with AI Assistant
        </div>
      )}
    </div>
  );
}
