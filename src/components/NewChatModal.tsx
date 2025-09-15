import { useState, useEffect, useCallback } from "react";
import { Search, Users, User } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";

import {
  Modal,
  Button,
  Input,
  Avatar,
  LoadingSpinner,
  SelectedUserTag,
} from "./ui";
import api from "../lib/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchUser {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
}

export default function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const { user } = useAuthStore();
  const { setActiveConversation, conversations, setConversations } =
    useChatStore();

  const searchUsers = useCallback(async () => {
    setIsSearching(true);
    try {
      const response = await api.get(`/chat/search/users?query=${searchQuery}`);
      setSearchResults(response.data);
    } catch {
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchUsers]);

  const toggleUserSelection = (selectedUser: SearchUser) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === selectedUser._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== selectedUser._id);
      } else {
        // If not a group chat, selecting a user should replace selection (single select)
        if (!isGroup) return [selectedUser];
        return [...prev, selectedUser];
      }
    });
  };

  // When switching from group to direct, ensure only one user remains selected
  useEffect(() => {
    if (!isGroup && selectedUsers.length > 1) {
      setSelectedUsers((prev) => (prev.length > 0 ? [prev[0]] : []));
    }
  }, [isGroup]);

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    if (isGroup && !groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setIsCreating(true);
    // Check if a conversation already exists to avoid duplicates
    try {
      if (!isGroup) {
        const targetId = selectedUsers[0]._id;
        const existing = conversations.find(
          (c) =>
            !c.isGroup &&
            c.participants.some((p) => p._id === targetId) &&
            c.participants.some((p) => p._id === user?._id)
        );

        if (existing) {
          //navigate also when on mobile screen
          if (isMobile) {
            navigate(`/chat/${existing._id}`);
          }
          setActiveConversation(existing);
          toast.success("Opened existing chat");
          onClose();
          setIsCreating(false);
          return;
        }
      } else {
        // group: match by participant set (including current user)
        const selectedIds = new Set(selectedUsers.map((u) => u._id));
        const existingGroup = conversations.find((c) => {
          if (!c.isGroup) return false;
          // participants should include the selected users and the current user
          const participantIds = c.participants.map((p) => p._id);
          if (!user?._id) return false;
          if (!participantIds.includes(user._id)) return false;
          if (participantIds.length !== selectedIds.size + 1) return false;
          return [...selectedIds].every((id) => participantIds.includes(id));
        });

        if (existingGroup) {
          setActiveConversation(existingGroup);
          toast.success("Opened existing group chat");
          onClose();
          setIsCreating(false);
          return;
        }
      }
    } catch (e) {
      // detection failed, continue to create
      console.error("Conversation detection error", e);
    }
    try {
      const response = await api.post("/chat/conversations", {
        participantId: isGroup
          ? selectedUsers.map((u) => u._id)
          : selectedUsers[0]._id,
        isGroup,
        groupName: isGroup ? groupName.trim() : undefined,
      });

      const newConversation = response.data;
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation);

      toast.success(isGroup ? "Group created successfully" : "Chat started");
      onClose();
    } catch (error) {
      toast.error("Failed to create conversation");
      console.error("Error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    setIsGroup(false);
    setGroupName("");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Chat"
      size="md"
      className="max-h-[80vh] flex flex-col"
    >
      <div className="flex flex-col h-full">
        {/* Chat type toggle */}
        <div className="md:p-4 p-2 border-b border-border">
          <div className="flex md:space-x-2 space-x-1">
            <Button
              type="button"
              variant={!isGroup ? "primary" : "secondary"}
              onClick={() => setIsGroup(false)}
              className={`rounded-lg transition-colors ${
                !isGroup
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Direct Chat</span>
            </Button>
            <Button
              type="button"
              variant={isGroup ? "primary" : "secondary"}
              onClick={() => setIsGroup(true)}
              className={`rounded-lg transition-colors ${
                isGroup
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Group Chat</span>
            </Button>
          </div>
        </div>

        {/* Group name input */}
        {isGroup && (
          <div className="p-4 border-b border-border">
            <Input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="py-3 md:py-3.5 md:text-sm text-xs"
            />
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-border">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="py-3 md:py-3.5 md:text-sm text-xs"
          />
        </div>

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="md:p-4 p-2 border-b border-border">
            <p className="md:text-sm text-xs font-medium text-foreground md:mb-2 mb-1">
              Selected ({selectedUsers.length})
            </p>
            <div className="flex flex-wrap md:gap-2 gap-1">
              {selectedUsers.map((selectedUser) => (
                <SelectedUserTag
                  key={selectedUser._id}
                  username={selectedUser.username}
                  onRemove={() => toggleUserSelection(selectedUser)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center md:p-8 p-4">
              <LoadingSpinner />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1 p-2">
              {searchResults.map((searchUser) => {
                const isSelected = selectedUsers.some(
                  (u) => u._id === searchUser._id
                );

                return (
                  <button
                    key={searchUser._id}
                    type="button"
                    onClick={() => toggleUserSelection(searchUser)}
                    className={`w-full md:p-3 p-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={searchUser.avatar}
                        name={searchUser.username}
                        size="sm"
                        isOnline={searchUser.isOnline}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {searchUser.username}
                        </p>
                        <p className="md:text-sm text-xs text-muted-foreground truncate">
                          {searchUser.email}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : searchQuery.trim() ? (
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <Search className="md:w-12 md:h-12 w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Search for users to start chatting
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={
                selectedUsers.length === 0 ||
                (!isGroup && selectedUsers.length !== 1) ||
                isCreating ||
                (isGroup && !groupName.trim())
              }
              isLoading={isCreating}
              className="flex-1"
            >
              {isGroup ? "Create " : "Start Chat"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
