export default function ConversationSkeleton() {
  return (
    <div className="md:space-y-2 space-y-1 md:p-4 p-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="w-full md:p-4 p-3 md:rounded-xl rounded-lg animate-pulse"
        >
          <div className="flex items-center md:space-x-4 space-x-3">
            {/* Avatar skeleton */}
            <div className="md:w-14 md:h-14 w-12 h-12 bg-muted rounded-full"></div>

            {/* Content skeleton */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3 md:mb-2">
                <div className="md:h-5 h-4 bg-muted rounded md:w-28 w-24"></div>
                <div className="md:h-4 h-3 bg-muted rounded md:w-16 w-12"></div>
              </div>
              <div className="md:h-4 h-3 bg-muted rounded md:w-36 w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
