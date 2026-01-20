"use client";

import { useState } from "react";
import { Offer } from "@/types/marketplace";
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
import { Button } from "@/components/ui/button";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

interface CounterOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onSuccess?: () => void;
}

export function CounterOfferDialog({
  open,
  onOpenChange,
  offer,
  onSuccess,
}: CounterOfferDialogProps) {
  const [counterPrice, setCounterPrice] = useState(
    offer.counterPrice || offer.offeredPrice
  );
  const [counterNote, setCounterNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(counterPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    setConfirmOpen(true);
  };

  const executeSubmit = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/offers/${offer.id}/respond`, {
        action: "COUNTER",
        counterPrice: parseFloat(counterPrice),
        sellerNote: counterNote || undefined,
      });

      toast.success("Counter offer sent!");
      setConfirmOpen(false);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to send counter offer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Counter Offer</DialogTitle>
            <DialogDescription>
              Propose a different price to the buyer for "{offer.product.name}"
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Original Price</Label>
              <div className="text-sm text-muted-foreground">
                ฿{parseInt(offer.product.price).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Buyer's Offer</Label>
              <div className="text-sm text-primary font-medium">
                ฿{parseInt(offer.offeredPrice).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-price">Your Counter Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ฿
                </span>
                <Input
                  id="counter-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="pl-8"
                  placeholder="Enter your price"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-note">Note (Optional)</Label>
              <Textarea
                id="counter-note"
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                placeholder="Add a message to the buyer..."
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {counterNote.length}/500
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Counter Offer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Counter Offer?</DialogTitle>
            <DialogDescription>
              Are you sure you want to propose a price of{" "}
              <span className="font-bold text-foreground">
                ฿{parseFloat(counterPrice || "0").toLocaleString()}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeSubmit} disabled={isLoading}>
              {isLoading ? "Sending..." : "Confirm Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
