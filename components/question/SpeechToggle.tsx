import { cn } from "@/lib/utils/cn";

export default function SpeechToggle({
  isListening,
  supported,
  disabled,
  onToggle,
}: {
  isListening: boolean;
  supported: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors duration-150",
        isListening
          ? "bg-accent/15 text-accent"
          : "text-text-muted hover:bg-white/[0.04] hover:text-text-secondary",
        disabled && "cursor-not-allowed opacity-40"
      )}
      aria-label={isListening ? "Stop dictation" : "Start dictation"}
    >
      <svg
        className={cn("h-3.5 w-3.5", isListening && "animate-pulse")}
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 1v8M7 9a2 2 0 0 0 2-2V4a2 2 0 0 0-4 0v3a2 2 0 0 0 2 2Z" />
        <path d="M10.5 6v1a3.5 3.5 0 0 1-7 0V6M7 12.5v-2" />
      </svg>
      <span>{isListening ? "Listening..." : "Dictate"}</span>
    </button>
  );
}
