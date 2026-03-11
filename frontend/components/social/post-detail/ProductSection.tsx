"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Post } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MakeOfferButton } from "@/components/marketplace/MakeOfferButton";
import { BuyNowButton } from "@/components/marketplace/BuyNowButton";
import { ImageViewer } from "@/components/ui/ImageViewer";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  X,
  MapPin,
  MessageCircle,
  Truck,
} from "lucide-react";

interface ProductSectionProps {
  post: Post;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  onUpdate: () => void;
  isModal?: boolean;
}

export function ProductSection({
  post,
  selectedProductId,
  setSelectedProductId,
  onUpdate,
  isModal,
}: ProductSectionProps) {
  const { user } = useAuth();
  const { openChat } = useChat();
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  if (post.type !== "SELLING" || post.products.length === 0) {
    return null;
  }

  const selectedProduct =
    post.products.find((p) => p.id === selectedProductId) || post.products[0];

  // Safety check if no product is found (shouldn't happen if post.products > 0)
  if (!selectedProduct) return null;

  return (
    <div className={cn(!isModal && "sticky top-24", "space-y-6")}>
      {/* Product Selection List (If multiple products) */}
      {post.products.length > 1 && (
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 mb-6">
          <h4 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Select Option ({post.products.length} available)
          </h4>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
            {post.products.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border relative overflow-hidden",
                  selectedProductId === product.id
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                    : "bg-background hover:bg-muted/50 border-transparent hover:border-border/60",
                )}
              >
                <div className="h-12 w-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden border border-border/40">
                  {product.imageUrl ? (
                    <img
                      src={api.getImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground/50">
                      <ShoppingBag size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 z-10">
                  <div
                    className={cn(
                      "text-sm font-medium truncate transition-colors",
                      selectedProductId === product.id
                        ? "text-primary"
                        : "text-foreground",
                    )}
                  >
                    {product.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    ฿{Number(product.price).toLocaleString()}
                  </div>
                </div>
                {selectedProductId === product.id && (
                  <div className="h-2 w-2 rounded-full bg-primary shadow-sm mr-1 z-10 animate-in zoom-in-0 duration-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Product Details */}
      <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 relative overflow-hidden">
        {/* decorative background blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex gap-2">
            <Badge
              variant="secondary"
              className="bg-green-100/80 text-green-700 hover:bg-green-100 border-green-200/60 transition-colors"
            >
              For Sale
            </Badge>
            {selectedProduct.stock <= 3 && selectedProduct.stock > 0 && (
              <Badge
                variant="secondary"
                className="bg-orange-100/80 text-orange-700 hover:bg-orange-100 border-orange-200/60 transition-colors animate-pulse"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Limited
              </Badge>
            )}
          </div>
          <span className="text-3xl font-bold text-primary tracking-tight">
            ฿{Number(selectedProduct.price).toLocaleString()}
          </span>
        </div>

        <div
          className="aspect-square w-full bg-muted/30 rounded-2xl mb-5 overflow-hidden border border-border/40 relative group shadow-inner cursor-zoom-in"
          onClick={() => {
            if (selectedProduct.imageUrl) {
              setViewerImages([selectedProduct.imageUrl]);
              setIsViewerOpen(true);
            }
          }}
        >
          {selectedProduct.imageUrl ? (
            <img
              src={api.getImageUrl(selectedProduct.imageUrl)}
              alt={selectedProduct.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <ShoppingBag size={64} strokeWidth={1.5} />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2 leading-tight">
          {selectedProduct.name}
        </h2>

        {/* Stock Indicator */}
        <div className="mb-4 flex items-center gap-2">
          <Package
            className={cn(
              "w-4 h-4",
              selectedProduct._count?.offers
                ? "text-orange-600"
                : selectedProduct.stock > 0
                  ? "text-green-600"
                  : "text-red-600"
            )}
          />
          <span
            className={cn(
              "text-sm font-medium",
              selectedProduct._count?.offers
                ? "text-orange-600"
                : selectedProduct.stock > 0
                  ? "text-green-600"
                  : "text-red-600"
            )}
          >
            {selectedProduct._count?.offers
              ? `Wait ${selectedProduct._count.offers}`
              : selectedProduct.stock > 0
                ? "Available"
                : "Sold out"}
          </span>
        </div>

        {/* Shipping Cost */}
        {post.shippingCost !== undefined && (
          <div className="mb-4 flex items-center gap-2">
            <Truck
              className={cn(
                "w-4 h-4",
                parseFloat(post.shippingCost) === 0
                  ? "text-green-600"
                  : "text-blue-600",
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                parseFloat(post.shippingCost) === 0
                  ? "text-green-600"
                  : "text-blue-600",
              )}
            >
              {parseFloat(post.shippingCost) === 0
                ? "Free Shipping"
                : `Shipping: ฿${parseFloat(post.shippingCost).toLocaleString()}`}
            </span>
          </div>
        )}

        <p className="text-muted-foreground text-sm mb-6 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/30">
          {selectedProduct.description || "No description available."}
        </p>



        {/* Offer Status Check */}
        {(() => {
          const myOffers = selectedProduct.offers || [];
          const alreadyOffered = myOffers.length > 0;

          const isOwnPost = user?.id === post.author.id;

          return (
            <div className="space-y-3 relative z-10">
              {isOwnPost ? (
                // <div className="text-center text-xs text-muted-foreground font-medium bg-muted/50 p-3 rounded-xl border border-border/50">
                //   This is your post
                // </div>
                <></>
              ) : (
                <>
                  {selectedProduct.stock > 0 &&
                    !alreadyOffered &&
                    !post.deletedAt && (
                      <div className="flex gap-2">
                        <BuyNowButton
                          productId={selectedProduct.id}
                          productName={selectedProduct.name}
                          productPrice={selectedProduct.price}
                          onSuccess={onUpdate}
                        />
                        <MakeOfferButton
                          productId={selectedProduct.id}
                          productName={selectedProduct.name}
                          productPrice={selectedProduct.price}
                          onSuccess={onUpdate}
                        />
                      </div>
                    )}
                  {alreadyOffered && (
                    <div className="text-center text-xs text-orange-600 font-medium bg-orange-50 p-2 rounded-lg border border-orange-100">
                      You have a pending offer for this item
                    </div>
                  )}
                  {user && user.id !== post.author.id && (
                    <Button
                      variant="outline"
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 h-11 rounded-xl transition-all hover:border-blue-300 hover:-translate-y-0.25"
                      onClick={() => {
                        openChat(post.author as any);
                      }}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contact Seller
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* <div className="mt-6 pt-6 border-t border-dashed border-border">
          <div className="flex items-center gap-3.5">
            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600 border border-orange-100 shadow-sm">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Location
              </p>
              <p className="text-sm font-semibold text-foreground/90">
                Bangkok, Thailand
              </p>
            </div>
          </div>
        </div> */}
      </div>

      <ImageViewer
        images={viewerImages}
        initialIndex={0}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </div>
  );
}
