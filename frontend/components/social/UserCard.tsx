"use client";

import Link from "next/link";
import { User } from "@/types";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UserCardProps {
    user: Partial<User>;
}

export function UserCard({ user }: UserCardProps) {
    if (!user.username) return null;

    return (
        <Card className="p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border border-border/50">
                    <AvatarImage src={api.getImageUrl(user.avatarUrl)} />
                    <AvatarFallback>
                        {user.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold text-foreground">
                        {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {user.bio}
                        </p>
                    )}
                </div>
            </div>
            <Link href={`/profile/${user.username}`}>
                <Button variant="outline" size="sm">
                    View Profile
                </Button>
            </Link>
        </Card>
    );
}
