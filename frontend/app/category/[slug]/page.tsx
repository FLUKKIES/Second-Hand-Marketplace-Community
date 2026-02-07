"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { GroupCard } from "@/components/social/GroupCard";
import { api, getErrorMessage } from "@/lib/api";
import { LayoutGrid, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { Group, Category } from "@/types";

export default function CategoryPage() {
  const params = useParams();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!params.slug) return;

      try {
        // Fetch category details by slug
        const category = await api.get<Category>(`/categories/${params.slug}`);
        setCategory(category);

        // Fetch groups in this category using the retrieved ID
        if (category?.id) {
          const groups = await api.get<Group[]>(
            `/groups?categoryId=${category.id}`,
          );
          setGroups(groups);
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [params.slug]);

  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!user) return;
      try {
        const myGroups = await api.get<any[]>("/groups/my-groups");
        const ids = new Set(myGroups.map((g) => g.groupId));
        setJoinedGroupIds(ids);
      } catch (error) {
        console.error("Failed to fetch my groups", error);
      }
    };

    fetchMyGroups();
  }, [user]);

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      toast.error("Please login to join groups");
      return;
    }

    try {
      // Optimistic update
      setJoinedGroupIds((prev) => new Set(prev).add(groupId));
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId) {
            const currentCount = g._count ?? { members: 0, posts: 0 };
            return {
              ...g,
              _count: {
                ...currentCount,
                members: currentCount.members + 1,
                posts: currentCount.posts
              }
            };
          }
          return g;
        })
      );

      await api.post(`/groups/${groupId}/join`, {});
      toast.success("Joined group successfully!");
    } catch (error) {
      // Revert on failure
      setJoinedGroupIds((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId) {
            const currentCount = g._count ?? { members: 0, posts: 0 };
            return {
              ...g,
              _count: {
                ...currentCount,
                members: Math.max(0, currentCount.members - 1),
                posts: currentCount.posts
              }
            };
          }
          return g;
        })
      );
      toast.error(getErrorMessage(error));
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      // Optimistic update
      setJoinedGroupIds((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId) {
            const currentCount = g._count ?? { members: 0, posts: 0 };
            return {
              ...g,
              _count: {
                ...currentCount,
                members: Math.max(0, currentCount.members - 1),
                posts: currentCount.posts
              }
            };
          }
          return g;
        })
      );

      await api.delete(`/groups/${groupId}/leave`);
      toast.success("Left group successfully");
    } catch (error) {
      // Revert on failure
      setJoinedGroupIds((prev) => new Set(prev).add(groupId));
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId) {
            const currentCount = g._count ?? { members: 0, posts: 0 };
            return {
              ...g,
              _count: {
                ...currentCount,
                members: currentCount.members + 1,
                posts: currentCount.posts
              }
            };
          }
          return g;
        })
      );
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50/50">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-4 px-2 md:px-2 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 align-start h-full">
          {/* Left Sidebar */}
          <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
            <LeftSidebar />
          </aside>

          {/* Main Content */}
          <div className="md:col-span-9 lg:col-span-9 flex flex-col gap-6 h-full overflow-y-auto pb-20 scrollbar-hide">
            {/* Header */}
            {/* Header */}
            {/* Header */}
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center min-h-[200px]">
              {category?.imageUrl ? (
                <>
                  <div className="absolute inset-0">
                    <img
                      src={api.getImageUrl(category.imageUrl)}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent" />
                  </div>
                </>
              ) : (
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/80 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              )}

              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="p-3 bg-indigo-50/80 backdrop-blur-sm rounded-xl text-indigo-600">
                    <LayoutGrid size={32} />
                  </div>
                  {category?.name || "Category"}
                </h1>
                <p className="text-gray-500 max-w-2xl text-lg leading-relaxed font-medium">
                  {category
                    ? `Discover communities in ${category.name}.`
                    : "Explore groups in this category."}
                </p>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={handleJoinGroup}
                  onLeave={handleLeaveGroup}
                  isJoined={joinedGroupIds.has(group.id)}
                />
              ))}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="text-gray-300" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No Groups Found
                </h3>
                <p className="text-gray-500">
                  Be the first to create a group in this category!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
