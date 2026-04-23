import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Group Mart - Community Marketplace",
  description: "A Community Marketplace For Second Hand",
};

import { RouteGuard } from "@/components/auth/RouteGuard";
import { UserFeatures } from "@/components/UserFeatures";
import { BanGuard } from "@/components/providers/ban-guard";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          outfit.variable
        )}
      >
        <AuthProvider>
          <BanGuard />
          <RouteGuard>
            <UserFeatures>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
                {modal}
              </div>
              <Toaster closeButton richColors />
            </UserFeatures>
          </RouteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
