"use client"

import { Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GroupCardProps {
    group: {
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        _count?: {
            members: number;
        };
    };
    onJoin?: (id: string) => void;
    isJoined?: boolean;
}

export function GroupCard({ group, onJoin, isJoined = false }: GroupCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow h-full">
            {/* Cover Image / Banner */}
            <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                {group.imageUrl ? (
                     <img 
                        src={group.imageUrl} 
                        alt={group.name} 
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <Users className="text-white w-12 h-12" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 -mt-8 relative z-10">
                <div className="bg-white rounded-xl p-1 w-fit shadow-sm mb-3">
                    <img 
                        src={group.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`} 
                        alt={group.name} 
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200"
                    />
                </div>

                <Link href={`/groups/${group.id}`} className="block">
                     <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-indigo-600 transition-colors">
                        {group.name}
                     </h3>
                </Link>
                
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <Users size={12} />
                    {group._count?.members || 0} members
                </p>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {group.description || "No description provided."}
                </p>

                <Button 
                    onClick={() => onJoin && onJoin(group.id)}
                    variant={isJoined ? "outline" : "default"}
                    className={`w-full text-xs h-8 ${isJoined ? "bg-gray-50 text-gray-600 border-gray-200" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                    disabled={isJoined}
                >
                    {isJoined ? "Joined" : "Join Group"}
                </Button>
            </div>
        </div>
    );
}
