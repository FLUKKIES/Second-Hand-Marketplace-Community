"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Loader2,
    ArrowLeft,
    Plus,
    Trash2,
    ImagePlus,
    X,
    ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CreatePostPageProps {
    params: Promise<{ id: string }>;
}

interface ProductForm {
    name: string;
    price: string;
    stock: string;
    description: string;
    imageFile: File | null;
    imagePreview: string | null;
}

export default function CreatePostPage({ params }: CreatePostPageProps) {
    const { id: groupId } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [isSelling, setIsSelling] = useState(false);
    const [content, setContent] = useState("");

    // Normal Post Images
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // Selling Post Products
    const [products, setProducts] = useState<ProductForm[]>([
        {
            name: "",
            price: "",
            stock: "1",
            description: "",
            imageFile: null,
            imagePreview: null,
        },
    ]);

    // Handle Image Upload for Normal Post
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newPreviews = files.map((file) => URL.createObjectURL(file));

            setImageFiles((prev) => [...prev, ...files]);
            setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle Product Form Changes
    const addProduct = () => {
        setProducts((prev) => [
            ...prev,
            {
                name: "",
                price: "",
                stock: "1",
                description: "",
                imageFile: null,
                imagePreview: null,
            },
        ]);
    };

    const removeProduct = (index: number) => {
        if (products.length > 1) {
            setProducts((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const updateProduct = (
        index: number,
        field: Exclude<keyof ProductForm, "imageFile" | "imagePreview">,
        value: string,
    ) => {
        setProducts((prev) => {
            const newProducts = [...prev];
            newProducts[index] = { ...newProducts[index], [field]: value };
            return newProducts;
        });
    };

    const handleProductImageChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const preview = URL.createObjectURL(file);

            setProducts((prev) => {
                const newProducts = [...prev];
                newProducts[index] = {
                    ...newProducts[index],
                    imageFile: file,
                    imagePreview: preview,
                };
                return newProducts;
            });
        }
    };

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Validation & Pre-Submit
    const handlePreSubmit = () => {
        // 1. Common Validation
        if (!content.trim() && imageFiles.length === 0 && !isSelling) {
            toast.error("Please add content or an image");
            return;
        }

        // 2. Selling Validation
        if (isSelling) {
            // Check for at least one product
            if (products.length === 0) {
                toast.error("Please add at least one product");
                return;
            }

            // Check each product
            for (let i = 0; i < products.length; i++) {
                const p = products[i];
                if (!p.name.trim()) {
                    toast.error(`Product #${i + 1}: Name is required`);
                    return;
                }
                if (!p.price || parseFloat(p.price) <= 0) {
                    toast.error(`Product #${i + 1}: Price must be greater than 0`);
                    return;
                }
                if (!p.stock || parseInt(p.stock) <= 0) {
                    toast.error(`Product #${i + 1}: Stock must be greater than 0`);
                    return;
                }
                if (!p.imageFile && !p.imagePreview) {
                    toast.error(`Product #${i + 1}: Image is required`);
                    return;
                }
            }
        }

        setIsConfirmOpen(true);
    };

    // Actual Submit Logic
    const confirmPostCreation = async () => {
        setIsConfirmOpen(false); // Close dialog immediately or keep open? Better to close to prevent double click, handled by isLoading
        setIsLoading(true);

        try {
            interface CreatePostPayload {
                groupId: string;
                content: string;
                type: "SELLING" | "NORMAL";
                imageUrls?: string[];
                products?: {
                    name: string;
                    price: number;
                    stock: number;
                    description: string;
                    imageUrl: string;
                }[];
            }

            const payload: CreatePostPayload = {
                groupId,
                content,
                type: isSelling ? "SELLING" : "NORMAL",
            };

            // 1. Upload Normal Images
            if (imageFiles.length > 0) {
                const uploadedUrls = await Promise.all(
                    imageFiles.map((file) => api.uploadImage(file, "post")),
                );
                payload.imageUrls = uploadedUrls;
            }

            // 2. Upload Product Images & Prepare Data
            if (isSelling) {
                const productData = await Promise.all(
                    products.map(async (p) => {
                        let imageUrl = "";
                        if (p.imageFile) {
                            imageUrl = await api.uploadImage(p.imageFile, "product");
                        } else if (p.imagePreview) {
                            // Handle case where image preview exists but no file (e.g. edit mode, though this is create)
                            // For create, imageFile should exist if imagePreview exists (from local)
                            // Unless we support pre-filled templates later.
                            // For now assume imageFile exists if valid.
                        }
                        return {
                            name: p.name,
                            price: parseFloat(p.price),
                            stock: parseInt(p.stock),
                            description: p.description,
                            imageUrl,
                        };
                    }),
                );
                payload.products = productData;
            }

            // 3. Create Post
            await api.post("/posts", payload);

            toast.success("Post created successfully!");
            router.push(`/groups/${groupId}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to create post:", error);
            toast.error("Failed to create post. Please try again.");
            setIsLoading(false); // Only unset loading on error, on success we redirect
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 pb-20">
            <Navbar />

            <main className="pt-6 px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href={`/groups/${groupId}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-white/80 transition-all shadow-sm"
                            >
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                Create New Post
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Share your thoughts or list items for sale
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 space-y-8">
                    {/* 1. Main Content */}
                    <div className="space-y-5">
                        <div className="flex gap-4">
                            <Avatar className="h-10 w-10 border border-border/50">
                                <AvatarImage src={api.getImageUrl(user?.avatarUrl)} />
                                <AvatarFallback>
                                    {user?.username?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-lg font-semibold text-gray-800">
                                        What&apos;s on your mind?
                                    </Label>
                                </div>
                                <Textarea
                                    placeholder={`Share your thoughts, ${user?.firstName || user?.username || "friend"}...`}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[140px] resize-none text-base border-gray-200  rounded-2xl transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Normal Photos */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <ImagePlus className="w-4 h-4 text-indigo-500" />
                                    Photos
                                </Label>
                                <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                                    {imageFiles.length} selected
                                </span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {imagePreviews.map((preview, idx) => (
                                    <div
                                        key={idx}
                                        className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 group hover:border-indigo-300 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <img
                                            src={preview}
                                            alt="preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ImagePlus
                                            className="text-indigo-600 group-hover:text-indigo-700"
                                            size={20}
                                        />
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                    {/* 2. Selling Toggle */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-5 transition-all hover:border-indigo-200 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isSelling
                                        ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200"
                                        : "bg-gray-100 text-gray-400"
                                        }`}
                                >
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        Sell Products
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        List items for sale in this post
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={isSelling}
                                onCheckedChange={setIsSelling}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-500"
                            />
                        </div>
                    </div>

                    {/* 3. Product Form (Conditional) */}
                    {isSelling && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-500">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                                        <Label className="text-lg font-semibold text-gray-800">
                                            Products
                                        </Label>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addProduct}
                                        className="gap-2 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all"
                                    >
                                        <Plus size={16} />
                                        Add Product
                                    </Button>
                                </div>
                                <p className="text-sm text-red-500 italic px-1">
                                    * หมายเหตุ: ราคาที่ระบุต้องเป็นราคารวมค่าจัดส่งแล้ว เนื่องจากระบบยังไม่รองรับการคิดค่าจัดส่งแยก
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                {products.map((product, idx) => (
                                    <Card
                                        key={idx}
                                        className="p-6 relative border-2 border-gray-100 shadow-md hover:shadow-xl hover:border-indigo-200 transition-all duration-300 rounded-2xl bg-gradient-to-br from-white to-gray-50/30"
                                    >
                                        {products.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 hover:bg-red-50 z-10 rounded-xl transition-all"
                                                onClick={() => removeProduct(idx)}
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-6">
                                            {/* Product Image */}
                                            <div className="shrink-0 mx-auto sm:mx-0">
                                                <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                                                    Product Image
                                                </Label>
                                                <label
                                                    className={`w-full sm:w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${product.imagePreview
                                                        ? "border-transparent shadow-md"
                                                        : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50"
                                                        }`}
                                                >
                                                    {product.imagePreview ? (
                                                        <div className="relative w-full h-full group">
                                                            <img
                                                                src={product.imagePreview}
                                                                alt="Product"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-white text-sm font-semibold bg-black/30 px-3 py-1.5 rounded-lg">
                                                                    Change Photo
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-2">
                                                                <ImagePlus
                                                                    className="text-indigo-600"
                                                                    size={24}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                Upload Photo
                                                            </span>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleProductImageChange(idx, e)}
                                                    />
                                                </label>
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                                        Product Name
                                                        <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        placeholder="e.g. Nike Air Max"
                                                        value={product.name}
                                                        onChange={(e) =>
                                                            updateProduct(idx, "name", e.target.value)
                                                        }
                                                        className="rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                                        Price (฿)
                                                        <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={product.price}
                                                        onChange={(e) =>
                                                            updateProduct(idx, "price", e.target.value)
                                                        }
                                                        className="rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-gray-700">
                                                        Description (Optional)
                                                    </Label>
                                                    <Input
                                                        placeholder="Size, condition, etc."
                                                        value={product.description}
                                                        onChange={(e) =>
                                                            updateProduct(idx, "description", e.target.value)
                                                        }
                                                        className="rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-6 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            size="lg"
                            className="rounded-xl min-w-[120px] hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePreSubmit}
                            disabled={isLoading}
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 min-w-[200px] rounded-xl transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                "Publish Post"
                            )}
                        </Button>
                    </div>
                </div>
            </main>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Publication</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to publish this post?
                            {isSelling && " Please verify that all product details and shipping costs are correct."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-0 bg-gray-100 hover:bg-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmPostCreation}
                            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                        >
                            Confirm Publish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
