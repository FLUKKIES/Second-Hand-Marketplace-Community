"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";
import { api } from "@/lib/api";
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
    value: string
  ) => {
    setProducts((prev) => {
      const newProducts = [...prev];
      newProducts[index] = { ...newProducts[index], [field]: value };
      return newProducts;
    });
  };

  const handleProductImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
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

  // Submit Handler
  const handleSubmit = async () => {
    if (!content && imageFiles.length === 0 && !isSelling) {
      toast.error("Please add content or an image");
      return;
    }

    if (isSelling) {
      const invalidProduct = products.find(
        (p) => !p.name || !p.price || !p.imageFile
      );
      if (invalidProduct) {
        toast.error("All products must have a name, price, and image");
        return;
      }
    }

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
          imageFiles.map((file) => api.uploadImage(file, "post"))
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
            }
            return {
              name: p.name,
              price: parseFloat(p.price),
              stock: parseInt(p.stock),
              description: p.description,
              imageUrl,
            };
          })
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Navbar />

      <main className="container max-w-5xl pt-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/groups/${groupId}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
          {/* 1. Main Content */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              What&apos;s on your mind?
            </Label>
            <Textarea
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none text-base border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            />

            {/* Normal Photos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Photos
                </Label>
                <span className="text-xs text-muted-foreground">
                  {imageFiles.length} photos selected
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {imagePreviews.map((preview, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group"
                  >
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                    <ImagePlus
                      className="text-gray-400 group-hover:text-indigo-500"
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

          <div className="h-px bg-gray-100" />

          {/* 2. Selling Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSelling
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-white text-gray-400"
                }`}
              >
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sell Products</h3>
                <p className="text-sm text-gray-500">
                  Enable this to list items for sale
                </p>
              </div>
            </div>
            <Switch checked={isSelling} onCheckedChange={setIsSelling} />
          </div>

          {/* 3. Product Form (Conditional) */}
          {isSelling && (
            <div className="space-y-6 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Products</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProduct}
                  className="gap-2"
                >
                  <Plus size={16} /> Add Another Product
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {products.map((product, idx) => (
                  <Card
                    key={idx}
                    className="p-4 relative border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {products.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 z-10"
                        onClick={() => removeProduct(idx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="shrink-0 mx-auto sm:mx-0">
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                          Image
                        </Label>
                        <label
                          className={`w-full sm:w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                            product.imagePreview
                              ? "border-transparent"
                              : "border-gray-200 hover:border-indigo-500 hover:bg-indigo-50"
                          }`}
                        >
                          {product.imagePreview ? (
                            <div className="relative w-full h-full group">
                              <img
                                src={product.imagePreview}
                                alt="Product"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <span className="text-white text-xs font-medium">
                                  Change
                                </span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <ImagePlus
                                className="text-gray-400 mb-2"
                                size={24}
                              />
                              <span className="text-[10px] text-gray-500 text-center px-2">
                                Upload Photo
                              </span>
                            </>
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
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-gray-700">
                            Product Name
                          </Label>
                          <Input
                            placeholder="e.g. Nike Air Max"
                            value={product.name}
                            onChange={(e) =>
                              updateProduct(idx, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">
                              Price (฿)
                            </Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={product.price}
                              onChange={(e) =>
                                updateProduct(idx, "price", e.target.value)
                              }
                            />
                          </div>
                          <div className="w-20 space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">
                              Stock
                            </Label>
                            <Input
                              type="number"
                              placeholder="1"
                              value={product.stock}
                              onChange={(e) =>
                                updateProduct(idx, "stock", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-gray-700">
                            Description (Optional)
                          </Label>
                          <Input
                            placeholder="Size, condition, etc."
                            value={product.description}
                            onChange={(e) =>
                              updateProduct(idx, "description", e.target.value)
                            }
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
          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Post"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
