"use client";

import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Post } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UsePostDetailProps {
    postId: string;
    isModal?: boolean;
}

export function usePostDetail({ postId, isModal = false }: UsePostDetailProps) {
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Initial product selection effect
    useEffect(() => {
        if (post && post.products && post.products.length > 0) {
            setSelectedProductId(post.products[0].id);
        }
    }, [post]);

    const fetchPost = async () => {
        try {
            const post = await api.get<Post>(`/posts/${postId}`);
            setPost(post);
            setLikeCount(post._count?.likes || 0);

            // Check if liked
            // Note: In the original component, it checked if (user) was present.
            // Component should pass user status or handle it internally if api handles auth token automatically.
            // Assuming API handles auth context for now, or we might need to modify to accept user context if strictly needed in hook.
            // For now, let's keep it simple. If 401, it just won't be liked.
            try {
                // Checking like status only makes sense if we have a way to know we are logged in.
                // But typically if we are token-based, we can just try.
                const likeRes = await api.get<{ liked: boolean }>(
                    `/likes/post/${postId}/check`,
                );
                setLiked(likeRes.liked);
            } catch (e) {
                // Likely not logged in or error
            }
        } catch (error) {
            console.error("Failed to fetch post", error);
            toast.error("Failed to load post");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const handleLike = async (isLoggedIn: boolean) => {
        if (!isLoggedIn) {
            toast.error("Please login to like");
            return;
        }

        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

        try {
            await api.post(`/likes/${postId}`);
        } catch (error) {
            // Revert
            setLiked(!newLiked);
            setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
            console.error("Failed to toggle like", error);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/post/${postId}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedLink(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    const handleDeletePost = async () => {
        setIsDeleting(true);
        try {
            const res = await api.delete<{ message: string }>(`/posts/${postId}`);
            toast.success("Post deleted", {
                description: res.message || "Your post has been successfully deleted.",
            });
            setIsDeleteDialogOpen(false);

            if (isModal) {
                router.back();
                setTimeout(() => {
                    // Refresh the background page to remove the deleted post from the list
                    router.refresh();
                }, 100);
            } else {
                router.replace("/");
                router.refresh();
            }
        } catch (error: any) {
            console.error("Failed to delete post", error);
            const message = getErrorMessage(error) || "Something went wrong.";
            toast.error("Failed to delete post", {
                description: message,
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        post,
        loading,
        liked,
        likeCount,
        selectedProductId,
        setSelectedProductId,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        isDeleting,
        copiedLink,
        handleLike,
        handleShare,
        handleDeletePost,
        fetchPost,
    };
}
