"use client";

import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center text-xl font-medium tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="font-inter italic text-white -mt-[2px]">caseground</span>
    </Link>
  );
}
