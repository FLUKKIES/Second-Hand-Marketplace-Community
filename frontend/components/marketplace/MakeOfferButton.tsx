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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { AlertCircle, Tag } from "lucide-react";

interface MakeOfferButtonProps {
  productId: string;
  productName: string;
  productPrice: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function MakeOfferButton({
  productId,
  productName,
  productPrice,
  disabled,
  onSuccess,
}: MakeOfferButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);
  const [checkingAddress, setCheckingAddress] = useState(true);

  const [offeredPrice, setOfferedPrice] = useState(productPrice);
  const [buyerNote, setBuyerNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset checking state and re-check every time dialog opens
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(offeredPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/offers", {
        productId,
        offeredPrice: price,
        buyerNote: buyerNote || undefined,
      });

      toast.success("Offer sent successfully!");
      setIsOpen(false);
      setOfferedPrice(productPrice);
      setBuyerNote("");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to make offer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="h-11 w-1/2 hover:-translate-y-0.25"
        disabled={disabled}
      >
        <Tag className="mr-2" size={16} />
        Make Offer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Propose your price for "{productName}"
            </DialogDescription>
          </DialogHeader>

          {checkingAddress ? (
            <div className="py-8 text-center text-muted-foreground">
              Checking requirements...
            </div>
          ) : !hasAddress ? (
            <div className="space-y-4">
              <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  You need to add a shipping address before making offers.
                </AlertDescription>
              </Alert>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Listed Price</Label>
                <div className="text-lg font-semibold text-muted-foreground">
                  ฿{parseInt(productPrice).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offered-price">Your Offer *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ฿
                  </span>
                  <Input
                    id="offered-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    className="pl-8"
                    placeholder="Enter your offer price"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {parseFloat(offeredPrice) < parseFloat(productPrice)
                    ? `${Math.round((1 - parseFloat(offeredPrice) / parseFloat(productPrice)) * 100)}% discount`
                    : parseFloat(offeredPrice) > parseFloat(productPrice)
                      ? "Above asking price"
                      : "Same as listing price"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer-note">Message (Optional)</Label>
                <Textarea
                  id="buyer-note"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="Add a message to the seller..."
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {buyerNote.length}/500
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Offer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
