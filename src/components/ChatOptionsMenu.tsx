import {
  MoreVertical, Pin, PinOff, Palette, Image, Download,
  Trash2, Eraser, Users, X,
} from "lucide-react";
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
  onCloseChat: () => void;
  onShowGroupInfo?: () => void;
}

export default function ChatOptionsMenu({
  conversationId,
  isPinned,
  isGroup = false,
  onShowBackgroundModal,
  onShowDeleteConfirm,
  onClearChat,
  onCloseChat,
  onShowGroupInfo,
}: ChatOptionsMenuProps) {
  const { toggleConversationPin, messages } = useChatStore();

  const handleTogglePin = async () => {
    try {
      await api.post(`/chat/conversations/${conversationId}/pin`);
      toggleConversationPin(conversationId);
      toast.success(`Conversation ${isPinned ? "unpinned" : "pinned"}`);
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
      size="icon"
      title="More options"
      tabIndex={0}
    >
      <MoreVertical className="w-4 h-4 text-muted-foreground" />
    </Button>
  );

  return (
    <DropdownMenu trigger={trigger}>
      <DropdownMenuSeparator>Chat Management</DropdownMenuSeparator>

      {isGroup && onShowGroupInfo && (
        <DropdownMenuItem onClick={onShowGroupInfo} icon={<Users className="w-4 h-4" />}>
          Group Info
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        onClick={handleTogglePin}
        icon={isPinned
          ? <PinOff className="w-4 h-4" />
          : <Pin className="w-4 h-4" />}
      >
        {isPinned ? "Unpin Conversation" : "Pin Conversation"}
      </DropdownMenuItem>

      <DropdownMenuSeparator>Appearance</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={onShowBackgroundModal}
        icon={<Palette className="w-4 h-4" />}
      >
        Change Background
      </DropdownMenuItem>

      <DropdownMenuSeparator>Media & Data</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={() => window.dispatchEvent(new CustomEvent("open-view-media"))}
        icon={<Image className="w-4 h-4" />}
      >
        View Media & Files
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleExportChat}
        icon={<Download className="w-4 h-4" />}
      >
        Export Chat
      </DropdownMenuItem>

      <DropdownMenuSeparator>Cleanup</DropdownMenuSeparator>

      <DropdownMenuItem
        onClick={onCloseChat}
        icon={<X className="w-4 h-4" />}
      >
        Close Chat
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={onClearChat}
        disabled={messages.length === 0}
        icon={<Eraser className="w-4 h-4" />}
      >
        Clear Chat
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={onShowDeleteConfirm}
        destructive
        icon={<Trash2 className="w-4 h-4" />}
      >
        Delete Conversation
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
