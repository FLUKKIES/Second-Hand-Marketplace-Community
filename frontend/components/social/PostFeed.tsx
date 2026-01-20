"use client";

import { useEffect, useState } from "react";
import { PostCard } from "./PostCard";
import { Post } from "@/types";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { api } from "@/lib/api";

interface PostFeedProps {
  type?: "NORMAL" | "SELLING";
  categoryId?: string;
  groupId?: string;
  authorId?: string;
}

export function PostFeed({
  type,
  categoryId,
  groupId,
  authorId,
}: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  const fetchPosts = async (pageNum: number) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "5",
      });
      if (type) params.append("type", type);
      if (categoryId) params.append("categoryId", categoryId);
      if (groupId) params.append("groupId", groupId);
      if (authorId) params.append("authorId", authorId);

      const newPosts = await api.get<Post[]>(`/posts?${params.toString()}`);
      if (Array.isArray(newPosts) && newPosts.length > 0) {
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        if (newPosts.length < 5) {
          setHasMore(false);
        }
      } else {
        if (pageNum === 1) {
          setPosts([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts(1);
  }, []);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [inView, hasMore, loading]);

  if (loading && page === 1) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full py-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={() => fetchPosts(1)} />
      ))}

      {hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          <Loader2 className="animate-spin text-muted-foreground w-6 h-6" />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No more posts to load
        </div>
      )}
    </div>
  );
}
