"use client"

import { useEffect, useState } from "react";
import { PostCard } from "@/components/social/PostCard";
import { Post } from "@/types";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";

export function MarketplaceFeed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // Build query string from searchParams
                // Backend expects: type=SELLING, keyword, minPrice, maxPrice, categoryId
                const params = new URLSearchParams();
                params.append("type", "SELLING");
                // Note: We might need to ensure backend supports 'type' in search. 
                // For now, we assume /posts/search is the correct endpoint for these filters.
                // If type is not supported in search dto, we might get mixed results.
                
                const q = searchParams.get("q");
                if (q) params.append("keyword", q); 

                const minPrice = searchParams.get("minPrice");
                if (minPrice) params.append("minPrice", minPrice);

                const maxPrice = searchParams.get("maxPrice");
                if (maxPrice) params.append("maxPrice", maxPrice);

                const categoryId = searchParams.get("categoryId");
                if (categoryId) params.append("categoryId", categoryId);

                // Use the search endpoint 
                const posts = await api.get<Post[]>(`/posts/search?${params.toString()}`);
                
                if (Array.isArray(posts)) {
                    setPosts(posts);
                } else {
                    setPosts([]);
                }
            } catch (error) {
                console.error("Failed to fetch marketplace posts:", error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [searchParams]);

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No items found matching your filters.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
