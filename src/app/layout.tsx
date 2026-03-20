import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Titillium_Web } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import PullToRefresh from "@/components/PullToRefresh";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const titillium = Titillium_Web({
  variable: "--font-titillium",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "F1 Predictions",
  description: "Track F1 predictions with your friends",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${titillium.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)] safe-bottom">
        <Nav
          displayName={user?.user_metadata?.display_name ?? user?.email ?? null}
          userId={user?.id ?? null}
        />
        <PullToRefresh>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </PullToRefresh>
      </body>
    </html>
  );
}
