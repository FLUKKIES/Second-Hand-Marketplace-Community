"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";
import { api, getErrorMessage } from "@/lib/api";
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
  Lock,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EditPostPageProps {
  params: Promise<{ id: string; postId: string }>;
}

interface ProductForm {
  id?: string;
  name: string;
  price: string;
  stock: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  imageUrl?: string; // For existing product image
  isDisabled?: boolean; // True if product has offers/orders
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id: groupId, postId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSelling, setIsSelling] = useState(false);
  const [content, setContent] = useState("");

  // Normal Post Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // Store existing images separately if we want to support keeping them separately,
  // but for "Replace All" strategy (backend), we just clear and add new if uploaded.
  // Wait, "Replace All" is too destructive for just adding one photo.
  // Ideally, we load existing images into previews.
  // If user doesn't touch images, we send nothing (partial update).
  // If user adds files, we send them.
  // BUT backend update logic I wrote earlier: `if (dto.imageUrls) { delete old; add new }`.
  // So if I send any image, it replaces ALL.
  // So I MUST populate `imageFiles` (or a way to keep URL) with existing ones.
  // Backend expects `imageUrls` (strings).
  // If I have existing URLs, I can send them back in `imageUrls`.
  // If I have new Files, I must upload them first, get URLs, then send mixed list?
  // Backend Logic Review:
  // `if (dto.imageUrls) { delete old; add new }`
  // Yes. So I need to send [ ...existingUrls, ...newUploadedUrls ] as `imageUrls`.
  // So I need state for existing images.
  const [existingImages, setExistingImages] = useState<
    { id: string; url: string }[]
  >([]);

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

  // Shipping Cost
  const [shippingCost, setShippingCost] = useState<string>("0");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const post = await api.get<any>(`/posts/${postId}`);

        // Ownership check
        if (user && post.author.id !== user.id) {
          toast.error("You can only edit your own posts");
          router.push(`/groups/${groupId}`);
          return;
        }

        setContent(post.content || "");
        setIsSelling(post.type === "SELLING");
        setShippingCost(post.shippingCost ? post.shippingCost.toString() : "0");

        if (post.images && post.images.length > 0) {
          setExistingImages(post.images);
          // Previews for existing images to show in UI
          // We'll merge logic in rendering
        }

        if (
          post.type === "SELLING" &&
          post.products &&
          post.products.length > 0
        ) {
          setProducts(
            post.products.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price.toString(),
              stock: p.stock.toString(),
              description: p.description || "",
              imageFile: null,
              imagePreview: p.imageUrl ? api.getImageUrl(p.imageUrl) : null,
              imageUrl: p.imageUrl,
              isDisabled: p.isLocked, // Product with offers/orders cannot be edited
            })),
          );
        } else if (post.type === "SELLING") {
          // Should have products, but if empty array
          setProducts([
            {
              name: "",
              price: "",
              stock: "1",
              description: "",
              imageFile: null,
              imagePreview: null,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch post", error);
        toast.error("Failed to load post data");
        router.push(`/groups/${groupId}`);
      } finally {
        setIsFetching(false);
      }
    };

    if (user) {
      fetchPost();
    }
  }, [postId, groupId, user, router]);

  // Handle Image Upload for Normal Post
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map((file) => URL.createObjectURL(file));

      setImageFiles((prev) => [...prev, ...files]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Index in new files
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
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

  // Submit Handler
  const handleSubmit = async () => {
    if (
      !content &&
      existingImages.length === 0 &&
      imageFiles.length === 0 &&
      !isSelling
    ) {
      toast.error("Please add content or an image");
      return;
    }

    if (isSelling) {
      const invalidProduct = products.find(
        (p) =>
          !p.name ||
          !p.price ||
          (!p.imageFile && !p.imageUrl && !p.imagePreview), // Check if any image exists
      );
      if (invalidProduct) {
        toast.error("All products must have a name, price, and image");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Logic:
      // 1. Upload new normal images
      let finalImageUrls = existingImages.map((img) => img.url);

      if (imageFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          imageFiles.map((file) => api.uploadImage(file, "post")),
        );
        finalImageUrls = [...finalImageUrls, ...uploadedUrls];
      }

      // 2. Upload new product images & Prepare Data
      let productData: any[] = [];
      if (isSelling) {
        productData = await Promise.all(
          products.map(async (p) => {
            let imageUrl = p.imageUrl || "";
            if (p.imageFile) {
              imageUrl = await api.uploadImage(p.imageFile, "product");
            }
            return {
              id: p.id,
              name: p.name,
              price: parseFloat(p.price),
              stock: parseInt(p.stock),
              description: p.description,
              imageUrl,
            };
          }),
        );
      }

      await api.patch(`/posts/${postId}`, {
        content,
        imageUrls: finalImageUrls, // Send full list to replace old list
        shippingCost: isSelling ? parseFloat(shippingCost) || 0 : undefined,
        products: isSelling ? productData : undefined,
      });

      toast.success("Post updated successfully!");
      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error(getErrorMessage(error) || "Failed to update post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                Edit Post
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Update your post content
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 space-y-8">
          {/* 1. Main Content */}
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden border border-indigo-100 shadow-sm">
                {user?.avatarUrl ? (
                  <img
                    src={api.getImageUrl(user.avatarUrl)}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-indigo-600 font-bold text-lg">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <Label className="text-lg font-semibold text-gray-800">
                  Content
                </Label>
                <Textarea
                  placeholder={`Share your thoughts...`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[140px] resize-none text-base border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 rounded-2xl transition-all shadow-sm"
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
                  {existingImages.length + imageFiles.length} selected
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {/* Existing Images */}
                {existingImages.map((img, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className="relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-100 group hover:border-indigo-300 transition-all shadow-sm hover:shadow-md"
                  >
                    <img
                      src={api.getImageUrl(img.url)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(idx, true)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Existing
                    </div>
                  </div>
                ))}

                {/* New Images */}
                {imagePreviews.map((preview, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="relative aspect-square rounded-2xl overflow-hidden border-2 border-green-100 group hover:border-green-300 transition-all shadow-sm hover:shadow-md"
                  >
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(idx, false)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-1 right-1 bg-green-500/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                      New
                    </div>
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

          {/* Selling Toggle (Read-only or Disabled? Or allow chaning Type? 
              Changing type from SELLING to NORMAL implies deleting products.
              Changing type from NORMAL to SELLING implies adding products.
              Let's allow it but warn or reset products?
              Actually backend `UpdatePostDto` handles `type` if passed.
              But `UpdatePostDto` extends `CreatePostDto` partially.
              My backend `update` ignores `type` currently?
              Let's check `PostsService.update`. It updates `content`, `images` (via replace all), and `products` (if selling & has products).
              It DOES NOT update `post.type`.
              So we should disable the switch if already created?
              Or add support. For MVP, let's keep it disabled or hidden if established.
              Actually, let's just show it as disabled for now to avoid complexity of type change.
          */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-gray-50/50 p-5 opacity-60">
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
                    {isSelling ? "Selling Products" : "Normal Post"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Post type cannot be changed
                  </p>
                </div>
              </div>
              <Switch
                checked={isSelling}
                disabled
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-500"
              />
            </div>
          </div>

          {/* 3. Product Form (Conditional) */}
          {isSelling && (
            <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-500">
              {/* Shipping Cost */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-white to-blue-50/30 p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Truck size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Shipping Cost</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Set the shipping cost for this post (applies to all products)
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    Shipping Cost (฿)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-blue-300 focus:ring-blue-200 max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    {parseFloat(shippingCost) === 0 ? "Free Shipping 🎉" : `฿${parseFloat(shippingCost || "0").toLocaleString()} per order`}
                  </p>
                </div>
              </div>

              {/* Note: Logic here supports "Replace All Products". So simply editing this list works. */}
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

              <div className="grid grid-cols-1 gap-5">
                {products.map((product, idx) => (
                  <Card
                    key={idx}
                    className={cn(
                      "p-6 relative border-2 shadow-md transition-all duration-300 rounded-2xl overflow-hidden",
                      product.isDisabled ? "pt-14 border-amber-200 bg-amber-50/50 opacity-100" : "border-gray-100 bg-gradient-to-br from-white to-gray-50/30 hover:shadow-xl hover:border-indigo-200"
                    )}
                  >
                    {product.isDisabled && (
                      <div className="absolute top-0 left-0 right-0 bg-amber-100 text-amber-800 px-4 py-2.5 flex items-center gap-2 text-sm font-semibold border-b border-amber-200 shadow-sm">
                        <Lock size={16} className="shrink-0" />
                        <span>Cannot edit: This product already has an active offer or order.</span>
                      </div>
                    )}

                    {!product.isDisabled && products.length > 1 && (
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
                              {!product.isDisabled && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold bg-black/30 px-3 py-1.5 rounded-lg">
                                    Change Photo
                                  </span>
                                </div>
                              )}
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
                            disabled={product.isDisabled}
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
                            disabled={product.isDisabled}
                            className="rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 disabled:opacity-75 disabled:cursor-not-allowed"
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
                            disabled={product.isDisabled}
                            className="rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 disabled:opacity-75 disabled:cursor-not-allowed"
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
                            disabled={product.isDisabled}
                            className="rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 disabled:opacity-75 disabled:cursor-not-allowed"
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
              onClick={handleSubmit}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 min-w-[200px] rounded-xl transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Post"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
