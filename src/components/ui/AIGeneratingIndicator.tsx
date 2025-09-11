export default function AIGeneratingIndicator() {
  return (
    <div className="flex items-center space-x-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <div className="w-3 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
      </div>
      <div className="bg-muted px-4 py-2 rounded-2xl">
        <p className="text-sm text-muted-foreground italic">
          AI is thinking...
        </p>
      </div>
    </div>
  );
}
