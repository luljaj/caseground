import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 text-base font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-[11px] font-semibold text-accent">
        CG
      </span>
      <span className="text-text-primary">Caseground</span>
    </Link>
  );
}
