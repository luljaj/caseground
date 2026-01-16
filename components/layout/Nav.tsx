import Link from "next/link";
import Logo from "./Logo";
import AuthButton from "./AuthButton";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-white/5 bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden gap-6 text-[14px] font-medium text-text-secondary md:flex">
            <Link
              className="transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
              href="/problems"
            >
              Problems
            </Link>
            <Link
              className="transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
              href="/dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="text-[14px] font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none md:hidden"
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
