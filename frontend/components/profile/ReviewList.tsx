"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    username: string;
    avatarUrl: string | null;
  };
}

interface ReviewListProps {
  userId: string;
}

export function ReviewList({ userId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await api.get<{
          reviews: Review[];
          averageRating: number;
          totalReviews: number;
        }>(`/reviews/user/${userId}`);
        setReviews(data.reviews);
        setStats({
          averageRating: data.averageRating,
          totalReviews: data.totalReviews,
        });
      } catch (error) {
        console.error("Failed to fetch reviews:", getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchReviews();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 text-gray-500">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="text-gray-300" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          No reviews yet
        </h3>
        <p className="text-sm">This user hasn't received any reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
        <div className="text-center px-4 border-r border-gray-100">
          <div className="text-4xl font-bold text-gray-900">
            {stats.averageRating}
          </div>
          <div className="flex gap-0.5 justify-center my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={`${
                  star <= Math.round(stats.averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500">
            {stats.totalReviews} reviews
          </div>
        </div>
        <div className="flex-1">
          <div className="space-y-2">
            {/* We could add bar charts here later for 5,4,3,2,1 star distribution */}
            <p className="text-gray-600 italic">
              "Based on reviews from buyers who completed orders with this
              seller."
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-gray-100">
                  <AvatarImage
                    src={api.getImageUrl(review.reviewer.avatarUrl)}
                  />
                  <AvatarFallback>{review.reviewer.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-gray-900">
                    {review.reviewer.username}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-0.5 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={`${
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-gray-700 leading-relaxed bg-gray-50/50 p-3 rounded-xl">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
