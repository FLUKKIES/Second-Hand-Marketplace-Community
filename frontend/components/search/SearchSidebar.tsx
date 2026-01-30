"use client";

import {
    FileText,
    Users,
    User,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const searchTypes = [
    { name: "Posts", icon: FileText, type: "posts", href: "/search" }, // Default
    { name: "Groups", icon: Users, type: "groups", href: "/search" },
    { name: "People", icon: User, type: "users", href: "/search" },
];

export function SearchSidebar() {
    const searchParams = useSearchParams();
    const currentType = searchParams.get("type") || "posts";
    const keyword = searchParams.get("keyword") || "";

    return (
        <div className="space-y-4">
            {/* Title Header */}
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                <h3 className="font-semibold text-foreground">Search Results</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Filter your search by category
                </p>
            </div>

            {/* Navigation */}
            <nav className="bg-card rounded-2xl p-2 shadow-sm border border-border/50 space-y-1">
                {searchTypes.map((item) => {
                    const isActive = currentType === item.type || (currentType === undefined && item.type === "posts");

                    // Construct URL keeping existing params but changing type
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("type", item.type);
                    // Ensure we keep keyword
                    if (keyword) params.set("keyword", keyword);

                    return (
                        <Link
                            key={item.name}
                            href={`/search?${params.toString()}`}
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
        </div>
    );
}
