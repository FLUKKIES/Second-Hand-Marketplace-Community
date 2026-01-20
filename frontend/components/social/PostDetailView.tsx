"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Post } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  ShoppingBag,
  ChevronLeft,
  X,
  Trash2,
  Copy,
  Check,
  Eye,
  Package,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CommentSection } from "@/components/social/CommentSection";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useRouter } from "next/navigation";
import { ImageViewer } from "@/components/ui/ImageViewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { MakeOfferButton } from "@/components/marketplace/MakeOfferButton";
import { BuyNowButton } from "@/components/marketplace/BuyNowButton";

interface PostDetailViewProps {
  postId: string;
  isModal?: boolean;
}

export function PostDetailView({
  postId,
  isModal = false,
}: PostDetailViewProps) {
  const { user } = useAuth();
  const { openChat } = useChat();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<
    string[] | { url: string }[]
  >([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      if (user) {
        try {
          const likeRes = await api.get<{ liked: boolean }>(
            `/likes/post/${postId}/check`,
          );
          setLiked(likeRes.liked);
        } catch (e) {
          console.error("Failed to check like status", e);
        }
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
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) {
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
      } else {
        router.back();
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

  const handleProfileNavigation = () => {
    if (!post) return;
    const profileUrl = `/profile/${post.author.username}`;
    if (isModal) {
      window.location.href = profileUrl;
    } else {
      router.push(profileUrl);
    }
  };

  // Content truncation logic
  const MAX_CONTENT_LENGTH = 300;
  const shouldTruncate =
    post?.content && post.content.length > MAX_CONTENT_LENGTH;
  const displayContent =
    shouldTruncate && !isExpanded
      ? post.content.substring(0, MAX_CONTENT_LENGTH) + "..."
      : post?.content;

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
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col animate-in fade-in-0 duration-500",
          isModal ? "h-full" : "min-h-screen",
        )}
      >
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-8",
            isModal && "gap-0",
          )}
        >
          {/* Left Column: Post Content & Images (2 cols) */}
          <div
            className={cn(
              "lg:col-span-2 space-y-6",
              isModal && "overflow-y-auto max-h-[90vh] p-6 lg:border-r",
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
                <Trash2 className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">
                  This post has been deleted by the author. The content is
                  visible for reference only.
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
              {/* Header */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between bg-gradient-to-b from-white to-gray-50/20">
                <div className="flex items-center gap-3">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Avatar className="border border-border/20 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition-all">
                        <AvatarImage
                          src={api.getImageUrl(post.author.avatarUrl)}
                        />
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
                          <AvatarImage
                            src={api.getImageUrl(post.author.avatarUrl)}
                          />
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

              {/* Content */}
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

              {/* Images Grid */}
              {post.images && post.images.length > 0 && (
                <div
                  className={cn(
                    "grid gap-1",
                    post.images.length === 1
                      ? "grid-cols-1"
                      : post.images.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2",
                  )}
                >
                  {post.images.map((img, i) => (
                    <div
                      key={img.id}
                      className={cn(
                        "relative aspect-square overflow-hidden bg-muted cursor-pointer group/image",
                        post.images.length === 3 && i === 0
                          ? "col-span-2 aspect-video"
                          : "",
                      )}
                      onClick={() => {
                        setViewerImages(post.images);
                        setViewerIndex(i);
                        setIsViewerOpen(true);
                      }}
                    >
                      {/* Image counter badge */}
                      {i === 0 && post.images.length > 1 && (
                        <div className="absolute top-2 right-2 z-20 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          1/{post.images.length}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300 z-10" />
                      <img
                        src={api.getImageUrl(img.url)}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div className="p-3 border-t border-border/40 flex items-center justify-between text-sm text-muted-foreground/80 bg-gray-50/30">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex-1 gap-2 hover:bg-muted/80 h-9 rounded-xl transition-all",
                        liked &&
                          "text-pink-600 hover:text-pink-700 hover:bg-pink-50",
                      )}
                      onClick={handleLike}
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
                      <span className="font-medium">
                        {post._count?.comments || 0}
                      </span>
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
                      onClick={handleShare}
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
              </div>
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
              isModal && "overflow-y-auto max-h-[90vh] p-6 bg-gray-50/50",
            )}
          >
            <div className={cn(!isModal && "sticky top-24", "space-y-6")}>
              {/* Product Info Card (If Selling) */}
              {post.type === "SELLING" && post.products.length > 0 ? (
                <>
                  {/* Product Selection List (If multiple products) */}
                  {post.products.length > 1 && (
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 mb-6">
                      <h4 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Select Option ({post.products.length} available)
                      </h4>
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                        {post.products.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => setSelectedProductId(product.id)}
                            className={cn(
                              "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border relative overflow-hidden",
                              selectedProductId === product.id
                                ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                : "bg-background hover:bg-muted/50 border-transparent hover:border-border/60",
                            )}
                          >
                            <div className="h-12 w-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden border border-border/40">
                              {product.imageUrl ? (
                                <img
                                  src={api.getImageUrl(product.imageUrl)}
                                  alt={product.name}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground/50">
                                  <ShoppingBag size={18} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 z-10">
                              <div
                                className={cn(
                                  "text-sm font-medium truncate transition-colors",
                                  selectedProductId === product.id
                                    ? "text-primary"
                                    : "text-foreground",
                                )}
                              >
                                {product.name}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                                ฿{Number(product.price).toLocaleString()}
                              </div>
                            </div>
                            {selectedProductId === product.id && (
                              <div className="h-2 w-2 rounded-full bg-primary shadow-sm mr-1 z-10 animate-in zoom-in-0 duration-200" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Product Details */}
                  {(() => {
                    const selectedProduct =
                      post.products.find((p) => p.id === selectedProductId) ||
                      post.products[0];
                    const stockLevel =
                      selectedProduct.stock <= 3
                        ? "low"
                        : selectedProduct.stock <= 10
                          ? "medium"
                          : "high";

                    return (
                      <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 relative overflow-hidden">
                        {/* decorative background blob */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-start justify-between mb-5 relative z-10">
                          <div className="flex gap-2">
                            <Badge
                              variant="secondary"
                              className="bg-green-100/80 text-green-700 hover:bg-green-100 border-green-200/60 transition-colors"
                            >
                              For Sale
                            </Badge>
                            {selectedProduct.stock <= 3 &&
                              selectedProduct.stock > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="bg-orange-100/80 text-orange-700 hover:bg-orange-100 border-orange-200/60 transition-colors animate-pulse"
                                >
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Limited
                                </Badge>
                              )}
                          </div>
                          <span className="text-3xl font-bold text-primary tracking-tight">
                            ฿{Number(selectedProduct.price).toLocaleString()}
                          </span>
                        </div>

                        <div
                          className="aspect-square w-full bg-muted/30 rounded-2xl mb-5 overflow-hidden border border-border/40 relative group shadow-inner cursor-zoom-in"
                          onClick={() => {
                            if (selectedProduct.imageUrl) {
                              setViewerImages([selectedProduct.imageUrl]);
                              setViewerIndex(0);
                              setIsViewerOpen(true);
                            }
                          }}
                        >
                          {selectedProduct.imageUrl ? (
                            <img
                              src={api.getImageUrl(selectedProduct.imageUrl)}
                              alt={selectedProduct.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                              <ShoppingBag size={64} strokeWidth={1.5} />
                            </div>
                          )}

                          {/* Overlay gradient */}
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <h2 className="text-xl font-bold text-foreground mb-2 leading-tight">
                          {selectedProduct.name}
                        </h2>

                        {/* Stock Indicator */}
                        <div className="mb-4 flex items-center gap-2">
                          <Package
                            className={cn(
                              "w-4 h-4",
                              stockLevel === "low"
                                ? "text-red-600"
                                : stockLevel === "medium"
                                  ? "text-orange-600"
                                  : "text-green-600",
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-medium",
                              stockLevel === "low"
                                ? "text-red-600"
                                : stockLevel === "medium"
                                  ? "text-orange-600"
                                  : "text-green-600",
                            )}
                          >
                            {selectedProduct.stock > 0
                              ? `${selectedProduct.stock} in stock`
                              : "Out of stock"}
                          </span>
                        </div>

                        <p className="text-muted-foreground text-sm mb-6 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/30">
                          {selectedProduct.description ||
                            "No description available."}
                        </p>

                        {selectedProduct.stock <= 0 && (
                          <div className="mb-4 text-center p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-medium text-sm flex items-center justify-center gap-2">
                            <X className="w-4 h-4" /> Out of Stock
                          </div>
                        )}

                        {/* Offer Status Check */}
                        {(() => {
                          const myOffers = selectedProduct.offers || [];
                          const alreadyOffered = myOffers.length > 0;

                          return (
                            <div className="space-y-3 relative z-10">
                              {selectedProduct.stock > 0 &&
                                !alreadyOffered &&
                                !post.deletedAt && (
                                  <div className="flex gap-2">
                                    <BuyNowButton
                                      productId={selectedProduct.id}
                                      productName={selectedProduct.name}
                                      productPrice={selectedProduct.price}
                                      onSuccess={fetchPost}
                                    />
                                    <MakeOfferButton
                                      productId={selectedProduct.id}
                                      productName={selectedProduct.name}
                                      productPrice={selectedProduct.price}
                                      onSuccess={fetchPost}
                                    />
                                  </div>
                                )}
                              {alreadyOffered && (
                                <div className="text-center text-xs text-orange-600 font-medium bg-orange-50 p-2 rounded-lg border border-orange-100">
                                  You have a pending offer for this item
                                </div>
                              )}
                              {user && user.id !== post.author.id && (
                                <Button
                                  variant="outline"
                                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 h-11 rounded-xl transition-all hover:border-blue-300 hover:-translate-y-0.25"
                                  onClick={() => {
                                    openChat(post.author as any);
                                  }}
                                >
                                  <MessageCircle className="w-5 h-5 mr-2" />
                                  Contact Seller
                                </Button>
                              )}
                            </div>
                          );
                        })()}

                        <div className="mt-6 pt-6 border-t border-dashed border-border">
                          <div className="flex items-center gap-3.5">
                            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600 border border-orange-100 shadow-sm">
                              <MapPin size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                Location
                              </p>
                              <p className="text-sm font-semibold text-foreground/90">
                                Bangkok, Thailand
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : null}

              {/* Author Actions (Delete) */}
              <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 relative overflow-hidden flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
                  Post Options
                </h3>
                {user?.id === post.author.id && !post.deletedAt && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-3 gap-2"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Post
                    </Button>
                  </div>
                )}
                {user?.id !== post.author.id && (
                  <div className="text-sm text-muted-foreground italic">
                    No actions available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />

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
      </div>
    </TooltipProvider>
  );
}

// Skeleton Loading Component
function PostDetailSkeleton({ isModal }: { isModal: boolean }) {
  return (
    <div className={cn("flex flex-col", isModal ? "h-full" : "min-h-screen")}>
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-3 gap-8",
          isModal && "gap-0",
        )}
      >
        {/* Left Column */}
        <div
          className={cn(
            "lg:col-span-2 space-y-6",
            isModal && "p-6 lg:border-r",
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
        <div className={cn("lg:col-span-1", isModal && "p-6 bg-gray-50/50")}>
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
