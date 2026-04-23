"use client";

import React, { useState } from "react";
import { MessageReaction } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageReactionsProps {
    reactions?: MessageReaction[];
    onReact?: (emoji: string) => void;
    onRemoveReact?: () => void;
    currentUserId?: string;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageReactions({ reactions, onReact, onRemoveReact, currentUserId }: MessageReactionsProps) {
    const [showPicker, setShowPicker] = useState(false);

    // Group reactions by emoji
    const groupedReactions = reactions?.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return acc;
    }, {} as Record<string, MessageReaction[]>) || {};

    const currentUserReaction = reactions?.find(r => r.userId === currentUserId);

    const handleReact = (emoji: string) => {
        if (currentUserReaction) {
            if (currentUserReaction.emoji === emoji) {
                // Remove reaction if clicking the same emoji
                onRemoveReact?.();
            } else {
                // Change reaction
                onReact?.(emoji);
            }
        } else {
            // Add new reaction
            onReact?.(emoji);
        }
        setShowPicker(false);
    };

    return (
        <div className="relative">
            {/* Display existing reactions */}
            {Object.keys(groupedReactions).length > 0 && (
                <div className="flex gap-1 mb-1">
                    {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
                        const isCurrentUser = reactionList.some(r => r.userId === currentUserId);
                        return (
                            <button
                                key={emoji}
                                onClick={() => handleReact(emoji)}
                                className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors",
                                    isCurrentUser 
                                        ? "bg-blue-100 border border-blue-300" 
                                        : "bg-gray-100 border border-gray-200 hover:bg-gray-200"
                                )}
                            >
                                 <span>{emoji}</span>
                                <span className={cn(
                                    "text-[10px]",
                                    isCurrentUser ? "text-blue-600 font-medium" : "text-gray-600"
                                )}>
                                    {reactionList.length}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Reaction picker - positioned on the right to prevent overflow */}
            {showPicker && (
                <div className="absolute bottom-full right-0 mb-1 flex gap-1 bg-white shadow-lg border border-gray-200 rounded-lg p-2 z-10">
                    {QUICK_REACTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleReact(emoji)}
                            className="text-lg hover:scale-125 transition-transform"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Add reaction button (optional, can be triggered via right-click) */}
            <button
                onClick={() => setShowPicker(!showPicker)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
                {!Object.keys(groupedReactions).length && "React"}
            </button>
        </div>
    );
}
