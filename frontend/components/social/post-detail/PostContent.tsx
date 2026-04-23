"use client";

import { useState } from "react";
import { Post } from "@/types";

interface PostContentProps {
    post: Post;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

export function PostContent({ post, isExpanded, setIsExpanded }: PostContentProps) {
    const MAX_CONTENT_LENGTH = 300;
    const shouldTruncate =
        post?.content && post.content.length > MAX_CONTENT_LENGTH;
    const displayContent =
        shouldTruncate && !isExpanded
            ? post.content.substring(0, MAX_CONTENT_LENGTH) + "..."
            : post?.content;

    return (
        <div className="p-4">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {displayContent}
            </p>
            {shouldTruncate && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary text-sm font-medium mt-2 hover:underline focus:outline-none"
                >
                    {isExpanded ? "Show less" : "Read more"}
                </button>
            )}
        </div>
    );
}
