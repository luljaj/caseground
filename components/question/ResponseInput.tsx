import { cn } from "@/lib/utils/cn";

export default function ResponseInput({
  value,
  onChange,
  disabled,
  isListening,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isListening?: boolean;
}) {
  return (
    <div className="relative group rounded-lg">
      {isListening && (
        <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-accent via-white/20 to-accent animate-pulse opacity-70 blur-sm transition-all duration-500" />
      )}
      <textarea
        className={cn(
            "relative min-h-[400px] w-full resize-none rounded-lg border border-white/5 bg-background px-5 py-4 text-[15px] leading-relaxed text-text-primary placeholder:text-text-secondary/50 transition-all focus:outline-none focus:ring-0",
            !isListening && "focus:border-white/10 focus:bg-background",
            isListening && "border-accent/50 bg-background"
        )}
        placeholder="Type your answer here..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
      />
    </div>
  );
}
