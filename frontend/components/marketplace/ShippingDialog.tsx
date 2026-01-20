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
    const [trackingNumber, setTrackingNumber] = useState("");

    const handleSubmit = async () => {
        if (!trackingNumber.trim()) {
            toast.error("Please enter a tracking number");
            return;
        }

        try {
            setIsLoading(true);

            await api.patch(`/orders/${order.id}/ship`, {
                trackingNumber
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mark as Shipped</DialogTitle>
                    <DialogDescription>
                        Enter the tracking number to notify the buyer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Tracking Number</Label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="e.g. TH123456789" 
                                className="pl-9"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Please ensure the tracking number is correct.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !trackingNumber.trim()}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Shipping
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
