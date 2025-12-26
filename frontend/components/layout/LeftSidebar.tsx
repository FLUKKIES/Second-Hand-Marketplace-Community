"use client"

import { Home, ShoppingBag, Users, Bookmark, Settings, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const navItems = [
    { name: "Feed", icon: Home, href: "/" },
    { name: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
    { name: "Groups", icon: Users, href: "/groups" },
    { name: "Saved", icon: Bookmark, href: "/saved" },
    { name: "Settings", icon: Settings, href: "/settings" },
];

export function LeftSidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // user profile
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <div className="space-y-6">
            {/* Mini Profile */}
            {user ? (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                        <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{user.username}</h3>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 shadow-sm text-white text-center">
                    <div className="flex justify-center mb-2">
                         <div className="bg-white/20 p-2 rounded-full">
                             <User size={20} className="text-white" />
                         </div>
                    </div>
                    <p className="text-sm font-semibold mb-2">Join the community!</p>
                    <p className="text-xs text-indigo-100 mb-3">Login to customize your feed.</p>
                    <Link href="/login" className="inline-block w-full py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                        Log In
                    </Link>
                </div>
            )}

            {/* Navigation */}
            <nav className="bg-white rounded-xl p-2 shadow-sm border border-gray-100">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.name} 
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                isActive 
                                    ? "bg-indigo-50 text-indigo-600" 
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <item.icon size={20} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

             <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col gap-2 text-xs text-gray-400">
                    <div className="flex gap-2 flex-wrap">
                        <Link href="#" className="hover:underline">About</Link>
                        <Link href="#" className="hover:underline">Privacy</Link>
                        <Link href="#" className="hover:underline">Terms</Link>
                    </div>
                    <p>© 2024 SocialMart</p>
                </div>
             </div>
        </div>
    );
}
