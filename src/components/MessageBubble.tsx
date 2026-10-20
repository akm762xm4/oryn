import { memo, useState } from "react";
import { format } from "date-fns";
import { Avatar } from "./ui";
import { Check, CheckCheck, Bot, MessageCircle, ThumbsUp, Heart } from "lucide-react";
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

  const formatTime = (date: Date) => format(new Date(date), "HH:mm");

  /** Returns just the icon + optionally the seen text */
  const StatusIcon = () => {
    if (!isOwn) return null;

    const hasRead = (message.readBy || []).some((r) => r.user !== user?._id);

    if (hasRead || message.status === "read") {
      return (
        <span className="inline-flex items-center gap-1 opacity-80">
          <CheckCheck className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (message.status === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 opacity-60">
          <CheckCheck className="w-3.5 h-3.5" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 opacity-50">
        <Check className="w-3.5 h-3.5" />
      </span>
    );
  };

  const isAI = message.isAI || message.messageType === "ai";

  /* ── bubble colours ── */
  const bubbleStyle = bubbleTheme
    ? {
        background: isOwn ? bubbleTheme.sentBg : bubbleTheme.receivedBg,
        color: isOwn ? bubbleTheme.sentText : bubbleTheme.receivedText,
      }
    : undefined;

  const bubbleClass = bubbleTheme
    ? ""
    : isOwn
    ? "message-sent"
    : isAI
    ? "message-ai"
    : "message-received";

  return (
    <>
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}>
        <div
          className={`flex ${
            isOwn ? "flex-row-reverse" : "flex-row"
          } items-end gap-2 max-w-[78%] md:max-w-[68%]`}
        >
          {/* Avatar */}
          {!isOwn && showAvatar && (
            <Avatar
              src={message.sender.avatar}
              name={message.sender.username}
              size="sm"
              isAI={isAI}
              className="flex-shrink-0 mb-0.5"
            />
          )}
          {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

          {/* Bubble */}
          <div
            className={`message-bubble group relative ${bubbleClass}`}
            style={bubbleStyle}
            id={`message-${message._id}`}
          >
            {/* Reply preview */}
            {message.replyTo && typeof message.replyTo !== "string" && (
              <div
                className="mb-2 p-2 rounded-lg text-xs bg-black/8 dark:bg-white/8 border-l-2 border-primary/70 flex items-start gap-2 cursor-pointer"
                onClick={() => {
                  const el = document.getElementById(`message-${(message.replyTo as any)._id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                {message.replyTo.imageUrl && (
                  <img
                    src={getCloudinaryThumbUrl(message.replyTo.imageUrl)}
                    alt=""
                    className="w-9 h-9 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate opacity-90">
                    {message.replyTo.sender.username}
                  </p>
                  <p className="opacity-70 truncate">
                    {message.replyTo.messageType === "image"
                      ? message.replyTo.content?.trim() || "Photo"
                      : message.replyTo.content?.slice(0, 100)}
                  </p>
                </div>
              </div>
            )}

            {/* Sender name (group / AI) */}
            {!isOwn && showAvatar && (
              <p className="text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--primary))" }}>
                {isAI ? "AI Assistant" : message.sender.username}
              </p>
            )}

            {/* Content */}
            {message.messageType === "image" ? (
              <div className="space-y-1.5">
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="Shared image"
                    className="max-w-full h-auto rounded-xl cursor-pointer"
                    onClick={() => setViewerUrl(message.imageUrl || null)}
                  />
                )}
                {message.content && <p className="text-sm">{message.content}</p>}
              </div>
            ) : isAI ? (
              <div className="space-y-1.5">
                <div className="prose-ai">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div className="flex items-center gap-1 text-[10px] opacity-60 mt-1.5">
                  <Bot className="w-3 h-3" />
                  <span>AI Response</span>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            )}

            {/* Reactions */}
            {Array.isArray((message as any).reactions) &&
              (message as any).reactions.some((r: any) => r.users?.length > 0) && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {(message as any).reactions.map(
                    (r: any) =>
                      r.users?.length > 0 && (
                        <span
                          key={r.emoji}
                          className="px-1.5 py-0.5 rounded-full text-xs bg-black/10 dark:bg-white/10"
                        >
                          {r.emoji} {r.users.length}
                        </span>
                      )
                  )}
                </div>
              )}

            {/* Action bar — shown on hover */}
            {!isAIConversation && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 mt-2 py-0.5 px-1.5 rounded-full bg-black/8 dark:bg-white/10 w-fit">
                <button
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
                  onClick={() => {
                    setReplyTo(message);
                    const ta = document.querySelector(
                      "textarea"
                    ) as HTMLTextAreaElement | null;
                    if (ta) setTimeout(() => ta.focus(), 0);
                  }}
                  title="Reply"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
                  onClick={() => socketService.toggleReaction(message._id, "👍")}
                  title="Like"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
                  onClick={() => socketService.toggleReaction(message._id, "❤️")}
                  title="Love"
                >
                  <Heart className="w-3.5 h-3.5 text-destructive" />
                </motion.button>
              </div>
            )}

            {/* Time + status row */}
            <div
              className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] leading-none ${
                isOwn ? "opacity-70" : "text-muted-foreground opacity-80"
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              <StatusIcon />
            </div>
          </div>
        </div>
      </div>

      <ImageViewer imageUrl={viewerUrl} onClose={() => setViewerUrl(null)} />
    </>
  );
});

export default MessageBubble;
