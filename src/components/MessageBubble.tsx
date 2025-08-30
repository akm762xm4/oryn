import { memo } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Message } from "../types";
import { useAuthStore } from "../stores/authStore";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: MessageBubbleProps) {
  const { user } = useAuthStore();

  const formatTime = (date: Date) => {
    return format(new Date(date), "HH:mm");
  };

  const getMessageStatus = () => {
    if (!isOwn) return null;

    const isRead = message.readBy.some((read) => read.user !== user?._id);

    if (isRead) {
      return <CheckCheck className="w-4 h-4 text-accent" />;
    } else if (message.status === "delivered") {
      return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
    } else {
      return <Check className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isAI = message.isAI || message.messageType === "ai";

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`flex ${
          isOwn ? "flex-row-reverse" : "flex-row"
        } items-end space-x-2 max-w-[70%]`}
      >
        {/* Avatar */}
        {!isOwn && showAvatar && (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isAI
                ? "bg-gradient-to-br from-purple-500 to-blue-600"
                : "bg-primary"
            }`}
          >
            {isAI ? (
              <Bot className="w-4 h-4 text-white" />
            ) : message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-medium">
                {message.sender.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* Spacer when no avatar */}
        {!isOwn && !showAvatar && <div className="w-8" />}

        {/* Message bubble */}
        <div
          className={`message-bubble ${
            isOwn ? "message-sent" : "message-received"
          } ${isAI ? "border-2 border-accent/20" : ""}`}
        >
          {/* Sender name for group chats */}
          {!isOwn && showAvatar && (
            <div className="text-xs font-medium text-primary mb-1">
              {isAI ? "🤖 AI Assistant" : message.sender.username}
            </div>
          )}

          {/* Message content */}
          {message.messageType === "image" ? (
            <div className="space-y-2">
              {message.imageUrl && (
                <img
                  src={message.imageUrl}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg"
                />
              )}
              {message.content && <p className="text-sm">{message.content}</p>}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Render AI messages with markdown, regular messages as plain text */}
              {isAI ? (
                <div className="prose-ai">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              {/* AI indicator */}
              {isAI && (
                <div className="flex items-center space-x-1 text-xs opacity-75 mt-2">
                  <Bot className="w-3 h-3" />
                  <span>AI Response</span>
                </div>
              )}
            </div>
          )}

          {/* Time and status */}
          <div
            className={`flex items-center justify-end space-x-1 mt-2 text-xs ${
              isOwn ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            <span>{formatTime(message.createdAt)}</span>
            {getMessageStatus()}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;
