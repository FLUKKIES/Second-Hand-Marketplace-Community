import { useState } from "react";
import { Order } from "@/types/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Package, Truck, CheckCircle, XCircle, UploadCloud } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShippingDialog } from "./ShippingDialog";
import { ReviewDialog } from "./ReviewDialog";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrderCardProps {
    order: Order;
    role: "buyer" | "seller";
    onUpdate: () => void;
    hideUserProfile?: boolean;
}

export function OrderCard({ order, role, onUpdate, hideUserProfile }: OrderCardProps) {
    const isBuyer = role === "buyer";
    const otherParty = isBuyer ? order.seller : order.buyer;
    const [isShippingOpen, setIsShippingOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "TO_VERIFY": return "bg-yellow-100 text-yellow-800";
            case "TO_SHIP": return "bg-blue-100 text-blue-800";
            case "TO_RECEIVE": return "bg-purple-100 text-purple-800";
            case "COMPLETED": return "bg-green-100 text-green-800";
            case "CANCELLED": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <>
            <Card className="p-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            {!hideUserProfile && otherParty ? (
                                <Link href={`/profile/${otherParty.username}`} className="flex items-center gap-2 group">
                                    <Avatar className="h-6 w-6 border border-gray-200">
                                        <AvatarImage src={api.getImageUrl(otherParty.avatarUrl)} />
                                        <AvatarFallback className="text-[10px]">{otherParty.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 group-hover:underline transition-colors">
                                        {isBuyer ? "Seller" : "Buyer"}: {otherParty.username}
                                    </span>
                                </Link>
                            ) : !hideUserProfile ? (
                                <span className="text-sm font-medium text-gray-900">
                                    {isBuyer ? "Seller" : "Buyer"}: Unknown
                                </span>
                            ) : null}
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                                {order.status.replace("_", " ")}
                            </Badge>
                        </div>
                        <span className={`text-xs text-gray-500 ${hideUserProfile ? '' : 'pl-8'}`}>
                            Order ID: {order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-indigo-600">{formatCurrency(Number(order.totalPrice))}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                            <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                {item.product.imageUrl && (
                                    <img
                                        src={api.getImageUrl(item.product.imageUrl)}
                                        alt={item.product.name}
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                                <p className="text-xs text-gray-500">x{item.quantity}</p>
                                <p className="text-xs font-semibold text-gray-700">{formatCurrency(Number(item.price))}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tracking Number Display */}
                {(order.status === "TO_RECEIVE" || order.status === "COMPLETED") && order.trackingNumber && (
                    <div className="w-full text-sm text-gray-600 bg-gray-50 p-2 rounded mb-2 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium">Tracking:</span> {order.trackingNumber}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    {/* View Slip (Both Buyer and Seller) */}
                    {["TO_VERIFY", "TO_SHIP", "TO_RECEIVE", "COMPLETED"].includes(order.status) && order.paymentSlipUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(api.getImageUrl(order.paymentSlipUrl), "_blank")}
                        >
                            <UploadCloud className="w-4 h-4 mr-2" />
                            View Slip
                        </Button>
                    )}

                    {/* Seller Actions: Verify Payment */}
                    {!isBuyer && order.status === "TO_VERIFY" && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verify Payment
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Verify Payment Slip</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to verify this payment? Please ensure you have checked your bank account and confirmed that the transferred amount matches the order total.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={async () => {
                                            try {
                                                await api.patch(`/orders/${order.id}/verify`, {});
                                                toast.success("Payment verified! Order is now TO_SHIP.");
                                                onUpdate();
                                            } catch (error) {
                                                toast.error(getErrorMessage(error) || "Failed to verify payment");
                                            }
                                        }}
                                    >
                                        Yes, Verify Payment
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* Buyer Actions: Mark as Received */}
                    {isBuyer && order.status === "TO_RECEIVE" && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Order Received
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Order Receipt</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you have received this order? This action cannot be undone and will complete the order.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={async () => {
                                            try {
                                                await api.patch(`/orders/${order.id}/receive`, {});
                                                toast.success("Order marked as received!");
                                                setPendingUpdate(true);
                                                setIsReviewOpen(true);
                                            } catch (error) {
                                                toast.error(getErrorMessage(error));
                                            }
                                        }}
                                    >
                                        Confirm Received
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* Buyer Actions: Review */}
                    {isBuyer && order.status === "COMPLETED" && !order.review && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsReviewOpen(true)}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Review Seller
                        </Button>
                    )}



                    {/* Seller Actions: Ship Order / Edit Tracking */}
                    {!isBuyer && (order.status === "TO_SHIP" || order.status === "TO_RECEIVE") && (
                        <Button
                            variant={order.status === "TO_RECEIVE" ? "secondary" : "default"}
                            size="sm"
                            onClick={() => setIsShippingOpen(true)}
                            className={order.status === "TO_SHIP" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                        >
                            <Truck className="w-4 h-4 mr-2" />
                            {order.status === "TO_SHIP" ? "Ship Order" : "Edit Tracking"}
                        </Button>
                    )}

                    <Link href={`/marketplace/orders/${order.id}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full">
                            View Details
                        </Button>
                    </Link>
                </div>
            </Card >

            <ShippingDialog
                open={isShippingOpen}
                onOpenChange={setIsShippingOpen}
                order={order}
                onSuccess={onUpdate}
            />

            <ReviewDialog
                open={isReviewOpen}
                onOpenChange={(open) => {
                    setIsReviewOpen(open);
                    if (!open && pendingUpdate) {
                        onUpdate();
                        setPendingUpdate(false);
                    }
                }}
                order={order}
                onSuccess={() => {
                    if (!pendingUpdate) onUpdate();
                }}
            />
        </>
    );
}
