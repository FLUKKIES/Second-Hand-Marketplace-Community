"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/social/PostCard";
import { MapPin, Calendar, Link as LinkIcon, Edit } from "lucide-react";
import { Navbar } from "@/components/common/Navbar";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
    id: string;
    username: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    bio?: string;
    createdAt: string;
    posts?: any[];
}

export default function ProfilePage() {
    const params = useParams();
    const { user: currentUser } = useAuth();
    const { username } = params as { username: string };
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [posts, setPosts] = useState<any[]>([]);
    const [sellingPosts, setSellingPosts] = useState<any[]>([]);

    useEffect(() => {
        const fetchProfileAndPosts = async () => {
            try {
                // 1. Fetch Profile
                const profileRes = await api.get<UserProfile>(`/users/${username}`);
                setProfile(profileRes.data);
                const userId = profileRes.data.id;

                // 2. Fetch Normal Posts
                const postsRes = await api.get('/posts', { 
                    params: { authorId: userId, type: 'NORMAL' } 
                });
                setPosts(postsRes.data);

                // 3. Fetch Selling Posts
                const sellingRes = await api.get('/posts', { 
                    params: { authorId: userId, type: 'SELLING' } 
                });
                setSellingPosts(sellingRes.data);

            } catch (error) {
                console.error("Failed to fetch profile data", error);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfileAndPosts();
        }
    }, [username]);

    if (loading) return <div>Loading...</div>;
    if (!profile) return <div>User not found</div>;

    const isOwnProfile = currentUser?.username === profile.username;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            
            <main className="container max-w-5xl mx-auto py-8 px-4">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {/* Cover Image (Placeholder) */}
                    <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end gap-6">
                                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                                    <Avatar className="w-full h-full">
                                        <AvatarImage src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} />
                                        <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="mb-2">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {profile.firstName && profile.lastName 
                                            ? `${profile.firstName} ${profile.lastName}` 
                                            : profile.fullName || profile.username}
                                    </h1>
                                    <p className="text-gray-500 font-medium">@{profile.username}</p>
                                </div>
                            </div>
                            
                            {isOwnProfile && (
                                <Button variant="outline" className="gap-2">
                                    <Edit size={16} />
                                    Edit Profile
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {profile.bio && (
                                <p className="text-gray-700 max-w-2xl">{profile.bio}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={16} />
                                    <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-6 pt-4 border-t border-gray-50">
                                <div className="flex gap-1.5">
                                    <span className="font-bold text-gray-900">{posts.length + sellingPosts.length}</span>
                                    <span className="text-gray-500">Posts</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <span className="font-bold text-gray-900">120</span>
                                    <span className="text-gray-500">Followers</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <span className="font-bold text-gray-900">45</span>
                                    <span className="text-gray-500">Following</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="posts" className="space-y-6">
                    <TabsList className="bg-white p-1 border border-gray-100 rounded-xl w-full max-w-md">
                        <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                        <TabsTrigger value="selling" className="flex-1">Selling</TabsTrigger>
                        <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
                        <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="space-y-6">
                        <div className="grid gap-6">
                             {posts.length > 0 ? (
                                 posts.map(post => (
                                     <PostCard key={post.id} post={post} />
                                 ))
                             ) : (
                                 <div className="bg-white p-8 text-center rounded-xl border border-gray-100 text-gray-500">
                                    No posts yet.
                                 </div>
                             )}
                        </div>
                    </TabsContent>

                    <TabsContent value="selling">
                         <div className="grid gap-6">
                             {sellingPosts.length > 0 ? (
                                 sellingPosts.map(post => (
                                     <PostCard key={post.id} post={post} />
                                 ))
                             ) : (
                                 <div className="bg-white p-8 text-center rounded-xl border border-gray-100 text-gray-500">
                                    No active listings.
                                 </div>
                             )}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="reviews">
                         <div className="bg-white p-8 text-center rounded-xl border border-gray-100 text-gray-500">
                                No reviews yet.
                         </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
