"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Post } from "@/types";
import { Eye } from "lucide-react";
import { ImageViewer } from "@/components/ui/ImageViewer";

interface PostImagesProps {
  post: Post;
}

export function PostImages({ post }: PostImagesProps) {
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<
    string[] | { url: string }[]
  >([]);

  if (!post.images || post.images.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-1",
          post.images.length === 1
            ? "grid-cols-1"
            : post.images.length === 2
              ? "grid-cols-2"
              : "grid-cols-2",
        )}
      >
        {post.images.map((img, i) => (
          <div
            key={img.id}
            className={cn(
              "relative aspect-square overflow-hidden bg-muted cursor-pointer group/image",
              post.images.length === 3 && i === 0
                ? "col-span-2 aspect-video"
                : "",
            )}
            onClick={() => {
              setViewerImages(post.images);
              setViewerIndex(i);
              setIsViewerOpen(true);
            }}
          >
            {/* Image counter badge */}
            {i === 0 && post.images.length > 1 && (
              <div className="absolute top-2 right-2 z-20 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                <Eye className="w-3 h-3" />
                1/{post.images.length}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300 z-10" />
            <img
              src={api.getImageUrl(img.url)}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
            />
          </div>
        ))}
      </div>

      <ImageViewer
        images={viewerImages}
        initialIndex={viewerIndex}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </>
  );
}
