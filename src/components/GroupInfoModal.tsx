import { useState } from "react";
import { useForm } from "react-hook-form";
import { Modal, Button, Input, Avatar } from "./ui";
import api from "../lib/api";
import toast from "react-hot-toast";
import type { Conversation } from "../types";

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

interface RenameForm {
  groupName: string;
}

export default function GroupInfoModal({ isOpen, onClose, conversation }: GroupInfoModalProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RenameForm>();

  const onSubmit = async (data: RenameForm) => {
    if (!data.groupName.trim()) return;
    
    try {
      setIsRenaming(true);
      await api.put(`/chat/conversations/${conversation._id}/rename`, {
        groupName: data.groupName.trim(),
      });
      toast.success("Group name updated");
      reset();
      onClose();
    } catch {
      toast.error("Failed to rename group");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Group Info" size="lg">
      <div className="space-y-6">
        {/* Rename Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Group Name"
            placeholder={conversation.groupName || "Enter group name"}
            {...register("groupName", {
              required: "Group name is required",
              minLength: { value: 1, message: "Group name cannot be empty" },
            })}
            error={errors.groupName?.message}
          />
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isRenaming}>
              {isRenaming ? "Saving..." : "Update Name"}
            </Button>
          </div>
        </form>

        {/* Members Section */}
        <div>
          <h3 className="text-sm font-medium mb-3">Members ({conversation.participants.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {conversation.participants.map((participant) => (
              <div
                key={participant._id}
                className="flex items-center gap-3 p-2 rounded-lg border border-border"
              >
                <Avatar
                  src={participant.avatar}
                  name={participant.username}
                  size="sm"
                />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{participant.username}</div>
                  <div className="text-muted-foreground text-xs">{participant.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
