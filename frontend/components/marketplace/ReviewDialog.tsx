"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Order } from "@/types/marketplace";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

interface ReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order;
    onSuccess?: () => void;
}

export function ReviewDialog({ open, onOpenChange, order, onSuccess }: ReviewDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            await api.post('/reviews', {
                orderId: order.id,
                rating,
                comment,
            });

            toast.success("Review submitted! Thank you.");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error(getErrorMessage(error) || "Failed to submit review");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Review Order</DialogTitle>
                    <DialogDescription>
                        Rate your experience with this seller.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Rating Stars */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={32}
                                        className={`${star <= rating
                                                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                                : "text-gray-300"
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            {rating === 5 && "Excellent!"}
                            {rating === 4 && "Good"}
                            {rating === 3 && "Okay"}
                            {rating === 2 && "Fair"}
                            {rating === 1 && "Poor"}
                        </span>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label>Comment (Optional)</Label>
                        <Textarea
                            placeholder="Share your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
