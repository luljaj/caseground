import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/Nav";
import AuthProvider from "@/components/layout/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Caseground",
  description: "Practice business interviews with timers, rubrics, and feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans min-h-screen bg-background text-text-primary antialiased`}
      >
        <AuthProvider>
          <div className="min-h-screen">
            <Nav />
            <main className="relative px-6 py-6 md:px-12">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
