"use client";

import { use } from "react";
import { Navbar } from "@/components/common/Navbar";
import { PostDetailView } from "@/components/social/PostDetailView";

interface PostPageProps {
    params: Promise<{ id: string }>;
}

export default function PostPage({ params }: PostPageProps) {
    const { id } = use(params);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            <Navbar />
            <main className="flex-1 container max-w-7xl mx-auto py-8 px-4">
                <PostDetailView postId={id} />
            </main>
        </div>
    );
}
