"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface OnlineStatusProps {
    isOnline: boolean;
    showText?: boolean;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function OnlineStatus({ isOnline, showText, className, size = "sm" }: OnlineStatusProps) {
    const sizeClasses = {
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4"
    };

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <span className={cn(
                "rounded-full",
                sizeClasses[size],
                isOnline ? "bg-green-500" : "bg-gray-400"
            )}></span>
            {showText && (
                <span className="text-xs text-gray-600">
                    {isOnline ? "Active now" : "Offline"}
                </span>
            )}
        </div>
    );
}
