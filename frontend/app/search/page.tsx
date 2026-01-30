"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { api } from "@/lib/api";
import { PostCard } from "@/components/social/PostCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/common/Navbar";
import { SearchSidebar } from "@/components/search/SearchSidebar";
import { GroupCard } from "@/components/social/GroupCard";
import { UserCard } from "@/components/social/UserCard";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse filters from URL
  const keyword = searchParams.get("keyword") || "";
  const type = searchParams.get("type") || "posts"; // Default to posts
  const postType = searchParams.get("postType") || undefined; // Renamed to avoid collision
  const minPrice = searchParams.get("minPrice") || undefined;
  const maxPrice = searchParams.get("maxPrice") || undefined;
  const groupId = searchParams.get("groupId") || undefined;
  const sortBy = searchParams.get("sortBy") || "LATEST";

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setResults([]);
    try {
      if (type === "groups") {
        const params = new URLSearchParams();
        if (keyword) params.append("keyword", keyword);
        const data = await api.get<any[]>(`/groups?${params.toString()}`);
        setResults(data);
      } else if (type === "users") {
        const params = new URLSearchParams();
        if (keyword) params.append("keyword", keyword);
        const data = await api.get<any[]>(`/users/search?${params.toString()}`);
        setResults(data);
      } else {
        // Posts (Default)
        const params = new URLSearchParams();
        if (keyword) params.append("keyword", keyword);
        if (postType) params.append("type", postType);
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (sortBy) params.append("sortBy", sortBy);
        if (groupId) params.append("groupId", groupId);

        const data = await api.get<any[]>(`/posts/search?${params.toString()}`);
        setResults(data);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  }, [keyword, type, postType, minPrice, maxPrice, sortBy, groupId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      if (key === "sort") {
        params.set("sortBy", value);
      } else if (key === "type") {
        params.set("postType", value);
      } else {
        params.set(key, value);
      }
    } else {
      if (key === "sort") {
        params.delete("sortBy");
      } else if (key === "type") {
        params.delete("postType");
      } else {
        params.delete(key);
      }
    }
    setResults([]); // Clear results to prevent stale data flash
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword);
    // Keep top-level type
    if (type && type !== 'posts') params.append("type", type);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
      <Navbar />

      <main className="flex-1 container pt-4 px-2 md:px-2 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 align-start h-full">
          {/* Left Sidebar - Replaced with SearchSidebar */}
          <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
            <SearchSidebar />
          </aside>

          {/* Main Content Area */}
          <div className="md:col-span-9 lg:col-span-9 h-full overflow-y-auto pb-20 scrollbar-hide">
            {type === "posts" && (
              <div className="mb-6">
                <SearchFilters
                  filters={{
                    type: postType,
                    minPrice,
                    maxPrice,
                    sort: sortBy,
                  }}
                  onFilterChange={updateFilter}
                  onClear={clearFilters}
                />
              </div>
            )}

            <div className="flex flex-col gap-6">
              {/* Results List */}
              <div className="flex-1 min-w-0">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold capitalize">
                      {keyword ? `${type} matching "${keyword}"` : `All ${type}`}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {results.length} result(s) found
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : results.length > 0 ? (
                  <div className={type === "groups" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-6"}>
                    {type === "groups" && results.map((group) => (
                      // Guard: Ensure it's actually a group (has name, no author)
                      (group.name && !group.author) && (
                        <div key={group.id} className="h-[280px]">
                          <GroupCard group={group} isJoined={group.isJoined} />
                        </div>
                      )
                    ))}
                    {type === "users" && results.map((userResult) => (
                      // Guard: Ensure it matches user shape
                      (userResult.username || userResult.firstName) && (
                        <UserCard key={userResult.id} user={userResult} />
                      )
                    ))}
                    {(type === "posts" || !type) && results.map((post) => (
                      // Guard: Ensure it has an author (Post shape)
                      (post.author) && (
                        <PostCard key={post.id} post={post} />
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-muted-foreground">
                      No {type} found matching your criteria.
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
