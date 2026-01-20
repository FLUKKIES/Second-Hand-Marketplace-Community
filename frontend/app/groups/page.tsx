"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Group } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { GroupCard } from "@/components/social/GroupCard";
import { Loader2, Users, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MyGroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!user) return;
      try {
        const myGroupsData = await api.get<{ group: Group }[]>(
          "/groups/my-groups"
        );
        const groups = myGroupsData.map((item) => item.group);
        setMyGroups(groups);
      } catch (error) {
        console.error("Failed to fetch my groups", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        fetchMyGroups();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const handleLeaveGroup = async (groupId: string) => {
    const groupToRestore = myGroups.find((g) => g.id === groupId);
    if (!groupToRestore) return;

    try {
      // Optimistic update: Remove from list immediately
      setMyGroups((prev) => prev.filter((g) => g.id !== groupId));

      await api.delete(`/groups/${groupId}/leave`);
      toast.success("Left group successfully");
    } catch (error) {
      // Revert on failure
      setMyGroups((prev) => [...prev, groupToRestore]);
      toast.error(getErrorMessage(error));
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50/50">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
      <Navbar />

      <main className="flex-1 container pt-4 px-2 md:px-2 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 align-start h-full">
          {/* Left Sidebar */}
          <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
            <LeftSidebar />
          </aside>

          {/* Main Content */}
          <div className="md:col-span-9 lg:col-span-9 flex flex-col gap-6 h-full overflow-y-auto pb-20 scrollbar-hide">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  My Groups
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Groups you have joined and participate in.
                </p>
              </div>
              <Link href="/marketplace">
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Search size={16} />
                  Discover More
                </Button>
              </Link>
            </div>

            {!user ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  Login Required
                </h3>
                <p className="text-gray-500 text-sm text-center max-w-sm mb-6">
                  Please login to view your groups and connect with your
                  community.
                </p>
                <Link href="/login">
                  <Button className="rounded-xl">Login Now</Button>
                </Link>
              </div>
            ) : myGroups.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map((group) => (
                  <div key={group.id} className="h-full">
                    <GroupCard
                      group={group}
                      isJoined={true}
                      onLeave={handleLeaveGroup}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  No Groups Yet
                </h3>
                <p className="text-gray-500 max-w-md mb-8">
                  You haven't joined any groups yet. Explore categories to find
                  communities that interest you!
                </p>
                <Link href="/marketplace">
                  <Button
                    size="lg"
                    className="px-8 shadow-lg shadow-indigo-500/20 rounded-xl"
                  >
                    Discover Groups
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
