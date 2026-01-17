import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className="relative flex h-4 w-4 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-4 w-4 rounded border border-zinc-700 bg-transparent peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
          {checked && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
        </div>
      </div>
      <span className="text-[14px] text-zinc-400 group-hover:text-zinc-300 transition-colors">
        {label}
      </span>
    </label>
  );
}
