"use client";

import Sidebar from "@/components/Sidebar";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const PUBLIC_ROUTES = ["/", "/login"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isAdmin = pathname.startsWith("/admin");
  const showSidebar = !isPublic && !isAdmin;

  useEffect(() => {
    if (isPublic) {
      setChecking(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      if (isAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_owner")
          .eq("id", session.user.id)
          .single();
        if (!profile?.is_owner) {
          router.replace("/dashboard");
          return;
        }
      }
      setChecking(false);
    });
  }, [pathname, isPublic, isAdmin, router]);

  if (!isPublic && checking) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen items-center justify-center bg-[var(--background)]`}>
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <span className="text-sm font-extrabold">CX</span>
            </div>
            <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
            </svg>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen bg-[var(--background)]`}>
        {showSidebar && <Sidebar />}
        <main className={showSidebar ? "flex-1 p-6 lg:p-8" : "w-full"}>
          {children}
        </main>
        <SpeedInsights />
      </body>
    </html>
  );
}
