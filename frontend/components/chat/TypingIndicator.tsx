"use client";

import React from "react";

export function TypingIndicator({ username }: { username?: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
            {username && (
                <span className="text-xs text-gray-500">
                    {username} is typing...
                </span>
            )}
        </div>
    );
}
