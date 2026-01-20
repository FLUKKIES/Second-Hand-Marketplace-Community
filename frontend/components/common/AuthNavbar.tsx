"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function AuthNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
           <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg shadow-primary/25 transition-transform group-hover:scale-105 duration-300">
             <ShoppingBag size={20} className="fill-current" />
           </div>
           <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">GroupMart</span>
        </Link>
      </div>
    </header>
  );
}
