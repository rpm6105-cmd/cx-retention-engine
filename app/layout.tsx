"use client";

import Sidebar from "@/components/Sidebar";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSession } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Routes that don't need auth and don't show sidebar
const PUBLIC_ROUTES = ["/", "/login"];

// Routes that need auth but no sidebar (admin has its own layout)
const NO_SIDEBAR_ROUTES = ["/admin"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isAdmin = pathname.startsWith("/admin");
  const showSidebar = !isPublic && !isAdmin;

  useEffect(() => {
    if (isPublic) return;
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    // Non-owners trying to access admin — redirect to dashboard
    if (isAdmin && !session.isOwner) {
      router.replace("/dashboard");
    }
  }, [pathname, isPublic, isAdmin, router]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen bg-[var(--background)]`}
      >
        {showSidebar && <Sidebar />}
        <main className={showSidebar ? "flex-1 p-6 lg:p-8" : "w-full"}>
          {children}
        </main>
        <SpeedInsights />
      </body>
    </html>
  );
}
