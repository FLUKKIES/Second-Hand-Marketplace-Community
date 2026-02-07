export interface Address {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2: string | null;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    phoneNumber: string;
    isDefault: boolean;
}

export interface Bank {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
}

export interface BankAccount {
    id: string;
    bankId: string;
    accountNumber: string;
    accountName: string;
    bank: Bank;
}

export * from './notification';

export interface User {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    bio?: string;
    phoneNumber?: string;
    avatarUrl: string | null;
    createdAt?: string;
    addresses?: Address[];
    bankAccounts?: BankAccount[];
    role?: string;
    acceptedTermsAt?: string | null;
    followersCount?: number;
    followingCount?: number;
    isFollowing?: boolean;
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
    description: string | null;
    imageUrl: string | null;
    backgroundUrl: string | null;
    categoryId: number;
    category: Category;
    createdAt?: string;
    _count?: {
        members: number;
        posts: number;
    };
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
    offers?: any[];
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
