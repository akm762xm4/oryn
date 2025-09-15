interface MessageSkeletonProps {
  isOwn?: boolean;
}

export default function MessageSkeleton({
  isOwn = false,
}: MessageSkeletonProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`flex ${
          isOwn ? "flex-row-reverse" : "flex-row"
        } items-end space-x-2 max-w-xs lg:max-w-md`}
      >
        {/* Avatar skeleton (only for received messages) */}
        {!isOwn && (
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
        )}

        {/* Message bubble skeleton */}
        <div
          className={`px-4 py-2 rounded-2xl animate-pulse ${
            isOwn ? "bg-muted rounded-br-md" : "bg-muted rounded-bl-md"
          }`}
        >
          <div className="space-y-2">
            <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
            <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto md:p-4 p-2 md:space-y-4 space-y-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <MessageSkeleton key={index} isOwn={index % 3 === 0} />
      ))}
    </div>
  );
}
