"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Order } from "@/types/marketplace";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order;
    onSuccess?: () => void;
}

export function PaymentDialog({ open, onOpenChange, order, onSuccess }: PaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            toast.error("Please upload a payment slip");
            return;
        }

        try {
            setIsLoading(true);

            // 1. Upload Slip
            // 1. Upload Slip
            const slipUrl = await api.uploadImage(selectedFile, 'slip');

            // 2. Confirm Payment
            await api.patch(`/orders/${order.id}/pay`, {
                slipUrl
            });

            toast.success("Payment confirmed!");
            onOpenChange(false);
            onSuccess?.();
            setSelectedFile(null); // Reset
        } catch (error) {
            toast.error(getErrorMessage(error) || "Failed to confirm payment");
        } finally {
            setIsLoading(false);
        }
    };

    const paymentInfo = order.paymentSnapshot as any;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Payment</DialogTitle>
                    <DialogDescription>
                        Transfer money to the seller and upload your slip.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Bank Info Display */}
                    <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                        <div className="font-semibold text-foreground">Seller Bank Account</div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank:</span>
                            <span>{paymentInfo?.bankName || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Name:</span>
                            <span>{paymentInfo?.sellerName || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Number:</span>
                            <span className="font-mono font-medium">{paymentInfo?.bankAccount || '-'}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Slip</Label>
                        <div className="border-2 border-dashed border-input hover:bg-muted/50 transition-colors rounded-lg p-6 text-center cursor-pointer relative">
                            <Input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            
                            {selectedFile ? (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-green-600">
                                        {selectedFile.name}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Click to change</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <div className="text-sm font-medium">Click to upload slip</div>
                                    <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !selectedFile}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
