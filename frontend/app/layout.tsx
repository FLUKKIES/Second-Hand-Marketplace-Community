import type { Metadata } from "next";
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
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased bg-background text-foreground font-sans min-h-screen`}
      >
        <div className="flex flex-col min-h-screen">
            {children}
        </div>
      </body>
    </html>
  );
}
