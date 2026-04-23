"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Post } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useChat } from "@/contexts/ChatContext";

interface PostHeaderProps {
  post: Post;
  isModal?: boolean;
}

export function PostHeader({ post, isModal }: PostHeaderProps) {
  const { user } = useAuth();
  const { openChat } = useChat();
  const router = useRouter();

  const handleProfileNavigation = () => {
    if (!post) return;
    const profileUrl = `/profile/${post.author.username}`;
    if (isModal) {
      window.location.href = profileUrl;
    } else {
      router.push(profileUrl);
    }
  };

  return (
    <div className="p-4 border-b border-border/40 flex items-center justify-between bg-gradient-to-b from-white to-gray-50/20">
      <div className="flex items-center gap-3">
        <HoverCard>
          <HoverCardTrigger asChild>
            <Avatar className="border border-border/20 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition-all">
              <AvatarImage src={api.getImageUrl(post.author.avatarUrl)} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                {post.author.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <Avatar
                className="h-12 w-12 cursor-pointer"
                onClick={handleProfileNavigation}
              >
                <AvatarImage src={api.getImageUrl(post.author.avatarUrl)} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  {post.author.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <h4
                  className="text-sm font-semibold cursor-pointer hover:underline"
                  onClick={handleProfileNavigation}
                >
                  @{post.author.username}
                </h4>
                <p className="text-sm">
                  {post.author.firstName} {post.author.lastName}
                </p>
                {post.author.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.author.bio}
                  </p>
                )}
                <div className="flex items-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Joined{" "}
                    {new Date(
                      post.author.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 mt-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8"
                    onClick={handleProfileNavigation}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    className="w-full h-8 px-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        router.push("/login");
                        return;
                      }
                      if (user.id !== post.author.id) {
                        openChat(post.author as any);
                      } else {
                        toast.error("You cannot chat with yourself");
                      }
                    }}
                  >
                    Chat
                  </Button>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        <div>
          <h3
            className="font-semibold text-foreground text-base cursor-pointer hover:underline transition-all"
            onClick={handleProfileNavigation}
          >
            {post.author.fullName || post.author.username}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span>
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </span>
            {post.group && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-semibold border border-indigo-100/50 hover:bg-indigo-100 transition-colors">
                  {post.group.name}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
