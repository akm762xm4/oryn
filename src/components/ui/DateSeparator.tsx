interface DateSeparatorProps {
  children: React.ReactNode;
}

export default function DateSeparator({ children }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center md:my-6 my-3">
      <div className="bg-muted px-3  py-1 rounded-full">
        <span className="text-xs text-muted-foreground font-medium">
          {children}
        </span>
      </div>
    </div>
  );
}
