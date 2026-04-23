"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Order } from "@/types/marketplace";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";

interface ShippingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order;
    onSuccess?: () => void;
}

export function ShippingDialog({ open, onOpenChange, order, onSuccess }: ShippingDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");

    // Update state if order prop changes (e.g. re-opening dialog)
    useState(() => {
        setTrackingNumber(order.trackingNumber || "");
    });

    const handleSubmit = async () => {
        // Tracking number is optional now
        try {
            setIsLoading(true);

            await api.patch(`/orders/${order.id}/ship`, {
                trackingNumber: trackingNumber.trim() || null // Send null if empty
            });

            toast.success("Order marked as shipped!");
            onOpenChange(false);
            onSuccess?.();
            setTrackingNumber(""); // Reset
        } catch (error) {
            toast.error(getErrorMessage(error) || "Failed to update shipping status");
        } finally {
            setIsLoading(false);
        }
    };

    const isUpdate = order.status === "TO_RECEIVE";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isUpdate ? "Update Tracking Number" : "Mark as Shipped"}</DialogTitle>
                    <DialogDescription>
                        {isUpdate
                            ? "Enter the new tracking number."
                            : "Enter the tracking number to notify the buyer (Optional)."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Tracking Number {isUpdate ? "" : "(Optional)"}</Label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="e.g. TH123456789"
                                className="pl-9"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                        </div>
                        {!isUpdate && (
                            <p className="text-xs text-muted-foreground">
                                You can add it later if you don't have it yet.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUpdate ? "Update Tracking" : "Confirm Shipping"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
