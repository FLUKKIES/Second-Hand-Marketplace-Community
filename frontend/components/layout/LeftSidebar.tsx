"use client";

import {
  Home,
  Grid2X2,
  Users,
  Bookmark,
  Settings,
  LogOut,
  User,
  ShoppingBag,
  Package,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { name: "Feed", icon: Home, href: "/" },
  { name: "Categories", icon: Grid2X2, href: "/marketplace" },
  { name: "My Offers", icon: ShoppingBag, href: "/marketplace/my-offers" },
  { name: "My Orders", icon: Package, href: "/marketplace/orders" },
  { name: "My Groups", icon: Users, href: "/groups" },
  // { name: "Saved", icon: Bookmark, href: "/saved" },
  // { name: "Settings", icon: Settings, href: "/settings" },
];

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function LeftSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavItems = user
    ? navItems
    : navItems.filter((item) => ["Feed", "Categories"].includes(item.name));

  return (
    <div className="space-y-4">
      {/* Mini Profile */}
      {user ? (
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-3 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarImage src={api.getImageUrl(user.avatarUrl)} />
            <AvatarFallback>
              {user.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 z-10">
            <h3 className="font-semibold text-sm truncate text-foreground">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.fullName || user.username}
            </h3>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-lg text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex justify-center mb-3 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm">
              <User size={20} className="text-white" />
            </div>
          </div>
          <p className="text-sm font-bold mb-1 relative z-10">
            Join GroupMart!
          </p>
          <p className="text-xs text-indigo-100 mb-4 opacity-90 relative z-10">
            Buy, sell, and connect with your community.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors shadow-md relative z-10"
          >
            Log In / Register
          </Link>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-card rounded-2xl p-2 shadow-sm border border-border/50 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  "transition-transform duration-200",
                  isActive && "scale-110",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
        <div className="flex flex-col gap-3 text-xs text-muted-foreground te">
          {/* <div className="flex gap-x-3 gap-y-1.5 flex-wrap">
            <Link href="#" className="hover:text-primary transition-colors">
              About
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Help
            </Link>
          </div> */}
          <p className="opacity-60 text-center">© 2026 GroupMart</p>
        </div>
      </div>
    </div>
  );
}
