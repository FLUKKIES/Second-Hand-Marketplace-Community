"use client";

import { Post } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
    Globe,
    Heart,
    MessageCircle,
    MoreHorizontal,
    Share2,
    ShoppingBag,
    Check,
    Pencil,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { BuyNowDialog } from "@/components/marketplace/BuyNowDialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostCardProps {
    post: Post;
    onDelete?: (postId: string) => void;
    onUpdate?: () => void;
}

export function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
    const { user } = useAuth();
    const router = useRouter();
    const isSelling = post.type === "SELLING";
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const isOwnPost = user?.id === post.author.id;

    useEffect(() => {
        if (textRef.current) {
            // Check if content overflows (scrollHeight > clientHeight)
            // We compare with the max-height we set in CSS (roughly 5-6 lines)
            // e.g., if max-h is 160px.
            const { scrollHeight, clientHeight } = textRef.current;
            setIsTruncated(scrollHeight > clientHeight);
        }
    }, [post.content]);

    useEffect(() => {
        if (user) {
            api
                .get<{ liked: boolean }>(`/likes/post/${post.id}/check`)
                .then((res) => setLiked(res.liked))
                .catch((err) => console.error("Failed to check like status", err));
        }
    }, [post.id, user]);

    const handleLike = async () => {
        if (!user) {
            toast.error("Please login to like");
            return;
        }

        const newLiked = !liked;
        // Optimistic update
        setLiked(newLiked);
        setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

        try {
            await api.post(`/likes/${post.id}`);
        } catch (error) {
            // Revert on failure
            setLiked(!newLiked);
            setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
            toast.error("Failed to update like");
        }
    };

    const handleDeletePost = async () => {
        setIsDeleting(true);
        try {
            const res = await api.delete<{ message: string }>(`/posts/${post.id}`);
            toast.success("Post deleted", {
                description: res.message || "Post successfully deleted.",
            });
            setIsDeleteDialogOpen(false);

            if (onDelete) {
                onDelete(post.id);
            } else {
                window.location.reload();
            }
        } catch (error: any) {
            console.error("Failed to delete post", error);
            toast.error("Failed to delete post", {
                description: getErrorMessage(error) || "Something went wrong.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBuyNow = (product: any) => {
        if (!user) {
            router.push("/login");
            return;
        }
        setSelectedProduct(product);
        setIsBuyNowOpen(true);
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/post/${post.id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedLink(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border-2 border-border/50 overflow-hidden mb-6 hover:shadow-md hover:border-border/80 transition-all duration-300">
            {/* Header */}
            <div className="p-5 flex gap-4">
                <Link href={`/profile/${post.author.username}`}>
                    <Avatar className="h-11 w-11 cursor-pointer ring-2 ring-background border border-border/50 shadow-sm transition-transform hover:scale-105">
                        <AvatarImage
                            src={
                                api.getImageUrl(post.author.avatarUrl) // `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`
                            }
                            className="object-cover"
                        />
                        <AvatarFallback>
                            {post.author.username[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center flex-wrap gap-1.5 text-base">
                        <Link
                            href={`/profile/${post.author.username}`}
                            className="font-bold text-foreground hover:underline cursor-pointer"
                        >
                            {post.author.username}
                        </Link>
                        {post.group && (
                            <>
                                <span className="text-muted-foreground/50">▶</span>
                                <Link
                                    href={`/groups/${post.group.id}`}
                                    className="font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    {post.group.name}
                                </Link>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                            {formatDistanceToNow(new Date(post.createdAt), {
                                addSuffix: true,
                            })}
                        </span>
                        <span>·</span>
                        <Globe size={11} />
                    </div>
                </div>
                {isOwnPost && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:bg-muted rounded-full"
                            >
                                <MoreHorizontal size={20} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/groups/${post.group?.id || post.groupId}/posts/${post.id}/edit`}
                                    className="cursor-pointer flex items-center"
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Post
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Post
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Content */}
            <div className="px-5 pb-3">
                <Link href={`/post/${post.id}`} className="block group">
                    <div
                        ref={textRef}
                        className="text-foreground/90 text-[15px] leading-relaxed whitespace-pre-wrap transition-all relative line-clamp-5 max-h-[160px] overflow-hidden group-hover:text-foreground"
                    >
                        {post.content}
                    </div>

                    {/* Read more visual indicator */}
                    {isTruncated && (
                        <span
                            className="text-primary font-medium hover:underline text-sm mt-1 inline-block"
                        >
                            Read more
                        </span>
                    )}
                </Link>
            </div>

            {/* Images Grid */}
            {post.images && post.images.length > 0 && (
                <div
                    className={`grid gap-0.5 mt-2 overflow-hidden ${post.images.length === 1
                        ? "grid-cols-1 aspect-video"
                        : post.images.length === 2
                            ? "grid-cols-2 aspect-2/1"
                            : "grid-cols-2 aspect-square"
                        }`}
                >
                    {post.images.slice(0, 4).map((img, idx) => (
                        <Link
                            key={img.id}
                            href={`/post/${post.id}`}
                            className={`relative bg-muted block h-full w-full group/image overflow-hidden ${post.images.length === 3 && idx === 0 ? "row-span-2" : ""}`}
                        >
                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300 z-10" />
                            <img
                                src={api.getImageUrl(img.url)}
                                alt="Post content"
                                className="w-full h-full object-cover transition-transform duration-700"
                                loading="lazy"
                            />
                            {/* Show +N overlay if more than 4 images */}
                            {post.images.length > 4 && idx === 3 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm">
                                    +{post.images.length - 4}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}

            {/* Product Attachment (Selling Post Highlighting) */}
            {isSelling && post.products && post.products.length > 0 && (
                <div className="px-5 pb-4">
                    <div className="bg-muted/30 rounded-xl overflow-hidden border border-border/50">
                        {post.products.slice(0, 1).map((product) => (
                            <div
                                key={product.id}
                                className="flex gap-4 p-3 items-center group/product"
                            >
                                {/* Highlight Product Image */}
                                <div className="h-20 w-20 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center border border-border/50 overflow-hidden relative shadow-sm group-hover/product:border-primary/20 transition-colors">
                                    {product.imageUrl ? (
                                        <img
                                            src={api.getImageUrl(product.imageUrl)}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ShoppingBag
                                            className="text-muted-foreground/30"
                                            size={28}
                                        />
                                    )}
                                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-px rounded-full font-bold backdrop-blur-sm">
                                        {product._count?.offers ? `Wait ${product._count.offers}` : product.stock > 0 ? "Available" : "Sold out"}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className="font-bold text-base text-foreground truncate group-hover/product:text-primary transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="text-primary font-extrabold text-lg mt-0.5">
                                        ฿{parseInt(product.price).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                        {product.description || "In stock and ready to ship"}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {post.products.length > 1 && (
                            <Link
                                href={`/post/${post.id}`}
                                className="block bg-muted/50 px-3 py-2 text-xs font-medium text-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border-t border-border/50"
                            >
                                + {post.products.length - 1} more items available
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Engagement Stats */}
            <div className="px-5 py-3 flex items-center justify-between text-sm text-muted-foreground mt-1">
                {likeCount > 0 && (
                    <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                            <div className="bg-rose-500 rounded-full p-1 border-2 border-card shadow-sm z-10">
                                <Heart size={8} className="text-white fill-white" />
                            </div>
                        </div>
                        <span className="font-medium ml-1 text-foreground/80">
                            {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                        </span>
                    </div>
                )}
                {post._count.comments > 0 && (
                    <div className="flex gap-4 font-medium text-xs">
                        <span className="text-foreground/60">
                            {post._count.comments}{" "}
                            {post._count.comments === 1 ? "Comment" : "Comments"}
                        </span>
                    </div>
                )}
            </div>

            <Separator className="opacity-50" />

            {/* Footer Actions */}
            <TooltipProvider>
                <div className="flex px-2 py-1.5 gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 text-muted-foreground hover:bg-muted/50 rounded-xl transition-all text-sm font-semibold group active:scale-95 duration-200",
                                    liked && "text-rose-500 hover:text-rose-600 hover:bg-rose-50",
                                )}
                            >
                                <Heart
                                    size={20}
                                    className={cn(
                                        "transition-transform duration-300",
                                        liked ? "fill-current scale-110" : "group-hover:scale-110",
                                    )}
                                />
                                Like
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{liked ? "Unlike this post" : "Like this post"}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex-1 w-full flex items-center justify-center gap-2 py-2.5 text-muted-foreground hover:bg-muted/50 hover:text-primary rounded-xl transition-all text-sm font-semibold group active:scale-95 duration-200"
                                asChild
                            >
                                <Link href={`/post/${post.id}`}>
                                    <MessageCircle
                                        size={20}
                                        className="group-hover:scale-110 transition-transform duration-300"
                                    />{" "}
                                    Comment
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View comments</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleShare}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-muted-foreground hover:bg-muted/50 hover:text-green-500 rounded-xl transition-all text-sm font-semibold group active:scale-95 duration-200"
                            >
                                {copiedLink ? (
                                    <Check
                                        size={20}
                                        className="text-green-500 group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <Share2
                                        size={20}
                                        className="group-hover:scale-110 transition-transform duration-300"
                                    />
                                )}
                                {copiedLink ? "Copied!" : "Share"}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Copy link to clipboard</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeletePost}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedProduct && (
                <BuyNowDialog
                    open={isBuyNowOpen}
                    onOpenChange={setIsBuyNowOpen}
                    product={selectedProduct}
                    post={post}
                    onSuccess={onUpdate}
                />
            )}
        </div>
    );
}
