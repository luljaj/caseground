import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 text-lg font-semibold tracking-tight"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-accent">
        CG
      </span>
      <span className="text-text-primary">Caseground</span>
    </Link>
  );
}
