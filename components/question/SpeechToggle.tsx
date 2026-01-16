import Button from "@/components/ui/Button";

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
  const label = !supported
    ? "Mic unavailable"
    : isListening
      ? "Stop mic"
      : "Start mic";

  return (
    <Button
      type="button"
      variant={isListening ? "primary" : "secondary"}
      size="sm"
      disabled={!supported || disabled}
      onClick={onToggle}
      className={isListening ? "animate-pulse" : undefined}
    >
      {label}
    </Button>
  );
}
