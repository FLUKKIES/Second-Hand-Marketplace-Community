"use client";

import { useState } from "react";
import { Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Group } from "@/types";
import { api } from "@/lib/api";

interface GroupCardProps {
  group: Group;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  isJoined?: boolean;
}

export function GroupCard({
  group,
  onJoin,
  onLeave,
  isJoined = false,
}: GroupCardProps) {
  const { user } = useAuth();
  const [confirmJoinOpen, setConfirmJoinOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isJoined) {
      if (onLeave) setConfirmLeaveOpen(true);
    } else {
      if (onJoin) setConfirmJoinOpen(true);
    }
  };

  const confirmJoin = () => {
    if (onJoin) {
      onJoin(group.id);
      setConfirmJoinOpen(false);
    }
  };

  const confirmLeave = () => {
    if (onLeave) {
      onLeave(group.id);
      setConfirmLeaveOpen(false);
    }
  };

  return (
    <>
      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden flex flex-col hover-lift animate-fade-in h-full group/card">
        {/* Cover Image / Banner with gradient overlay */}
        <div className="h-28 bg-gradient-to-br from-primary/60 via-purple-500/60 to-pink-500/60 relative overflow-hidden">
          {group.backgroundUrl ? (
            <>
              <img
                src={api.getImageUrl(group.backgroundUrl)}
                alt={group.name}
                className="w-full h-full object-cover opacity-70 group-hover/card:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Users className="text-white/30 w-14 h-14" />
                <Sparkles className="absolute -top-1 -right-1 text-white/40 w-5 h-5 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 -mt-10 relative z-10">
          {/* Group Icon */}
          <div className="bg-background rounded-2xl p-1.5 w-fit shadow-lg ring-2 ring-background mb-3 group-hover/card:ring-primary/20 transition-all duration-300">
            <img
              src={
                api.getImageUrl(group.imageUrl) ||
                `https://api.dicebear.com/7.x/shapes/svg?seed=${group.name}`
              }
              alt={group.name}
              className="w-14 h-14 rounded-xl object-cover bg-muted"
            />
          </div>

          <Link href={`/groups/${group.id}`} className="block mb-2">
            <h3 className="font-bold text-foreground text-base line-clamp-1 hover:text-primary transition-colors group-hover/card:text-primary">
              {group.name}
            </h3>
          </Link>

          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5 font-medium">
            <div className="bg-muted/50 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Users size={12} className="text-primary" />
              {(group._count?.members || 0).toLocaleString()} member
              {(group._count?.members || 0) !== 1 ? "s" : ""}
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 leading-relaxed">
            {group.description ||
              "Connect with like-minded people and share your interests."}
          </p>

          {user && (
            <Button
              onClick={handleButtonClick}
              variant={isJoined ? "outline" : "default"}
              className={cn(
                "w-full text-sm font-semibold transition-all duration-300",
                isJoined
                  ? "bg-muted/50 text-muted-foreground border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95",
              )}
            >
              {isJoined ? (
                <span className="group-hover/card:hidden">✓ Joined</span>
              ) : (
                <>Join Group</>
              )}
              {isJoined && (
                <span className="hidden group-hover/card:inline">
                  Leave Group
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={confirmJoinOpen} onOpenChange={setConfirmJoinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join {group.name}?</DialogTitle>
            <DialogDescription>
              You'll be able to see posts, interact with members, and
              participate in discussions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmJoinOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmJoin}
              className="shadow-md shadow-primary/20"
            >
              Confirm Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave {group.name}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this group? You won't be able to
              post or interact with members anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmLeaveOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLeave}>
              Yes, Leave Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
