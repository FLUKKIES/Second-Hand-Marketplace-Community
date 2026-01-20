"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Changed from Input to Textarea for address
import { Label } from "@/components/ui/label";
import { Post, Product } from "@/types";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface BuyNowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    post: Post;
    onSuccess?: () => void;
}

export function BuyNowDialog({ open, onOpenChange, product, post, onSuccess }: BuyNowDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [shippingAddress, setShippingAddress] = useState("");
    const router = useRouter();

    const handleSubmit = async () => {
        if (!shippingAddress.trim()) {
            toast.error("Please enter a shipping address");
            return;
        }

        try {
            setIsLoading(true);

            // POST /orders/create
            await api.post('/orders/create', {
                items: [{
                    productId: product.id,
                    quantity: 1
                }],
                shippingAddress
            });

            toast.success("Order placed successfully!");
            onOpenChange(false);
            onSuccess?.();
            setShippingAddress(""); // Reset
            
            // Optional: Redirect to orders page
            // router.push('/marketplace/orders');
        } catch (error) {
            toast.error(getErrorMessage(error) || "Failed to place order");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Buy {product.name}</DialogTitle>
                    <DialogDescription>
                        Confirm your purchase and enter shipping details.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border/50">
                         <div className="h-16 w-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center border border-border/50 overflow-hidden">
                            {product.imageUrl && (
                                <img src={api.getImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" />
                            )}
                         </div>
                         <div>
                             <h4 className="font-bold text-sm">{product.name}</h4>
                             <p className="text-primary font-bold">฿{parseInt(product.price).toLocaleString()}</p>
                         </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Shipping Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea 
                                placeholder="Enter your full shipping address..." 
                                className="pl-9 min-h-[100px] resize-none"
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !shippingAddress.trim()}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Purchase
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
