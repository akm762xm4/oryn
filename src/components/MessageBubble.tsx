import { memo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Avatar } from "./ui";
import {
  Check,
  CheckCheck,
  Bot,
  MessageCircle,
  ThumbsUp,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Message } from "../types";
import { useAuthStore } from "../stores/authStore";
import { useBackgroundStore } from "../stores/backgroundStore";
import { socketService } from "../lib/socket";
import { useChatStore } from "../stores/chatStore";
import { getCloudinaryThumbUrl } from "../lib/images";
import ImageViewer from "./ImageViewer";

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
  const { getCurrentBackground } = useBackgroundStore();
  const currentBackground = getCurrentBackground() as any;
  const bubbleTheme = currentBackground?.bubble;
  const { setReplyTo, activeConversation } = useChatStore();
  const isAIConversation = !!activeConversation?.participants?.some(
    (p: any) => p._id === "ai-assistant" || p.username === "AI Assistant"
  );
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const formatTime = (date: Date) => {
    return format(new Date(date), "HH:mm");
  };

  const getMessageStatus = () => {
    if (!isOwn) return null;

    const hasRead = (message.readBy || []).some(
      (read) => read.user !== user?._id
    );

    if (hasRead || message.status === "read") {
      return (
        <span className="inline-flex items-center gap-1">
          <CheckCheck className="md:w-4 md:h-4 w-3 h-3 text-accent text-xs" />
          <span className="hidden md:inline">
            seen{" "}
            {formatDistanceToNow(
              new Date(message.updatedAt || message.createdAt),
              { addSuffix: true }
            )}
          </span>
        </span>
      );
    }
    if (message.status === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <CheckCheck className="md:w-4 md:h-4 w-3 h-3" />
          <span className="hidden md:inline text-xs">
            sent{" "}
            {formatDistanceToNow(
              new Date(message.updatedAt || message.createdAt),
              { addSuffix: true }
            )}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Check className="md:w-4 md:h-4 w-3 h-3" />
        <span className="hidden md:inline text-xs">
          sent{" "}
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
          })}
        </span>
      </span>
    );
  };

  const isAI = message.isAI || message.messageType === "ai";

  return (
    <>
      <div
        className={`flex ${
          isOwn ? "justify-end" : "justify-start"
        } md:mb-2 mb-1`}
      >
        <div
          className={`flex ${
            isOwn ? "flex-row-reverse" : "flex-row"
          } items-end space-x-2 md:max-w-[75%] max-w-[80%]`}
        >
          {/* Avatar */}
          {!isOwn && showAvatar && (
            <Avatar
              src={message.sender.avatar}
              name={message.sender.username}
              size="sm"
              isAI={isAI}
              className="flex-shrink-0"
            />
          )}

          {/* Spacer when no avatar */}
          {!isOwn && !showAvatar && <div className="md:w-8 w-6" />}

          {/* Message bubble */}
          <div
            className={`message-bubble group ${
              bubbleTheme ? "" : isOwn ? "message-sent" : "message-received"
            } ${isAI ? "border-2 border-accent/20" : ""}`}
            style={
              bubbleTheme
                ? {
                    background: isOwn
                      ? bubbleTheme.sentBg
                      : bubbleTheme.receivedBg,
                    color: isOwn
                      ? bubbleTheme.sentText
                      : bubbleTheme.receivedText,
                  }
                : undefined
            }
          >
            {/* Reply preview */}
            {message.replyTo && typeof message.replyTo !== "string" && (
              <div
                className="md:mb-2 mb-1 md:p-2 p-1 rounded-lg text-xs bg-black/5 dark:bg-white/5 border-l-2 border-primary/60 flex items-start md:gap-2 gap-1 cursor-pointer"
                onClick={() => {
                  const anchor = document.getElementById(
                    `message-${(message.replyTo as any)._id}`
                  );
                  if (anchor) {
                    anchor.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
              >
                {/* Tiny thumbnail for image replies */}
                {message.replyTo.imageUrl && (
                  <img
                    src={getCloudinaryThumbUrl(message.replyTo.imageUrl)}
                    alt="reply preview"
                    className="w-10 h-10 rounded object-cover "
                  />
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {message.replyTo.sender.username}
                  </div>
                  <div className="opacity-80 truncate">
                    {message.replyTo.messageType === "image"
                      ? message.replyTo.content?.trim()
                        ? message.replyTo.content.slice(0, 120)
                        : "Photo"
                      : message.replyTo.content?.slice(0, 120)}
                  </div>
                </div>
              </div>
            )}

            {/* Sender name for group chats */}
            {!isOwn && showAvatar && (
              <div className="text-xs font-medium text-primary mb-1">
                {isAI ? "🤖 AI Assistant" : message.sender.username}
              </div>
            )}

            {/* Message content */}
            {message.messageType === "image" ? (
              <div className="md:space-y-2 space-y-1.5">
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="Shared image"
                    className="max-w-full h-auto rounded-lg cursor-pointer"
                    onClick={() => setViewerUrl(message.imageUrl || null)}
                  />
                )}
                {message.content && (
                  <p className="text-sm">{message.content}</p>
                )}
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

            {/* Reactions */}
            {Array.isArray((message as any).reactions) &&
              (message as any).reactions.length > 0 && (
                <div className="flex gap-1 md:mt-2 mt-1.5 flex-wrap">
                  {(message as any).reactions.map(
                    (r: any) =>
                      r.users.length > 0 && (
                        <span
                          key={r.emoji}
                          className="mdLpx-2 px-1.5 py-0.5 rounded-full text-xs bg-black/10 dark:bg-white/10"
                        >
                          {r.emoji} {r.users?.length || 0}
                        </span>
                      )
                  )}
                </div>
              )}

            {/* Inline reaction bar (hidden in AI conversations) */}
            {!isAIConversation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out flex items-center md:gap-2 gap-1 md:mt-2 mt-1.5 md:px-2 px-1 py-1 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-sm"
              >
                <button
                  className="md:px-2 px-1 py-1 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 rounded-full transition"
                  onClick={() => {
                    setReplyTo(message);
                    const ta = document.querySelector(
                      'textarea[placeholder="Type a message..."], textarea[placeholder="Ask AI anything..."]'
                    ) as HTMLTextAreaElement | null;
                    if (ta) {
                      setTimeout(() => {
                        ta.focus();
                        ta.selectionStart = ta.selectionEnd = ta.value.length;
                      }, 0);
                    }
                  }}
                  title="Reply"
                  aria-label="Reply"
                >
                  <MessageCircle className="w-4 h-4" /> Reply
                </button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition"
                  onClick={() =>
                    socketService.toggleReaction(message._id, "👍")
                  }
                  title="Like"
                  aria-label="Like"
                >
                  <ThumbsUp className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition"
                  onClick={() =>
                    socketService.toggleReaction(message._id, "❤️")
                  }
                  title="Love"
                  aria-label="Love"
                >
                  <Heart className="w-4 h-4 text-red-500" />
                </motion.button>
              </motion.div>
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

      {/* Image Viewer */}
      <ImageViewer imageUrl={viewerUrl} onClose={() => setViewerUrl(null)} />
    </>
  );
});

export default MessageBubble;
