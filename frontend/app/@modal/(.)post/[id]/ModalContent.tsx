"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PostDetailView } from "@/components/social/PostDetailView";

export function ModalContent({ postId }: { postId: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const referrerRef = useRef<string>("/");

  // Track the referrer when the modal mounts
  useEffect(() => {
    // Get the current path without the /post/[id] part
    // This assumes the modal was opened from somewhere, and we want to go back there
    if (typeof window !== "undefined" && window.history.state) {
      // Use the document referrer or fallback to home
      const referrer = document.referrer;
      if (referrer && referrer.includes(window.location.origin)) {
        // Extract the path from the referrer
        const url = new URL(referrer);
        referrerRef.current = url.pathname;
      }
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Use window.location.href for a full page reload
      // This is more robust and prevents ALL modal navigation conflicts
      // including Edit Post, Buy Now, Make Offer, etc.
      window.location.href = referrerRef.current;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 overflow-hidden bg-gray-50 border-none shadow-none">
        <DialogTitle className="sr-only">Post Detail</DialogTitle>
        <PostDetailView postId={postId} isModal />
      </DialogContent>
    </Dialog>
  );
}
