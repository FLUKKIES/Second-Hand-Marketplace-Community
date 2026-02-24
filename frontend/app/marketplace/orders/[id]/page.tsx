"use client";

import { useEffect, useState, use } from "react";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Order } from "@/types/marketplace";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Package, User, MapPin, CreditCard, ChevronRight, UploadCloud, Truck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShippingDialog } from "@/components/marketplace/ShippingDialog";
import { ReviewDialog } from "@/components/marketplace/ReviewDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isShippingOpen, setIsShippingOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState(false);

    const fetchOrder = async () => {
        try {
            setIsLoading(true);
            const data = await api.get<Order>(`/orders/${id}`);
            setOrder(data);
        } catch (error) {
            console.error("Failed to fetch order:", error);
            toast.error("Failed to load order details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "TO_VERIFY": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "TO_SHIP": return "bg-blue-100 text-blue-800 border-blue-200";
            case "TO_RECEIVE": return "bg-purple-100 text-purple-800 border-purple-200";
            case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
            case "CANCELLED": return "bg-gray-100 text-gray-800 border-gray-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="text-gray-400" size={32} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                        <p className="text-gray-500 mb-6">The order you are looking for does not exist or you do not have permission to view it.</p>
                        <Link href="/marketplace/orders" className="btn-primary inline-flex">
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isBuyer = user?.id === order.buyerId;

    return (
        <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
            <Navbar />

            <main className="flex-1 pt-4 px-2 md:px-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 align-start h-full">
                    <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
                        <LeftSidebar />
                    </aside>

                    <div className="md:col-span-9 lg:col-span-9 flex flex-col h-full overflow-y-auto pb-20 scrollbar-hide rounded-tl-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95 rounded-t-xl px-6 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href="/marketplace/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                    <ArrowLeft size={20} />
                                </Link>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                        Order Details
                                        <Badge variant="outline" className={getStatusColor(order.status)}>
                                            {order.status.replace("_", " ")}
                                        </Badge>
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        ID: {order.id} • {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isBuyer && order.status === "COMPLETED" && !order.review && (
                                <Button variant="outline" onClick={() => setIsReviewOpen(true)}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Review Seller
                                </Button>
                            )}
                            {/* Seller Actions: Verify Payment */}
                            {!isBuyer && order.status === "TO_VERIFY" && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                                                        fetchOrder();
                                                    } catch (error) {
                                                        toast.error(getErrorMessage(error));
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
                                        <Button className="bg-green-600 hover:bg-green-700 text-white">
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


                            {/* Seller Actions: Ship Order / Edit Tracking */}
                            {!isBuyer && (order.status === "TO_SHIP" || order.status === "TO_RECEIVE") && (
                                <Button
                                    variant={order.status === "TO_RECEIVE" ? "secondary" : "default"}
                                    onClick={() => setIsShippingOpen(true)}
                                    className={order.status === "TO_SHIP" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                                >
                                    <Truck className="w-4 h-4 mr-2" />
                                    {order.status === "TO_SHIP" ? "Ship Order" : "Edit Tracking"}
                                </Button>
                            )}
                        </div>

                        <div className="p-6 space-y-6 max-w-4xl">
                            {/* Product List */}
                            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                                    <Package size={18} className="text-gray-500" />
                                    <h2 className="font-semibold text-gray-900">Products</h2>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="p-4 flex gap-4">
                                            <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                                {item.product.imageUrl && (
                                                    <img
                                                        src={api.getImageUrl(item.product.imageUrl)}
                                                        alt={item.product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{item.product.name}</h3>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{formatCurrency(Number(item.price))}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {(() => {
                                    const itemsSubtotal = order.items.reduce(
                                        (sum, item) => sum + Number(item.price) * item.quantity, 0
                                    );
                                    const shippingCost = Number(order.totalPrice) - itemsSubtotal;

                                    return (
                                        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span className="font-medium text-gray-700">{formatCurrency(itemsSubtotal)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 flex items-center gap-1.5">
                                                    <Truck size={14} />
                                                    Shipping
                                                </span>
                                                <span className={`font-medium ${shippingCost <= 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                                    {shippingCost <= 0 ? 'Free' : formatCurrency(shippingCost)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                                <span className="font-semibold text-gray-900">Total</span>
                                                <span className="text-xl font-bold text-indigo-600">{formatCurrency(Number(order.totalPrice))}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Shipping Address */}
                                <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full">
                                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                                        <MapPin size={18} className="text-gray-500" />
                                        <h2 className="font-semibold text-gray-900">Shipping Address</h2>
                                    </div>
                                    <div className="p-4 text-sm text-gray-600 leading-relaxed">
                                        {order.buyer && (
                                            <Link href={`/profile/${order.buyer.username}`} className="flex items-center gap-2 mb-3 group w-fit">
                                                <Avatar className="h-8 w-8 border border-gray-200">
                                                    <AvatarImage src={api.getImageUrl(order.buyer.avatarUrl)} />
                                                    <AvatarFallback>{order.buyer.username[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-gray-900 group-hover:text-indigo-600 group-hover:underline transition-colors">
                                                        {order.buyer.username}
                                                    </p>
                                                    <p className="text-xs text-gray-400">Buyer</p>
                                                </div>
                                            </Link>
                                        )}
                                        <div className="pl-10">
                                            <p>{(order as any).shippingAddress}</p>
                                            {order.trackingNumber && (
                                                <div className="mt-2 text-blue-600 font-medium flex items-center gap-1">
                                                    <Truck size={14} />
                                                    Tracking: {order.trackingNumber}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                                {/* Payment Info */}
                                <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full">
                                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                                        <CreditCard size={18} className="text-gray-500" />
                                        <h2 className="font-semibold text-gray-900">Payment Information</h2>
                                    </div>
                                    <div className="p-4">
                                        {order.paymentSnapshot ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Bank</span>
                                                    <span className="font-medium text-gray-900">{order.paymentSnapshot.bankName}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Account Name</span>
                                                    <span className="font-medium text-gray-900">{order.paymentSnapshot.sellerName}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Account Number</span>
                                                    <span className="font-medium text-gray-900 tracking-wider">{order.paymentSnapshot.bankAccount}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No payment information available.</p>
                                        )}

                                        {/* Payment Slip Display if uploaded */}
                                        {order.paymentSlipUrl && (
                                            <div className="mt-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-medium text-gray-500">Payment Slip</p>
                                                    {['TO_VERIFY', 'TO_SHIP', 'TO_RECEIVE', 'COMPLETED'].includes(order.status) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0"
                                                            onClick={() => window.open(api.getImageUrl(order.paymentSlipUrl), "_blank")}
                                                        >
                                                            <UploadCloud className="w-3 h-3 mr-1" />
                                                            View Full Slip
                                                        </Button>
                                                    )}
                                                </div>
                                                <div
                                                    className="relative aspect-[3/4] w-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(api.getImageUrl(order.paymentSlipUrl), "_blank")}
                                                >
                                                    <img
                                                        src={api.getImageUrl(order.paymentSlipUrl)}
                                                        alt="Payment Slip"
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {order && (
                <ShippingDialog
                    open={isShippingOpen}
                    onOpenChange={setIsShippingOpen}
                    order={order}
                    onSuccess={fetchOrder}
                />
            )}

            {order && (
                <ReviewDialog
                    open={isReviewOpen}
                    onOpenChange={(open) => {
                        setIsReviewOpen(open);
                        if (!open && pendingUpdate) {
                            fetchOrder();
                            setPendingUpdate(false);
                        }
                    }}
                    order={order}
                    onSuccess={() => {
                        if (!pendingUpdate) fetchOrder();
                    }}
                />
            )}
        </div>
    );
}
