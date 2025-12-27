import type { Metadata } from "next";
import { cn } from "@/lib/utils"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", outfit.variable)}>
        <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
        </AuthProvider>
      </body>
    </html>
  );
}
