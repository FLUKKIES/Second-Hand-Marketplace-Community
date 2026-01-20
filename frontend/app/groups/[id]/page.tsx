"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Group } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PostFeed } from "@/components/social/PostFeed";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Users, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RightSidebar } from "@/components/layout/RightSidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Dialog states
  const [confirmJoinOpen, setConfirmJoinOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const group = await api.get<Group>(`/groups/${id}`);

        setGroup(group);

        if (user) {
          const myGroups =
            await api.get<{ group: Group }[]>("/groups/my-groups");
          const isMember = myGroups.some((m) => m.group.id === id);
          setIsJoined(isMember);
        }
      } catch (error) {
        console.error("Failed to fetch group details", error);
        toast.error("Failed to load group details");
        router.push("/groups");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, user, router]);

  const handleJoinClick = () => {
    if (!user) {
      toast.error("Please login to join groups");
      router.push("/login");
      return;
    }

    if (isJoined) {
      setConfirmLeaveOpen(true);
    } else {
      setConfirmJoinOpen(true);
    }
  };

  const confirmJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/groups/${id}/join`);
      toast.success("Joined group successfully");
      setIsJoined(true);
      setConfirmJoinOpen(false);
    } catch (error) {
      console.error("Failed to join group", error);
      toast.error("Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  const confirmLeave = async () => {
    setJoining(true);
    try {
      await api.delete(`/groups/${id}/leave`);
      toast.success("Left group successfully");
      setIsJoined(false);
      setConfirmLeaveOpen(false);
    } catch (error) {
      console.error("Failed to leave group", error);
      toast.error("Failed to leave group");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50/50">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!group) return null;

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
          <div className="md:col-span-9 lg:col-span-6 flex flex-col gap-2 h-full overflow-y-auto pb-16 scrollbar-hide">
            {/* Group Header */}
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden shrink-0">
              {/* Cover Image (Background) */}
              <div className="h-56 md:h-72 bg-linear-to-r from-primary/80 to-purple-600 relative group">
                {group.backgroundUrl ? (
                  <img
                    src={api.getImageUrl(group.backgroundUrl)}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <Users className="text-white w-24 h-24" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              </div>

              <div className="px-6 pb-6 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-20 gap-6 mb-4">
                  {/* Profile Image */}
                  <div className="shrink-0 relative z-10">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-card bg-white shadow-md overflow-hidden flex items-center justify-center">
                      {group.imageUrl ? (
                        <img
                          src={api.getImageUrl(group.imageUrl)}
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 pt-2 md:pt-0">
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                      {group.name}
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-2xl line-clamp-2">
                      {group.description || "No description"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 mt-4 md:mt-0">
                    {user && (
                      <Button
                        onClick={handleJoinClick}
                        disabled={joining}
                        variant={isJoined ? "outline" : "default"}
                        className={`min-w-[120px] rounded-xl font-semibold transition-all shadow-sm ${
                          isJoined
                            ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25"
                        }`}
                      >
                        {joining ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isJoined ? (
                          <>
                            <LogOut className="w-4 h-4 mr-2" />
                            Leave Group
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Join Group
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium text-foreground">
                      {group._count?.members || 0}
                    </span>{" "}
                    Members
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Active Now
                  </span>
                </div>
              </div>
            </div>

            {/* Create Post Input */}
            {isJoined && (
              <Link href={`/groups/${group.id}/create-post`}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-indigo-100 transition-colors cursor-text group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold shrink-0 overflow-hidden border border-indigo-100">
                      {user?.avatarUrl ? (
                        <img
                          src={api.getImageUrl(user.avatarUrl)}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.username?.[0]?.toUpperCase() || "U"
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 h-10 rounded-full px-4 flex items-center text-gray-400 text-sm group-hover:bg-indigo-50/50 transition-colors">
                      What&apos;s on your mind? ...
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Posts Feed */}
            <div className="space-y-2">
              <PostFeed groupId={group.id} />
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
            <RightSidebar />
          </aside>
        </div>
      </main>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmJoinOpen} onOpenChange={setConfirmJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {group.name}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to join this group? You will be able to post
              and interact with other members.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmJoinOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmJoin}>Confirm Join</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave {group.name}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave? You will no longer receive updates
              from this group.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLeaveOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLeave}>
              Leave Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
