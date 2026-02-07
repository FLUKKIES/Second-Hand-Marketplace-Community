"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

interface BuyNowButtonProps {
  productId: string;
  productName: string;
  productPrice: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function BuyNowButton({
  productId,
  productName,
  productPrice,
  disabled,
  onSuccess,
}: BuyNowButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);
  const [checkingAddress, setCheckingAddress] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCheckingAddress(true);
      setHasAddress(false);
      checkAddress();
    }
  }, [isOpen]);

  const checkAddress = async () => {
    try {
      const addresses = await api.get<any[]>("/addresses/me");
      setHasAddress(addresses && addresses.length > 0);
    } catch (error) {
      console.error("Failed to check address:", error);
    } finally {
      setCheckingAddress(false);
    }
  };

  const handleBuyNow = async () => {
    if (!hasAddress) {
      toast.error("Please add a shipping address first", {
        action: {
          label: "Add Address",
          onClick: () => (window.location.href = "/settings/address"),
        },
      });
      return;
    }

    try {
      setIsLoading(true);
      // Create offer with full price (same as Make Offer but with product price)
      await api.post("/offers", {
        productId,
        offeredPrice: parseFloat(productPrice),
        buyerNote: "Buy Now - Full Price",
      });

      toast.success("Offer sent at full price! Waiting for seller approval.");
      setIsOpen(false);

      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback to redirect if no callback provided
        window.location.href = "/marketplace/my-offers";
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to send offer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-1/2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 h-11 rounded-xl font-medium transition-all hover:-translate-y-0.25"
        disabled={disabled}
      >
        <ShoppingBag className="w-5 h-5 mr-2" />
        Buy Now
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to buy "{productName}" at full price?
            </DialogDescription>
          </DialogHeader>

          {checkingAddress ? (
            <div className="py-8 text-center text-muted-foreground">
              Checking requirements...
            </div>
          ) : !hasAddress ? (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-500/50 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  You need to add a shipping address before making a purchase.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => (window.location.href = "/settings/address")}
                >
                  Add Address
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{productName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-bold text-lg text-primary">
                    ฿{parseInt(productPrice).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                An offer will be sent to the seller at full price for approval.
              </p>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleBuyNow} disabled={isLoading}>
                  {isLoading ? "Processing..." : "Confirm Purchase"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
