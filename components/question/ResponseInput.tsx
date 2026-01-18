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
        className={`w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-zinc-300 placeholder:text-zinc-700 resize-none focus:outline-none focus:border-zinc-700 transition-colors${
          isListening ? " pt-10" : ""
        }`}
        placeholder={isListening ? "Listening..." : "Type your response here..."}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
      />
    </div>
  );
}
