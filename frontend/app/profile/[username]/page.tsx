"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MessageCircle, MapPin, Calendar, Star, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { ReviewList } from "@/components/profile/ReviewList";
import { PostFeed } from "@/components/social/PostFeed";

interface UserProfile {
    id: string;
    username: string;
    email?: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
    posts?: any[]; // Array of posts from backend
}

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const { user } = useAuth();
    const { openChat } = useChat();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

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

            <main className="flex-1 container pt-4 px-2 md:px-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 align-start h-full">
                    {/* Left Sidebar (25% ~ 3 cols) - Hidden on mobile */}
                    <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
                        <LeftSidebar />
                    </aside>

                    {/* Main Content (75% ~ 9 cols) */}
                    <div className="md:col-span-9 lg:col-span-9 flex flex-col h-full overflow-y-auto scrollbar-hide">
                        {/* Profile Header Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                {/* Avatar */}
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                    <AvatarImage src={api.getImageUrl(profile.avatarUrl)} />
                                    <AvatarFallback className="text-3xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                                        {profile.username[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Profile Info */}
                                <div className="flex-1">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3 justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">
                                                {profile.firstName && profile.lastName
                                                    ? `${profile.firstName} ${profile.lastName}`
                                                    : profile.username}
                                            </h1>
                                            <p className="text-gray-500">@{profile.username}</p>
                                        </div>

                                        {/* Action Buttons */}
                                        {!isOwnProfile && user && (
                                            <Button
                                                variant="default"
                                                onClick={() => openChat(profile as any)}
                                                className="flex items-center gap-2 "
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                Message
                                            </Button>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    {profile.bio && (
                                        <p className="text-gray-700 mb-4">{profile.bio}</p>
                                    )}

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
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                Joined{" "}
                                                {new Date(profile.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="posts" className="flex-1">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="posts">Posts</TabsTrigger>
                                <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
        </div>
    );
}
