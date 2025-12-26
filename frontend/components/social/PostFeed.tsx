"use client"

import { useEffect, useState } from "react";
import { PostCard } from "./PostCard";
import { Post } from "@/types";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

// Dummy data for initial display (fallback)
const DUMMY_POSTS: Post[] = [
    {
        "id": "932e7cf8-38bd-49c8-b02d-dad1840f4b82",
        "content": "Just got some new limited edition sneakers! Anyone interested?",
        "type": "SELLING",
        "authorId": "07b436f6-4956-4cb6-92d9-536eac20e4d2",
        "groupId": "43288eea-88af-41ca-8d9d-d5441c1275ef",
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString(),
        "deletedAt": null,
        "author": {
            "id": "07b436f6-4956-4cb6-92d9-536eac20e4d2",
            "username": "sneaker_king",
            "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
        },
        "group": {
            "id": "43288eea-88af-41ca-8d9d-d5441c1275ef",
            "name": "Sneaker Heads",
            "category": {
                "id": 7,
                "name": "Fashion",
                "slug": "fashion",
                "imageUrl": null,
                "createdAt": "2025-12-26T13:03:13.578Z"
            }
        },
        "images": [
             { id: "1", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80", postId: "932e7cf8-38bd-49c8-b02d-dad1840f4b82" }
        ],
        "products": [
            {
                "id": "533ba064-a297-461e-b899-2faff03064d4",
                "postId": "932e7cf8-38bd-49c8-b02d-dad1840f4b82",
                "name": "Nike Air Max 90",
                "price": "4500",
                "description": "Size 10US, Brand new check it out",
                "stock": 1,
                "isSoldOut": false,
                "imageUrl": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80"
            }
        ],
        "_count": {
            "likes": 24,
            "comments": 5
        }
    },
    {
        "id": "477ef61b-0a93-484f-8330-45ada409d56d",
        "content": "Looking for recommendations on vintage film cameras. Does anyone know a good shop in Bangkok?",
        "type": "NORMAL",
        "authorId": "07b436f6-4956-4cb6-92d9-536eac20e4d2",
        "groupId": "43288eea-88af-41ca-8d9d-d5441c1275ef",
        "createdAt": new Date(Date.now() - 3600000).toISOString(),
        "updatedAt": new Date(Date.now() - 3600000).toISOString(),
        "deletedAt": null,
        "author": {
            "id": "07b436f6-4956-4cb6-92d9-536eac20e4d2",
            "username": "film_lover",
            "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack"
        },
        "group": {
            "id": "43288eea-88af-41ca-8d9d-d5441c1275ef",
            "name": "Photography Lovers",
            "category": {
                "id": 7,
                "name": "Hobbies",
                "slug": "hobbies",
                "imageUrl": null,
                "createdAt": "2025-12-26T13:03:13.578Z"
            }
        },
        "images": [],
        "products": [],
        "_count": {
            "likes": 12,
            "comments": 8
        }
    }
];

export function PostFeed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data } = await api.get<Post[]>('/posts');
                if (Array.isArray(data) && data.length > 0) {
                    setPosts(data);
                } else {
                    setPosts(DUMMY_POSTS);
                }
            } catch (error) {
                console.error("Failed to fetch posts:", error);
                setPosts(DUMMY_POSTS);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="flex flex-col gap-4 w-full py-2">
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
