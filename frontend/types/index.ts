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
    id: number;
    name: string;
    code: string;
    logoUrl: string;
}

export interface BankAccount {
    id: string;
    bankId: number;
    accountNumber: string;
    accountName: string;
    bank: Bank;
}

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
