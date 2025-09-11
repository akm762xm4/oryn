import { MoreVertical } from "lucide-react";
import Button from "./ui/Button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "./ui";
import { useChatStore } from "../stores/chatStore";
import api from "../lib/api";
import toast from "react-hot-toast";

interface ChatOptionsMenuProps {
  conversationId: string;
  isPinned: boolean;
  isGroup?: boolean;
  onShowBackgroundModal: () => void;
  onShowDeleteConfirm: () => void;
  onClearChat: () => void;
  onShowGroupInfo?: () => void;
}

export default function ChatOptionsMenu({
  conversationId,
  isPinned,
  isGroup = false,
  onShowBackgroundModal,
  onShowDeleteConfirm,
  onClearChat,
  onShowGroupInfo,
}: ChatOptionsMenuProps) {
  const { toggleConversationPin, messages } = useChatStore();

  const handleTogglePin = async () => {
    try {
      await api.post(`/chat/conversations/${conversationId}/pin`);
      toggleConversationPin(conversationId);
      toast.success(
        `Conversation ${isPinned ? "unpinned" : "pinned"} successfully`
      );
    } catch {
      toast.error("Failed to update pin");
    }
  };

  const handleExportChat = async () => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/export`);
      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(res.data, null, 2)
      )}`;
      const a = document.createElement("a");
      a.href = dataStr;
      a.download = `conversation-${conversationId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Chat exported");
    } catch {
      toast.error("Failed to export chat");
    }
  };

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title="More options"
      className="p-2 md:p-3 rounded-lg"
      tabIndex={0}
    >
      <MoreVertical className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
    </Button>
  );

  return (
    <DropdownMenu trigger={trigger}>
      <DropdownMenuSeparator>Chat Management</DropdownMenuSeparator>

      {isGroup && onShowGroupInfo && (
        <DropdownMenuItem onClick={onShowGroupInfo} icon={<span>👥</span>}>
          Group Info
        </DropdownMenuItem>
      )}

      <DropdownMenuItem onClick={handleTogglePin} icon={<span>📌</span>}>
        {isPinned ? "Unpin Conversation" : "Pin Conversation"}
      </DropdownMenuItem>

      <DropdownMenuSeparator>Appearance</DropdownMenuSeparator>

      <DropdownMenuItem onClick={onShowBackgroundModal} icon={<span>🎨</span>}>
        Change Background
      </DropdownMenuItem>

      <DropdownMenuSeparator>Media & Data</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={() => window.dispatchEvent(new CustomEvent("open-view-media"))}
        icon={<span>🖼️</span>}
      >
        View Media & Files
      </DropdownMenuItem>

      <DropdownMenuItem onClick={handleExportChat} icon={<span>📤</span>}>
        Export Chat
      </DropdownMenuItem>

      <DropdownMenuSeparator>Cleanup</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={onClearChat}
        disabled={messages.length === 0}
        icon={<span>🧹</span>}
      >
        Clear Chat
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={onShowDeleteConfirm}
        destructive
        icon={<span>🗑️</span>}
      >
        Delete Conversation
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
