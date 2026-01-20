"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Post } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart, MessageCircle, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostActionsProps {
  post: Post;
  liked: boolean;
  likeCount: number;
  copiedLink: boolean;
  onLike: (isLoggedIn: boolean) => void;
  onShare: () => void;
}

export function PostActions({
  post,
  liked,
  likeCount,
  copiedLink,
  onLike,
  onShare,
}: PostActionsProps) {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="p-3 border-t border-border/40 flex items-center justify-between text-sm text-muted-foreground/80 bg-gray-50/30">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex-1 gap-2 hover:bg-muted/80 h-9 rounded-xl transition-all",
                liked && "text-pink-600 hover:text-pink-700 hover:bg-pink-50",
              )}
              onClick={() => onLike(isLoggedIn)}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-all",
                  liked &&
                    "fill-current scale-110 animate-in zoom-in-110 duration-200",
                )}
              />
              <span className="font-medium">{likeCount}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{liked ? "Unlike" : "Like"} this post</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border/40" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="flex-1 gap-2 hover:bg-muted/80 h-9 rounded-xl transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{post._count?.comments || 0}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View comments</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border/40" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="flex-1 gap-2 hover:bg-muted/80 h-9 rounded-xl transition-all"
              onClick={onShare}
            >
              {copiedLink ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
              <span className="font-medium">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy link to clipboard</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
