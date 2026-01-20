"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: User;
}

interface CommentSectionProps {
    postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = async () => {
        try {
            const comments = await api.get<Comment[]>(`/comments/post/${postId}`);
            setComments(comments);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        if (!user) {
            toast.error("Please login to comment");
            return;
        }

        setSubmitting(true);
        try {
            const comment = await api.post<Comment>("/comments", {
                postId,
                content: newComment,
            });
            setComments((prev) => [comment, ...prev]);
            setNewComment("");
            toast.success("Comment posted!");
        } catch (error) {
            console.error("Failed to post comment", error);
            toast.error("Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-card rounded-2xl shadow-none p-0">
             <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    Comments 
                    <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {comments.length}
                    </span>
                 </h3>
             </div>

            {/* Comment Form */}
            <div className="flex gap-4 mb-8">
                <Avatar className="w-10 h-10 border border-border/50">
                    <AvatarImage src={api.getImageUrl(user?.avatarUrl)} />
                    <AvatarFallback>{user?.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <form onSubmit={handleSubmit}>
                        <div className="relative">
                            <Textarea
                                placeholder={user ? "Write a comment..." : "Login to comment"}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={!user || submitting}
                                className="mb-2 min-h-[80px] resize-none focus-visible:ring-primary/20 bg-muted/30 border-border/60 rounded-xl placeholder:text-muted-foreground/50 text-sm"
                            />
                            {!user && (
                                <div className="absolute inset-0 bg-background/5 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                                    <Button variant="secondary" size="sm" onClick={() => window.location.href = '/login'}>
                                        Login to discuss
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end mt-2">
                            <Button 
                                type="submit" 
                                size="sm" 
                                disabled={!newComment.trim() || submitting || !user}
                                className="rounded-xl px-4 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                Post Comment
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                         <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                             <MessageCircle size={20} className="text-muted-foreground" />
                         </div>
                        <p className="text-muted-foreground text-sm font-medium">No comments yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <Avatar className="w-9 h-9 ring-2 ring-background border border-border/50">
                                <AvatarImage src={api.getImageUrl(comment.user.avatarUrl)} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {comment.user.username[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm text-foreground">
                                        {comment.user.firstName} {comment.user.lastName} 
                                        <span className="text-muted-foreground font-normal ml-2 text-xs">@{comment.user.username}</span>
                                    </h4>
                                    <span className="text-xs text-muted-foreground/70">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-xl rounded-tl-none border border-border/40 hover:border-border/80 transition-colors">
                                    <p className="text-foreground/90 text-[14px] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
