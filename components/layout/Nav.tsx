import Link from "next/link";
import Logo from "./Logo";
import AuthButton from "./AuthButton";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:px-12">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden gap-6 text-[13px] text-text-secondary md:flex">
            <Link
              className="transition-colors duration-150 hover:text-text-primary"
              href="/problems"
            >
              Problems
            </Link>
            <Link
              className="transition-colors duration-150 hover:text-text-primary"
              href="/dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="text-[13px] text-text-secondary transition-colors duration-150 hover:text-text-primary md:hidden"
            href="/problems"
          >
            Problems
          </Link>
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
