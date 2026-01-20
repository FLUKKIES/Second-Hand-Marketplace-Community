"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PostDetailView } from "@/components/social/PostDetailView";

export function ModalContent({ postId }: { postId: string }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            router.back();
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
