import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Users, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { formatDistanceToNow } from "date-fns";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Avatar, Button } from "./ui";
import ChatOptionsMenu from "./ChatOptionsMenu";
import GroupInfoModal from "./GroupInfoModal";
import ConfirmModal from "./ConfirmModal";
import BackgroundModal from "./BackgroundModal";

interface ChatHeaderProps {
  showBackButton?: boolean;
}

export default function ChatHeader({
  showBackButton = false,
}: ChatHeaderProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeConversation,
    onlineUsers,
    messages,
    setMessages,
    setConversations,
    setActiveConversation,
  } = useChatStore();

  const handleClearChat = async () => {
    if (!activeConversation || isClearing || messages.length === 0) return;

    try {
      setIsClearing(true);
      await api.delete(
        `/chat/conversations/${activeConversation._id}/messages`
      );
      setMessages(() => []);
      // setActiveConversation(null);
      setConversations((convs) =>
        convs.map((c) =>
          c._id === activeConversation._id
            ? { ...c, lastMessage: undefined }
            : c
        )
      );
      toast.success("Chat cleared successfully");
    } catch (error) {
      toast.error("Failed to clear chat");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation || isClearing) return;

    try {
      setIsClearing(true);
      await api.delete(`/chat/conversations/${activeConversation._id}`);
      setConversations((convs) =>
        convs.filter((c) => c._id !== activeConversation._id)
      );
      setActiveConversation(null);
      setMessages([]);
      toast.success("Conversation deleted");
      navigate("/chat");
    } catch (e) {
      toast.error("Failed to delete conversation");
    } finally {
      setIsClearing(false);
    }
  };

  if (!activeConversation) return null;

  const getConversationInfo = () => {
    if (activeConversation.isGroup) {
      return {
        name: activeConversation.groupName || "Group Chat",
        subtitle: `${activeConversation.participants.length} members`,
        avatar: activeConversation.groupAvatar || "",
        isOnline: false,
        isAI: false,
      };
    }

    const otherUser = activeConversation.participants.find(
      (p) => p._id !== user?._id
    );

    if (!otherUser) {
      return {
        name: "AI Assistant",
        subtitle: "AI Assistant - Always available",
        // avatar: "",
        // isOnline: false,
        isAI: true,
      };
    }

    const isAI = otherUser._id === "ai-assistant";
    const isOnline = isAI || onlineUsers.has(otherUser._id);

    return {
      name: otherUser.username,
      subtitle: isAI
        ? "AI Assistant - Always available"
        : isOnline
        ? "Online"
        : `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), {
            addSuffix: true,
          })}`,
      avatar: otherUser.avatar,
      isOnline,
      isAI,
    };
  };

  const { name, subtitle, avatar, isOnline, isAI } = getConversationInfo();

  return (
    <div className="bg-background border-b border-border md:p-4 p-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Left side - Back button and User info */}
        <div className="flex items-center md:space-x-2 space-x-1.5 min-w-0 flex-1">
          {/* Back button for mobile */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
              className="p-2 md:hidden"
              title="Back to conversations"
            >
              <ArrowLeft className="md:w-5 md:h-5 w-4 h-4" />
            </Button>
          )}

          <Avatar
            src={avatar}
            name={name}
            size="md"
            isAI={isAI}
            isOnline={isOnline}
          />

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base md:text-lg text-foreground flex items-center truncate">
              {name}
              {activeConversation.isGroup && (
                <Users className="w-4 h-4 md:w-5 md:h-5 ml-1 text-muted-foreground flex-shrink-0" />
              )}
              {isAI && (
                <Bot className="w-4 h-4 md:w-5 md:h-5 ml-1 text-accent flex-shrink-0" />
              )}
            </h2>
            <p className="text-xs md:text-sm truncate text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-1 md:space-x-2">
          <ChatOptionsMenu
            conversationId={activeConversation._id}
            isPinned={!!activeConversation.pinnedAt}
            isGroup={activeConversation.isGroup}
            onShowBackgroundModal={() => setShowBackgroundModal(true)}
            onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
            onClearChat={() => setShowClearConfirm(true)}
            onShowGroupInfo={() => setShowGroupInfo(true)}
          />
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConversation}
          title="Delete Conversation"
          description="This will permanently delete all messages in this conversation."
          confirmText="Delete"
        />
      )}

      {showClearConfirm && (
        <ConfirmModal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={async () => {
            setShowClearConfirm(false);
            await handleClearChat();
          }}
          title="Clear Chat"
          description="This will remove all messages from this conversation. This action cannot be undone."
          confirmText="Clear"
        />
      )}

      {showBackgroundModal && (
        <BackgroundModal
          isOpen={showBackgroundModal}
          onClose={() => setShowBackgroundModal(false)}
        />
      )}
      {showGroupInfo && activeConversation?.isGroup && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          conversation={activeConversation}
        />
      )}
    </div>
  );
}
