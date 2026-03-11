"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentSection } from "@/components/social/CommentSection";
import { usePostDetail } from "@/hooks/usePostDetail";
import { PostHeader } from "./post-detail/PostHeader";
import { PostContent } from "./post-detail/PostContent";
import { PostImages } from "./post-detail/PostImages";
import { PostActions } from "./post-detail/PostActions";
import { ProductSection } from "./post-detail/ProductSection";
import { PostOwnerActions } from "./post-detail/PostOwnerActions";
import { useState } from "react";
import { X } from "lucide-react";

interface PostDetailViewProps {
    postId: string;
    isModal?: boolean;
}

export function PostDetailView({
    postId,
    isModal = false,
}: PostDetailViewProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    const {
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
    } = usePostDetail({ postId, isModal });

    if (loading) {
        return <PostDetailSkeleton isModal={isModal} />;
    }

    if (!post) {
        return (
            <div className="flex-1 container max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
                        <X className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Post not found</h1>
                    <p className="text-gray-500">
                        The post you are looking for might have been removed or doesn't
                        exist.
                    </p>
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="mt-4"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col animate-in fade-in-0 duration-500",
                isModal ? "h-full overflow-y-auto lg:overflow-hidden" : "min-h-screen",
            )}
        >
            <div
                className={cn(
                    "grid grid-cols-1 lg:grid-cols-3 gap-8",
                    isModal && "gap-0 lg:h-full",
                )}
            >
                {/* Left Column: Post Content & Images (2 cols) */}
                <div
                    className={cn(
                        "lg:col-span-2 space-y-6",
                        isModal && "p-6 lg:overflow-y-auto lg:h-full lg:border-r",
                    )}
                >
                    {!isModal && (
                        <Button
                            variant="ghost"
                            className="mb-4 gap-2 text-gray-500 hover:text-gray-900 pl-0 hover:bg-transparent transition-colors"
                            onClick={() => router.back()}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </Button>
                    )}

                    {post.deletedAt && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <Trash2 className="w-5 h-5 shrink-0" />
                            <span className="font-medium">
                                This post has been deleted by the author. The content is visible
                                for reference only.
                            </span>
                        </div>
                    )}

                    {/* Post Card */}
                    <div
                        className={cn(
                            "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md",
                            isModal && "shadow-none border-0",
                        )}
                    >
                        <PostHeader post={post} isModal={isModal} />

                        <PostContent
                            post={post}
                            isExpanded={isExpanded}
                            setIsExpanded={setIsExpanded}
                        />

                        <PostImages post={post} />

                        <PostActions
                            post={post}
                            liked={liked}
                            likeCount={likeCount}
                            copiedLink={copiedLink}
                            onLike={handleLike}
                            onShare={handleShare}
                        />
                    </div>

                    {/* Comments Section Component */}
                    <div className={cn(isModal && "pb-6")}>
                        <CommentSection postId={post.id} />
                    </div>
                </div>

                {/* Right Column: Product Details (1 col) - Sticky */}
                <div
                    className={cn(
                        "lg:col-span-1",
                        isModal && "p-6 bg-gray-50/50 lg:overflow-y-auto lg:h-full",
                    )}
                >
                    <div className="space-y-6">
                        <ProductSection
                            post={post}
                            selectedProductId={selectedProductId}
                            setSelectedProductId={setSelectedProductId}
                            onUpdate={fetchPost}
                            isModal={isModal}
                        />

                        <PostOwnerActions
                            post={post}
                            isDeleteDialogOpen={isDeleteDialogOpen}
                            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                            isDeleting={isDeleting}
                            onDelete={handleDeletePost}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Skeleton Loading Component
function PostDetailSkeleton({ isModal }: { isModal: boolean }) {
    return (
        <div
            className={cn(
                "flex flex-col",
                isModal ? "h-full overflow-hidden" : "min-h-screen",
            )}
        >
            <div
                className={cn(
                    "grid grid-cols-1 lg:grid-cols-3 gap-8",
                    isModal && "gap-0 h-full",
                )}
            >
                {/* Left Column */}
                <div
                    className={cn(
                        "lg:col-span-2 space-y-6",
                        isModal && "p-6 overflow-y-auto h-full border-r",
                    )}
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 space-y-4">
                        {/* Header skeleton */}
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        {/* Content skeleton */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        {/* Image skeleton */}
                        <Skeleton className="w-full aspect-square rounded-lg" />
                        {/* Actions skeleton */}
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 flex-1" />
                        </div>
                    </div>
                </div>
                {/* Right Column */}
                <div
                    className={cn(
                        "lg:col-span-1 hidden lg:block",
                        isModal && "p-6 bg-gray-50/50 overflow-y-auto h-full",
                    )}
                >
                    <div className="space-y-6">
                        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                            <Skeleton className="h-6 w-24 mb-4" />
                            <Skeleton className="w-full aspect-square rounded-xl mb-4" />
                            <Skeleton className="h-6 w-full mb-2" />
                            <Skeleton className="h-20 w-full mb-4" />
                            <Skeleton className="h-11 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
