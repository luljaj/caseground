import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/layout/AuthProvider";
import { SettingsProvider } from "@/lib/context/SettingsContext";
import { CollectionProvider } from "@/lib/context/CollectionContext";
import CollectionOverlay from "@/components/collections/CollectionOverlay";
import AppShell from "@/components/layout/AppShell";

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
          <SettingsProvider>
            <CollectionProvider>
              <AppShell>{children}</AppShell>
              <CollectionOverlay />
            </CollectionProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
