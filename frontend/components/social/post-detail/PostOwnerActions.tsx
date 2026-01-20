"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Post } from "@/types";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PostOwnerActionsProps {
  post: Post;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export function PostOwnerActions({
  post,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  isDeleting,
  onDelete,
}: PostOwnerActionsProps) {
  const { user } = useAuth();

  if (user?.id !== post.author.id) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 relative overflow-hidden flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
          Post Options
        </h3>
        <div className="text-sm text-muted-foreground italic">
          No actions available
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 relative overflow-hidden flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
          Post Options
        </h3>
        {user?.id === post.author.id && !post.deletedAt && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 gap-2"
              onClick={() => {
                // Use window.location.href to force full page reload
                // This ensures the modal is closed before navigation
                window.location.href = `/groups/${post.group?.id || post.groupId}/posts/${post.id}/edit`;
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit Post
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 px-3 gap-2"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Post
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
