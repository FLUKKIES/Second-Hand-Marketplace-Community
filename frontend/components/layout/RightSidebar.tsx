"use client"

import { ArrowUpRight, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RightSidebar() {
    const [groups, setGroups] = useState<{ id: string, name: string, imageUrl: string | null, _count?: { members: number } }[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const fetchGroups = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (token) {
                     // Try fetching my groups
                     const { data } = await api.get('/groups/my-groups');
                     if (Array.isArray(data) && data.length > 0) {
                         setGroups(data.map((m: any) => m.group));
                         return;
                     }
                }

                // Fallback: Fetch all groups (e.g. suggested) if not logged in or no groups
                const { data } = await api.get('/groups');
                if (Array.isArray(data)) {
                     // Sort by members count if available to suggest popular ones
                     const sorted = data.sort((a: any, b: any) => (b._count?.members || 0) - (a._count?.members || 0));
                     setGroups(sorted.slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to fetch groups", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    return (
        <div className="space-y-6">
            {/* My Groups / Suggested Groups */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="text-indigo-600" size={20} />
                        <h3 className="font-semibold text-sm text-gray-900">
                            {user ? "Your Groups" : "Popular Groups"}
                        </h3>
                    </div>
                </div>
                
                {!user && (
                    <p className="text-xs text-muted-foreground mb-3">
                        Join groups to see them here!
                    </p>
                )}

                <div className="space-y-3">
                    {groups.map((group) => (
                        <Link key={group.id} href={`/groups/${group.id}`} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group">
                            <img 
                                src={group.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`} 
                                alt={group.name} 
                                className="w-10 h-10 rounded-xl bg-gray-100 object-cover border border-gray-100" 
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">{group.name}</h4>
                                <p className="text-xs text-muted-foreground">{group._count?.members || 0} members</p>
                            </div>
                        </Link>
                    ))}
                    {!loading && groups.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No groups found.</p>
                    )}
                </div>
                
                {(!user || groups.length < 3) && (
                    <Link href="/groups" className="block w-full text-center py-2 mt-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        Discover More
                    </Link>
                )}
            </div>

            {/* Suggested Categories / Tags */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900 mb-3">Trending Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {['Photography', 'Sneakers', 'Camping', 'Coffee', 'UX Design', 'MechanicalKeyboards'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-50 text-xs font-medium text-gray-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors border border-transparent hover:border-indigo-100">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
            
            {/* Ad Space (Optional) */}
             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="font-bold text-lg mb-2 relative z-10">Sell Faster!</h3>
                <p className="text-indigo-100 text-sm mb-4 relative z-10">Boost your post to reach 10x more people.</p>
                <button className="w-full bg-white text-indigo-600 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition relative z-10">
                    Boost Now
                </button>
            </div>
        </div>
    );
}
