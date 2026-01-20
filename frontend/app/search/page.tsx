"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { api } from "@/lib/api";
import { PostCard } from "@/components/social/PostCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse filters from URL
  const keyword = searchParams.get("keyword") || "";
  const type = searchParams.get("type") || undefined;
  const minPrice = searchParams.get("minPrice") || undefined;
  const maxPrice = searchParams.get("maxPrice") || undefined;
  // Rename 'sortBy' -> 'sort' in backend DTO? No, backend DTO uses `sortBy`.
  // Wait, let's check SearchPostDto. It uses `sortBy`.
  // My SearchFilters component uses `sort`. Let's map it.
  const sortBy = searchParams.get("sortBy") || "LATEST";

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (type) params.append("type", type);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (sortBy) params.append("sortBy", sortBy);

      const data = await api.get<any[]>(`/posts/search?${params.toString()}`);
      setPosts(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  }, [keyword, type, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      // Map 'sort' from filter component to 'sortBy' for URL/Backend
      if (key === "sort") {
        params.set("sortBy", value);
      } else {
        params.set(key, value);
      }
    } else {
      if (key === "sort") {
        params.delete("sortBy");
      } else {
        params.delete(key);
      }
    }
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    // Keep keyword, clear others? Or clear all? Usually clear filters keeps keyword.
    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
      <Navbar />

      <main className="flex-1 container pt-4 px-2 md:px-2 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 align-start h-full">
          {/* Left Sidebar */}
          <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
            <LeftSidebar />
          </aside>

          {/* Main Content Area */}
          <div className="md:col-span-9 lg:col-span-9 h-full overflow-y-auto pb-20 scrollbar-hide">
            <div className="mb-6">
              <SearchFilters
                filters={{
                  type,
                  minPrice,
                  maxPrice,
                  sort: sortBy,
                }}
                onFilterChange={updateFilter}
                onClear={clearFilters}
              />
            </div>

            <div className="flex flex-col gap-6">
              {/* Results List */}
              <div className="flex-1 min-w-0">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold">
                      {keyword ? `Results for "${keyword}"` : "All Posts"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {posts.length} result(s) found
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-muted-foreground">
                      No posts found matching your criteria.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="text-primary text-sm font-medium mt-2 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-8 flex justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
