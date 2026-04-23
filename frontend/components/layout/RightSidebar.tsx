"use client";

import { MessageCircle, User, Users, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface FollowedUser {
    following: {
        id: string;
        username: string;
        avatarUrl: string | null;
        firstName: string | null;
        lastName: string | null;
    }
}

export function RightSidebar() {
    const { user: currentUser } = useAuth();
    const { openChat } = useChat();
    const [following, setFollowing] = useState<FollowedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchFollowing(currentUser.id);
        } else {
            setFollowing([]);
            setLoading(false);
        }
    }, [currentUser]);

    const fetchFollowing = async (userId: string) => {
        try {
            const data = await api.get<FollowedUser[]>(`/users/${userId}/following`);
            if (Array.isArray(data)) {
                setFollowing(data);
            }
        } catch (error) {
            console.error("Failed to fetch following", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChatClick = (user: FollowedUser["following"]) => {
        // Construct a User object compatible with openChat
        openChat({
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            firstName: user.firstName,
            lastName: user.lastName,
            // Add other required fields with defaults if necessary, or Partial<User>
        } as any);
    };

    if (!currentUser) {
        return (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="text-indigo-600" size={20} />
                        <h3 className="font-semibold text-sm text-gray-900">
                            People You Follow
                        </h3>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-6 mb-3 text-center">
                    Login to see people you follow!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <User className="text-indigo-600" size={20} />
                        <h3 className="font-semibold text-sm text-gray-900">
                            People You Follow
                        </h3>
                    </div>
                </div>

                <div className="space-y-3">
                    {activeFollowList(following)}
                    {loading && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            Loading...
                        </p>
                    )}
                    {!loading && following.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            You are not following anyone yet.
                        </p>
                    )}
                </div>

                {following.length > 5 && (
                    <Link
                        href={`/profile/${currentUser.username}?tab=following`}
                        className="block w-full text-center py-2 mt-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                        View All
                    </Link>
                )}
            </div>
        </div>
    );

    function activeFollowList(list: FollowedUser[]) {
        // Show max 5 for now
        return list.slice(0, 5).map((item) => (
            <div
                key={item.following.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
                <Link href={`/profile/${item.following.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 border border-gray-100">
                        <AvatarImage src={api.getImageUrl(item.following.avatarUrl)} />
                        <AvatarFallback>{item.following.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                            {item.following.firstName
                                ? `${item.following.firstName} ${item.following.lastName || ""}`
                                : item.following.username}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                            @{item.following.username}
                        </p>
                    </div>
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600">
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-white rounded-xl shadow-lg border-gray-100">
                        <Link href={`/profile/${item.following.username}`}>
                            <DropdownMenuItem className="cursor-pointer gap-2">
                                <User size={14} />
                                View Profile
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={() => handleChatClick(item.following)}
                        >
                            <MessageCircle size={14} />
                            Chat
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ));
    }
}
