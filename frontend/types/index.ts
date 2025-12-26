export interface User {
    id: string;
    username: string;
    avatarUrl: string | null;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    imageUrl: string | null;
    createdAt: string;
}

export interface Group {
    id: string;
    name: string;
    category: Category;
}

export interface PostImage {
    id: string;
    url: string;
    postId: string;
}

export interface Product {
    id: string;
    postId: string;
    name: string;
    price: string;
    description: string | null;
    stock: number;
    isSoldOut: boolean;
    imageUrl: string | null;
}

export type PostType = 'NORMAL' | 'SELLING';

export interface Post {
    id: string;
    content: string;
    type: PostType;
    authorId: string;
    groupId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    author: User;
    group: Group;
    images: PostImage[];
    products: Product[];
    _count: {
        likes: number;
        comments: number;
    };
}
