"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Changed from Input to Textarea for address
import { Label } from "@/components/ui/label";
import { Post, Product } from "@/types";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, MapPin, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Address } from "@/types/marketplace";
import { cn } from "@/lib/utils";

interface BuyNowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    post: Post;
    onSuccess?: () => void;
}

export function BuyNowDialog({ open, onOpenChange, product, post, onSuccess }: BuyNowDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [myAddresses, setMyAddresses] = useState<Address[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

    const [sellerBankAccount, setSellerBankAccount] = useState<any>(null);
    const [isLoadingBank, setIsLoadingBank] = useState(false);
    const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);

    useEffect(() => {
        if (open) {
            fetchMyAddresses();
            if (post.authorId) {
                fetchSellerBank(post.authorId);
            }
        } else {
            setPaymentSlipFile(null);
            setSellerBankAccount(null);
        }
    }, [open, post.authorId]);

    const fetchMyAddresses = async () => {
        try {
            setIsLoadingAddresses(true);
            const data = await api.get<Address[]>("/addresses/me");
            setMyAddresses(data);
            const defaultAddr = data.find(a => a.isDefault);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
            } else if (data.length > 0) {
                setSelectedAddressId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", getErrorMessage(error));
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    const fetchSellerBank = async (sellerId: string) => {
        try {
            setIsLoadingBank(true);
            const bankAccount = await api.get<any>(`/bank-accounts/user/${sellerId}`);
            setSellerBankAccount(bankAccount);
        } catch (error) {
            console.error("Failed to fetch bank:", error);
            setSellerBankAccount(null);
        } finally {
            setIsLoadingBank(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedAddressId) { toast.error("Please select a shipping address"); return; }
        if (!paymentSlipFile) { toast.error("Please upload a payment slip"); return; }
        if (!sellerBankAccount) { toast.error("Seller has no bank account. Cannot checkout."); return; }

        const selectedAddress = myAddresses.find(a => a.id === selectedAddressId);
        if (!selectedAddress) { toast.error("Invalid shipping address selected"); return; }
        const shippingAddressString = `${selectedAddress.addressLine1} ${selectedAddress.addressLine2 ? selectedAddress.addressLine2 + ' ' : ''}${selectedAddress.subDistrict}, ${selectedAddress.district}, ${selectedAddress.province} ${selectedAddress.postalCode} ${selectedAddress.phoneNumber ? '(Phone: ' + selectedAddress.phoneNumber + ')' : ''}`.trim();

        try {
            setIsLoading(true);

            // Upload slip
            const slipUrl = await api.uploadImage(paymentSlipFile, 'slip');

            // POST /orders/create
            await api.post('/orders/create', {
                items: [{
                    productId: product.id,
                    quantity: 1
                }],
                shippingAddress: shippingAddressString,
                paymentSlipUrl: slipUrl
            });

            toast.success("Order placed successfully!");
            onOpenChange(false);
            onSuccess?.();

        } catch (error) {
            toast.error(getErrorMessage(error) || "Failed to place order");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Complete Checkout for {product.name}</DialogTitle>
                    <DialogDescription>
                        Confirm your purchase, select shipping details, and upload payment slip.
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

                    {/* Order Summary */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                        <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Order Summary</h3>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal (1 item)</span>
                            <span>฿{parseInt(product.price).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Shipping Fee</span>
                            <span>{post.shippingCost && parseFloat(post.shippingCost) > 0 ? `฿${parseFloat(post.shippingCost).toLocaleString()}` : "Free"}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 text-base">
                            <span>Total Payment</span>
                            <span className="text-indigo-600">฿{(parseInt(product.price) + (post.shippingCost ? parseFloat(post.shippingCost) : 0)).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Shipping Address</Label>
                        {isLoadingAddresses ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                        ) : myAddresses.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {myAddresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        className={cn(
                                            "p-3 rounded-lg border cursor-pointer transition-colors relative",
                                            selectedAddressId === addr.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
                                        )}
                                    >
                                        <div className="font-semibold text-sm text-gray-900 mb-1">{addr.label} {addr.isDefault && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Default</span>}</div>
                                        <div className="text-sm text-gray-600">
                                            {addr.addressLine1} {addr.addressLine2}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {addr.subDistrict}, {addr.district}, {addr.province} {addr.postalCode}
                                            {addr.phoneNumber && <span> • {addr.phoneNumber}</span>}
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full mt-2" onClick={() => { onOpenChange(false); router.push("/settings/address"); }}>
                                    Manage Addresses
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-200 text-center space-y-3">
                                <p>You haven't added any shipping address yet.</p>
                                <Button onClick={() => { onOpenChange(false); router.push("/settings/address"); }}>
                                    Add Address
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Bank Info Display */}
                    {isLoadingBank ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                    ) : sellerBankAccount ? (
                        <div className="p-4 bg-indigo-50 rounded-xl text-sm space-y-2 border border-indigo-100">
                            <div className="font-semibold text-indigo-900">Transfer Payment To</div>
                            <div className="flex justify-between">
                                <span className="text-indigo-700">Bank:</span>
                                <span className="font-medium text-indigo-900">{sellerBankAccount.bank?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-indigo-700">Account Name:</span>
                                <span className="font-medium text-indigo-900">{sellerBankAccount.accountName || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-indigo-700">Account Number:</span>
                                <span className="font-mono font-bold text-indigo-900">{sellerBankAccount.accountNumber || '-'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            Seller has no bank account. Cannot checkout.
                        </div>
                    )}

                    {/* Payment Slip Upload */}
                    <div className="space-y-2">
                        <Label>Payment Slip</Label>
                        <div className="border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors rounded-xl p-6 text-center cursor-pointer relative bg-gray-50">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setPaymentSlipFile(e.target.files[0]);
                                    }
                                }}
                            />
                            {paymentSlipFile ? (
                                <div className="space-y-2">
                                    <div className="text-sm font-bold text-emerald-600 bg-emerald-50 py-2 px-4 rounded-lg inline-block border border-emerald-200">
                                        {paymentSlipFile.name}
                                    </div>
                                    <p className="text-xs text-gray-500">Click to replace</p>
                                </div>
                            ) : (
                                <div className="space-y-2 text-gray-500">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm border border-gray-200">
                                        <ShoppingCart size={20} className="text-indigo-400" />
                                    </div>
                                    <div className="text-sm font-medium">Click to upload slip</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !selectedAddressId || !paymentSlipFile || !sellerBankAccount}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Purchase
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
