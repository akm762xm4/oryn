export default function ConversationSkeleton() {
  return (
    <div className="space-y-2 md:space-y-1 p-4 md:p-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="w-full p-4 md:p-3 rounded-xl md:rounded-lg animate-pulse"
        >
          <div className="flex items-center space-x-4 md:space-x-3">
            {/* Avatar skeleton */}
            <div className="w-14 h-14 md:w-12 md:h-12 bg-muted rounded-full"></div>

            {/* Content skeleton */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3 md:mb-2">
                <div className="h-5 md:h-4 bg-muted rounded w-28 md:w-24"></div>
                <div className="h-4 md:h-3 bg-muted rounded w-16 md:w-12"></div>
              </div>
              <div className="h-4 md:h-3 bg-muted rounded w-36 md:w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
