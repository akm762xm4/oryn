import { useState, useEffect, useCallback } from "react";
import { X, Search, Users, User } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import api from "../lib/api";
import toast from "react-hot-toast";

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

  useAuthStore();
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
        return [...prev, selectedUser];
      }
    });
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New Chat</h2>
          <button
            title="close"
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat type toggle */}
        <div className="p-4 border-b border-border">
          <div className="flex space-x-2">
            <button
              onClick={() => setIsGroup(false)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                !isGroup
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Direct Chat</span>
            </button>
            <button
              onClick={() => setIsGroup(true)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                isGroup
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Group Chat</span>
            </button>
          </div>
        </div>

        {/* Group name input */}
        {isGroup && (
          <div className="p-4 border-b border-border">
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary"
            />
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary"
            />
          </div>
        </div>

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium text-foreground mb-2">
              Selected ({selectedUsers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((selectedUser) => (
                <div
                  key={selectedUser._id}
                  className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  <span>{selectedUser.username}</span>
                  <button
                    title="close"
                    onClick={() => toggleUserSelection(selectedUser)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                    onClick={() => toggleUserSelection(searchUser)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          {searchUser.avatar ? (
                            <img
                              src={searchUser.avatar}
                              alt={searchUser.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-medium">
                              {searchUser.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {searchUser.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent border-2 border-background rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {searchUser.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
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
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Search for users to start chatting
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateConversation}
              disabled={
                selectedUsers.length === 0 ||
                isCreating ||
                (isGroup && !groupName.trim())
              }
              className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating
                ? "Creating..."
                : isGroup
                ? "Create Group"
                : "Start Chat"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
