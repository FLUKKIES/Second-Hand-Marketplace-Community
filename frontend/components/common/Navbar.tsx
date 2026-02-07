"use client";

import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Bell,
  User,
  Menu,
  ChevronDown,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { Suspense } from "react";
import { SearchBar } from "./SearchBar";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full shadow-sm border-b border-border/40 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg shadow-primary/25 transition-transform group-hover:scale-105 duration-300">
            <ShoppingBag size={20} className="fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            GroupMart
          </span>
        </Link>

        {/* Center Search Bar */}
        <div className="hidden md:flex flex-1 justify-center px-8">
          <Suspense
            fallback={
              <div className="w-full max-w-md h-10 bg-muted/50 rounded-full" />
            }
          >
            <SearchBar />
          </Suspense>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full md:hidden"
          >
            <Search size={20} />
          </Button>

          {user && (
            <>
              {/* <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full relative group">
                        <MessageCircle size={20} />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-background ring-1 ring-background" />
                    </Button> */}

              <NotificationDropdown />
            </>
          )}

          {/* <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full mr-1">
                <ShoppingBag size={20} />
             </Button> */}

          {loading ? (
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden lg:block space-y-1 text-right">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse ml-auto" />
              </div>
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-3 outline-none group">
                  <div className="text-right hidden lg:block transition-opacity group-hover:opacity-80">
                    <p className="text-sm font-semibold text-foreground leading-none">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.fullName || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      @{user.username}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full p-0.5 bg-background border border-border/50 group-hover:border-primary/50 transition-colors shadow-sm relative">
                    <Avatar className="w-full h-full">
                      <AvatarImage
                        src={
                          api.getImageUrl(user.avatarUrl)
                        }
                      />
                      <AvatarFallback>
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-2"
                sideOffset={8}
              >
                <div className="px-2 py-1.5">
                  <p className="font-semibold text-sm">My Account</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg focus:bg-muted"
                  asChild
                >
                  <Link href={`/profile/${user.username}`}>
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg focus:bg-muted"
                  asChild
                >
                  <Link href="/settings/account">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3 pl-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold text-muted-foreground hover:text-foreground"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="rounded-full px-5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground"
        >
          <Menu size={24} />
        </Button>
      </div>
    </header>
  );
}
