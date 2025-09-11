import { X } from "lucide-react";

interface SelectedUserTagProps {
  username: string;
  onRemove: () => void;
}

export default function SelectedUserTag({ username, onRemove }: SelectedUserTagProps) {
  return (
    <div className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
      <span>{username}</span>
      <button
        title="Remove user"
        onClick={onRemove}
        className="hover:bg-primary/20 rounded-full p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
