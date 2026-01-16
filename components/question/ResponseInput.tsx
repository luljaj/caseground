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
    <div className="relative h-full">
      {/* Listening indicator */}
      {isListening && (
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[11px] font-medium text-red-400/80">Recording</span>
        </div>
      )}

      <textarea
        className={cn(
          "h-full min-h-[300px] w-full resize-none rounded-md border px-4 py-3 text-[14px] leading-relaxed text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none",
          isListening
            ? "border-red-500/30 bg-red-500/[0.03] pt-10"
            : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.15] focus:border-white/[0.15]"
        )}
        placeholder={isListening ? "Listening..." : "Type your response here..."}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
      />
    </div>
  );
}
