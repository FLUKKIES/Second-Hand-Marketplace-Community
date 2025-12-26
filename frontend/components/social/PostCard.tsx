import { Post, PostType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Globe, Heart, MessageCircle, MoreHorizontal, Share2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    const isSelling = post.type === 'SELLING';

    return (
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border overflow-hidden mb-6 hover:shadow-md transition-shadow duration-300">
            {/* Header */}
            <div className="p-5 flex gap-4">
                <Avatar className="h-11 w-11 cursor-pointer ring-2 ring-offset-2 ring-gray-50">
                    <AvatarImage src={post.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`} />
                    <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center flex-wrap gap-1.5 text-base">
                        <span className="font-bold text-gray-900 dark:text-foreground hover:underline cursor-pointer">
                            {post.author.username}
                        </span>
                        {post.group && (
                            <>
                                <span className="text-gray-300">▶</span>
                                <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">
                                    {post.group.name}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        <span>·</span>
                        <Globe size={11} />
                    </div>
                </div>
                <button className="text-gray-400 hover:bg-gray-50 p-2 rounded-full transition-colors self-start">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-3">
                 <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Product Attachment (Selling Post Highlighting) */}
            {isSelling && post.products.length > 0 && (
                <div className="px-5 pb-3">
                    <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl overflow-hidden p-1">
                         {post.products.map(product => (
                             <div key={product.id} className="flex gap-4 p-3 items-center bg-white rounded-lg shadow-sm">
                                 {/* Highlight Product Image */}
                                 <div className="h-24 w-24 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden relative">
                                      {product.imageUrl ? (
                                         <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                      ) : (
                                         <ShoppingBag className="text-indigo-200" size={32} />
                                      )}
                                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                          Wait {product.stock}
                                      </div>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <h3 className="font-bold text-lg text-gray-900 truncate">{product.name}</h3>
                                     <div className="text-primary font-extrabold text-xl mt-0.5">฿{parseInt(product.price).toLocaleString()}</div>
                                     <div className="text-sm text-gray-500 mt-1 line-clamp-1">{product.description || "In stock and ready to ship"}</div>
                                 </div>
                                 <button className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 shadow-md transition-transform active:scale-95 whitespace-nowrap">
                                     Buy Now
                                 </button>
                             </div>
                         ))}
                    </div>
                </div>
            )}

            {/* Images Grid */}
            {post.images && post.images.length > 0 && (
                 <div className={`grid gap-1 mt-2 overflow-hidden ${
                        post.images.length === 1 ? 'grid-cols-1 aspect-video' 
                        : post.images.length === 2 ? 'grid-cols-2 aspect-[2/1]' 
                        : 'grid-cols-2 aspect-square'
                    }`}>
                    {post.images.slice(0, 4).map((img, idx) => (
                        <div key={img.id} className={`relative bg-gray-100 ${post.images.length === 3 && idx === 0 ? 'row-span-2' : ''}`}>
                             <img 
                                src={img.url} 
                                alt="Post content" 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                             />
                             {/* Show +N overlay if more than 4 images */}
                             {post.images.length > 4 && idx === 3 && (
                                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm">
                                     +{post.images.length - 4}
                                 </div>
                             )}
                        </div>
                    ))}
                 </div>
            )}

            {/* Engagement Stats */}
            <div className="px-5 py-3 flex items-center justify-between text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                         <div className="bg-blue-500 rounded-full p-1 border-2 border-white">
                              <Heart size={10} className="text-white fill-white" />
                         </div>
                         <div className="bg-green-500 rounded-full p-1 border-2 border-white">
                              <Heart size={10} className="text-white fill-white" />
                         </div>
                    </div>
                    <span className="font-medium">{post._count.likes} Likes</span>
                </div>
                <div className="flex gap-4 font-medium">
                    <span className="hover:underline cursor-pointer">{post._count.comments} Comments</span>
                    <span className="hover:underline cursor-pointer">Share</span>
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Footer Actions */}
            <div className="flex px-2 py-1.5">
                 <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-500 hover:bg-gray-50 hover:text-red-500 rounded-lg transition-all text-sm font-semibold group">
                     <Heart size={20} className="group-hover:scale-110 transition-transform" /> Like
                 </button>
                 <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-500 hover:bg-gray-50 hover:text-blue-500 rounded-lg transition-all text-sm font-semibold group">
                     <MessageCircle size={20} className="group-hover:scale-110 transition-transform" /> Comment
                 </button>
                 <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-500 hover:bg-gray-50 hover:text-green-500 rounded-lg transition-all text-sm font-semibold group">
                     <Share2 size={20} className="group-hover:scale-110 transition-transform" /> Share
                 </button>
            </div>
        </div>
    );
}
