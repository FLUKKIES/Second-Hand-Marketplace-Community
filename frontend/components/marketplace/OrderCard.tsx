"use client";

import Link from "next/link";
import { useState } from "react";
import { Order } from "@/types/marketplace";
import { api, getErrorMessage } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { PaymentDialog } from "./PaymentDialog";
import { ShippingDialog } from "./ShippingDialog";
import { ReviewDialog } from "./ReviewDialog";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  CreditCard,
  ExternalLink,
  MapPin,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderCardProps {
  order: Order;
  role: "buyer" | "seller";
  onUpdate?: () => void;
}

export function OrderCard({ order, role, onUpdate }: OrderCardProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSlipDialogOpen, setIsSlipDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isReceiveConfirmDialogOpen, setIsReceiveConfirmDialogOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isBuyer = role === "buyer";
  const isSeller = role === "seller";
  const otherParty = isBuyer ? order.seller : order.buyer;
  const items = order.items;

  // Status Config
  const statusConfig: any = {
    TO_PAY: {
      label: "To Pay",
      color: "text-orange-600 bg-orange-50",
      icon: <CreditCard size={14} />,
    },
    TO_SHIP: {
      label: "To Ship",
      color: "text-blue-600 bg-blue-50",
      icon: <Package size={14} />,
    },
    TO_RECEIVE: {
      label: "To Receive",
      color: "text-purple-600 bg-purple-50",
      icon: <Truck size={14} />,
    },
    COMPLETED: {
      label: "Completed",
      color: "text-green-600 bg-green-50",
      icon: <CheckCircle size={14} />,
    },
    CANCELLED: {
      label: "Cancelled",
      color: "text-gray-600 bg-gray-50",
      icon: <XCircle size={14} />,
    },
  };
  const status = statusConfig[order.status] || {
    label: order.status,
    color: "text-gray-600 bg-gray-50",
  };

  const handleReceive = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/orders/${order.id}/receive`, {});
      toast.success("Order completed!");
      onUpdate?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsReceiveConfirmDialogOpen(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/orders/${order.id}/cancel`, {});
      toast.success("Order cancelled");
      onUpdate?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsCancelDialogOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={api.getImageUrl(otherParty?.avatarUrl)} />
              <AvatarFallback>{otherParty?.username?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {otherParty?.username}
            </span>
          </div>
          <div
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5",
              status.color,
            )}
          >
            {status.icon}
            {status.label}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <Link
                href={`/post/${item.product.postId || "#"}`}
                className={cn(
                  "block h-16 w-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity",
                  !item.product.postId && "pointer-events-none",
                )}
              >
                {item.product.imageUrl ? (
                  <img
                    src={api.getImageUrl(item.product.imageUrl)}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="text-muted-foreground/30" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/post/${item.product.postId || "#"}`}
                  className={cn(
                    "hover:underline block",
                    !item.product.postId && "pointer-events-none",
                  )}
                >
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {item.product.name}
                  </h4>
                </Link>
                <div className="text-sm text-muted-foreground mt-1">
                  x{item.quantity}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">
                  ฿{parseInt(item.price).toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          {/* Order Details: Shipping & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
            {/* Shipping */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <MapPin size={14} /> Shipping Address
              </div>
              <p className="text-foreground pl-5 break-words line-clamp-3">
                {order.shippingAddress || "No address provided"}
              </p>
            </div>

            {/* Payment Info (Only visible if not cancelled) */}
            {order.status !== "CANCELLED" && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <CreditCard size={14} /> Payment Details
                </div>
                <div className="pl-5">
                  <p className="font-medium">
                    {order.paymentSnapshot?.bankName} -{" "}
                    {order.paymentSnapshot?.bankAccount}
                  </p>
                  <p className="text-muted-foreground">
                    {order.paymentSnapshot?.sellerName}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-dashed">
            <span className="text-sm text-muted-foreground">Total Price</span>
            <span className="text-lg font-bold text-primary">
              ฿{parseInt(order.totalPrice).toLocaleString()}
            </span>
          </div>

          {order.trackingNumber && (
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <Truck size={16} />
                <span>
                  Tracking:{" "}
                  <span className="font-mono font-medium">
                    {order.trackingNumber}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-gray-50/50 border-t border-border/50 flex flex-wrap justify-end gap-2">
          {/* View Slip Button (For Seller or Buyer) */}
          {order.paymentSlipUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSlipDialogOpen(true)}
            >
              <FileText size={14} className="mr-2" />
              View Slip
            </Button>
          )}

          {/* Pay Now (Buyer) */}
          {isBuyer && order.status === "TO_PAY" && (
            <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
              Pay Now
            </Button>
          )}

          {/* Ship Order (Seller) */}
          {isSeller && order.status === "TO_SHIP" && (
            <Button size="sm" onClick={() => setIsShippingDialogOpen(true)}>
              Ship Order
            </Button>
          )}

          {/* Receive Order (Buyer) */}
          {isBuyer && order.status === "TO_RECEIVE" && (
            <Button
              size="sm"
              onClick={() => setIsReceiveConfirmDialogOpen(true)}
              disabled={isLoading}
            >
              Order Received
            </Button>
          )}

          {/* Leave Review / Completed */}
          {order.status === "COMPLETED" &&
            (isBuyer && !order.review ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => setIsReviewDialogOpen(true)}
              >
                Leave Review
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                {order.review ? "Reviewed" : "Completed"}
              </Button>
            ))}

          {/* Cancel Order (Both parties, if active) */}
          {(order.status === "TO_PAY" || order.status === "TO_SHIP") && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {isBuyer && (
        <PaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          order={order}
          onSuccess={onUpdate}
        />
      )}

      {isSeller && (
        <ShippingDialog
          open={isShippingDialogOpen}
          onOpenChange={setIsShippingDialogOpen}
          order={order}
          onSuccess={onUpdate}
        />
      )}

      {isBuyer && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          order={order}
          onSuccess={onUpdate}
        />
      )}

      {/* Slip Dialog */}
      <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Slip</DialogTitle>
          </DialogHeader>
          <div className="mt-4 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {order.paymentSlipUrl ? (
              <img
                src={api.getImageUrl(order.paymentSlipUrl)}
                alt="Payment Slip"
                className="max-h-[500px] w-full object-contain"
              />
            ) : (
              <div className="p-10 text-muted-foreground">No slip uploaded</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order?
              {isSeller &&
                order.status === "TO_SHIP" &&
                " If the slip is incorrect, you can cancel here to reject it."}
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isLoading}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? "Cancelling..." : "Yes, Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Confirmation Dialog */}
      <Dialog
        open={isReceiveConfirmDialogOpen}
        onOpenChange={setIsReceiveConfirmDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Receipt</DialogTitle>
            <DialogDescription>
              Have you received this order and verified its contents?
              <br />
              This action will complete the order and release payment to the
              seller. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReceiveConfirmDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleReceive}
              disabled={isLoading}
            >
              {isLoading ? "Confirming..." : "Yes, I Received It"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
