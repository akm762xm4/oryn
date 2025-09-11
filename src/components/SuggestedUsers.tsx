import { Avatar } from "./ui";

interface SuggestedUser {
  _id: string;
  username: string;
  avatar?: string;
}

interface SuggestedUsersProps {
  users: SuggestedUser[];
  onStartChat: (userId: string) => void;
}

export default function SuggestedUsers({
  users,
  onStartChat,
}: SuggestedUsersProps) {
  if (users.length === 0) return null;

  return (
    <div className="mt-4 p-4 border-t">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
        Suggested
      </div>
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => onStartChat(user._id)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
          >
            <Avatar src={user.avatar} name={user.username} size="sm" />
            <div className="truncate text-sm">{user.username}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
