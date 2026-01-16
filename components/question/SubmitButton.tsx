import Button from "@/components/ui/Button";

export default function SubmitButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button size="lg" disabled={disabled} onClick={onClick}>
      Submit
    </Button>
  );
}
