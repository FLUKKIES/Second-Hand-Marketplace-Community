"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MessageCircle, MapPin, Calendar, Star, Package, Flag, Ban, AlertTriangle, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { ReviewList } from "@/components/profile/ReviewList";
import { PostFeed } from "@/components/social/PostFeed";
import { ReportModal } from "@/components/report-modal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
    id: string;
    username: string;
    email?: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
    warningCount: number;
    posts?: any[]; // Array of posts from backend
    followersCount?: number;
    followingCount?: number;
    isFollowing?: boolean;
    rating?: number;
    reviewCount?: number;
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const { user } = useAuth();
    const { openChat, isUserOnline } = useChat();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState<'FOLLOW' | 'UNFOLLOW' | null>(null);

    const executeFollow = async () => {
        if (!profile) return;
        setIsFollowLoading(true);
        try {
            await api.post(`/users/${profile.id}/follow`);
            setProfile(prev => prev ? ({
                ...prev,
                isFollowing: true,
                followersCount: (prev.followersCount || 0) + 1
            }) : null);
            toast.success(`You are now following ${profile.username}`);
        } catch (error) {
            toast.error("Failed to follow user");
        } finally {
            setIsFollowLoading(false);
            setPendingAction(null);
        }
    };

    const executeUnfollow = async () => {
        if (!profile) return;
        setIsFollowLoading(true);
        try {
            await api.delete(`/users/${profile.id}/follow`);
            setProfile(prev => prev ? ({
                ...prev,
                isFollowing: false,
                followersCount: Math.max((prev.followersCount || 0) - 1, 0)
            }) : null);
            toast.success(`Unfollowed ${profile.username}`);
        } catch (error) {
            toast.error("Failed to unfollow user");
        } finally {
            setIsFollowLoading(false);
            setPendingAction(null);
        }
    };

    const handleConfirmAction = () => {
        if (pendingAction === 'FOLLOW') {
            executeFollow();
        } else if (pendingAction === 'UNFOLLOW') {
            executeUnfollow();
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get<UserProfile>(`/users/${username}`);
                setProfile(data);
            } catch (error) {
                console.error("Failed to fetch profile", error);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfile();
        }
    }, [username]);

    if (loading) {
        return (
            <div className="flex flex-col h-screen bg-gray-50/50">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col h-screen bg-gray-50/50">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800">User not found</h1>
                        <p className="text-gray-500 mt-2">
                            The user you are looking for does not exist.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isOwnProfile = user?.id === profile.id;

    return (
        <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
            <Navbar />

            <main className="flex-1 pt-4 px-2 md:px-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 align-start h-full">
                    {/* Left Sidebar (25% ~ 3 cols) - Hidden on mobile */}
                    <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
                        <LeftSidebar />
                    </aside>

                    {/* Main Content (75% ~ 9 cols) */}
                    <div className="md:col-span-9 lg:col-span-9 flex flex-col h-full overflow-y-auto scrollbar-hide">
                        {/* Warning Banner */}
                        {(isOwnProfile || user?.role === "ADMIN") && profile.warningCount > 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            <span className="font-medium">Account Warning: </span>
                                            You have received {profile.warningCount} warning(s) for violating community guidelines.
                                            Further violations may result in account suspension.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Header Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-1">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                {/* Avatar */}
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                        <AvatarImage src={api.getImageUrl(profile.avatarUrl)} />
                                        <AvatarFallback className="bg-gray-100 text-gray-400">
                                            <Users className="h-10 w-10" />
                                        </AvatarFallback>
                                    </Avatar>
                                    {isUserOnline(profile.id) && (
                                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white shadow-sm" title="Online" />
                                    )}
                                </div>

                                {/* Profile Info */}
                                <div className="flex-1 w-full">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3 justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                                {profile.firstName && profile.lastName
                                                    ? `${profile.firstName} ${profile.lastName}`
                                                    : profile.username}
                                            </h1>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-gray-500">@{profile.username}</p>
                                                {/* Rating Display */}
                                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                                    <Star className={`w-3.5 h-3.5 ${(profile.rating || 0) > 0 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                                    <span className={`text-sm font-medium ${(profile.rating || 0) > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                                                        {Number(profile.rating || 0).toFixed(1)}
                                                    </span>
                                                    <span className="text-xs text-amber-600/70">
                                                        ({profile.reviewCount || 0})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {!isOwnProfile && user && (
                                            <div className="flex gap-2">
                                                {profile.isFollowing ? (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setPendingAction('UNFOLLOW')}
                                                        disabled={isFollowLoading}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                        Following
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="default"
                                                        onClick={() => setPendingAction('FOLLOW')}
                                                        disabled={isFollowLoading}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Users className="h-4 w-4" />
                                                        Follow
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    onClick={() => openChat(profile as any)}
                                                    className="flex items-center gap-2 "
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                    Message
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setIsReportOpen(true)}
                                                    title="Report User"
                                                >
                                                    <Flag className="h-4 w-4 text-red-500" />
                                                </Button>

                                                {user?.role === 'ADMIN' && (
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => router.push(`/admin/users?search=${profile.username}`)}
                                                        title="Ban User"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Package className="h-4 w-4" />
                                            <span className="font-medium">
                                                {profile.posts?.length || 0}
                                            </span>
                                            <span>Posts</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Users className="h-4 w-4" />
                                            <span className="font-medium">
                                                {profile.followersCount || 0}
                                            </span>
                                            <span>Followers</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <UserCheck className="h-4 w-4" />
                                            <span className="font-medium">
                                                {profile.followingCount || 0}
                                            </span>
                                            <span>Following</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {profile.bio && (
                                        <p className="mt-4 text-gray-600 text-sm leading-relaxed max-w-2xl bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {profile.bio}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs content area */}
                        <Tabs defaultValue="posts" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                                <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 font-medium">Posts</TabsTrigger>
                                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 font-medium">Reviews</TabsTrigger>
                            </TabsList>
                            <TabsContent value="posts" className="mt-0">
                                <PostFeed authorId={profile.id} />
                            </TabsContent>
                            <TabsContent value="reviews" className="mt-0">
                                <ReviewList userId={profile.id} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                targetId={profile?.id || ''}
                targetType="USER"
            />

            <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction === 'FOLLOW' ? "Follow User" : "Unfollow User"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction === 'FOLLOW'
                                ? `Are you sure you want to follow ${profile?.username}?`
                                : `Are you sure you want to unfollow ${profile?.username}?`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isFollowLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirmAction();
                            }}
                            disabled={isFollowLoading}
                            className={pendingAction === 'UNFOLLOW' ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                            {isFollowLoading ? "Processing..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
