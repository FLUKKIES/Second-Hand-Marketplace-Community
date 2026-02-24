"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Offer } from "@/types/marketplace";
import { OfferStatusBadge } from "./OfferStatusBadge";
import { api, getErrorMessage } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import { CounterOfferDialog } from "./CounterOfferDialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface BankAccount {
  id: string;
  bank: { name: string; code: string };
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

interface OfferCardProps {
  offer: Offer;
  role: "buyer" | "seller";
  onUpdate?: () => void;
  hasUserBankAccount?: boolean;
  hideUserProfile?: boolean;
}

export function OfferCard({
  offer,
  role,
  onUpdate,
  hasUserBankAccount,
  userBankAccounts,
  hideUserProfile,
}: OfferCardProps & { userBankAccounts?: BankAccount[] }) {
  const [isCounterDialogOpen, setIsCounterDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (offer.status !== "ACCEPTED" || !offer.expiresAt || offer.orderId) return;

    const calculateTimeLeft = () => {
      const difference = new Date(offer.expiresAt!).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [offer.expiresAt, offer.status, offer.orderId]);

  const requestCounter = () => {
    checkBankBeforeAction(() => {
      setIsCounterDialogOpen(true);
    });
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "ACCEPT" | "REJECT" | "CANCEL" | null;
    type: "OFFER" | "COUNTER";
  }>({ open: false, action: null, type: "OFFER" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isBuyer = role === "buyer";
  const isSeller = role === "seller";
  const product = offer.product;

  const isExpired = offer.expiresAt && new Date(offer.expiresAt) < new Date();

  // Turn-based logic using lastCounteredBy
  // When PENDING: only seller can respond
  // When COUNTER_OFFERED + lastCounteredBy=SELLER: buyer's turn
  // When COUNTER_OFFERED + lastCounteredBy=BUYER: seller's turn
  const canRespond = offer.status === "PENDING" && isSeller && !isExpired;
  const canRespondCounter =
    offer.status === "COUNTER_OFFERED" &&
    !isExpired &&
    ((isBuyer && offer.lastCounteredBy === "SELLER") ||
      (isSeller && offer.lastCounteredBy === "BUYER"));

  const isWaiting =
    offer.status === "COUNTER_OFFERED" &&
    !isExpired &&
    ((isBuyer && offer.lastCounteredBy === "BUYER") ||
      (isSeller && offer.lastCounteredBy === "SELLER"));

  // Local state for accounts in case props are missing/stale
  const [localBankAccounts, setLocalBankAccounts] = useState<BankAccount[]>([]);

  // Use props if available, otherwise local state
  const accountsToUse =
    userBankAccounts && userBankAccounts.length > 0
      ? userBankAccounts
      : localBankAccounts;

  useEffect(() => {
    // If props are empty but we expect to need them (seller accepting), fetch them.
    if (isSeller && (!userBankAccounts || userBankAccounts.length === 0)) {
      api
        .get<BankAccount[]>("/bank-accounts/me")
        .then((data) => {
          if (Array.isArray(data)) {
            setLocalBankAccounts(data);
          }
        })
        .catch((err) =>
          console.error("Failed to fetch bank accounts in OfferCard", err),
        );
    }
  }, [isSeller, userBankAccounts, confirmDialog.open]); // Try fetching when dialog opens too

  const checkBankBeforeAction = (callback: () => void) => {
    if (isSeller && accountsToUse.length === 0) {
      setIsBankDialogOpen(true);
    } else {
      callback();
    }
  };

  const requestAccept = () => {
    checkBankBeforeAction(() => {
      setConfirmDialog({
        open: true,
        action: "ACCEPT",
        type: canRespondCounter ? "COUNTER" : "OFFER",
      });
    });
  };

  const executeAccept = async () => {
    try {
      setIsLoading(true);
      if (isSeller) {
        await api.patch(`/offers/${offer.id}/respond`, {
          action: "ACCEPT",
        });
        toast.success("Offer accepted!");
      } else if (canRespondCounter) {
        await api.patch(`/offers/${offer.id}/respond-counter`, {
          action: "ACCEPT",
        });
        toast.success("Counter offer accepted! Order created.");
      }
      onUpdate?.();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to accept offer");
    } finally {
      setIsLoading(false);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const requestReject = () => {
    setConfirmDialog({
      open: true,
      action: "REJECT",
      type: canRespondCounter ? "COUNTER" : "OFFER",
    });
  };

  const executeReject = async () => {
    try {
      setIsLoading(true);
      if (isSeller) {
        await api.patch(`/offers/${offer.id}/respond`, {
          action: "REJECT",
        });
        toast.success("Offer rejected");
      } else if (canRespondCounter) {
        await api.patch(`/offers/${offer.id}/respond-counter`, {
          action: "REJECT",
        });
        toast.success("Counter offer rejected");
      }
      onUpdate?.();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to reject offer");
    } finally {
      setIsLoading(false);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const requestCancel = () => {
    setConfirmDialog({
      open: true,
      action: "CANCEL",
      type: "OFFER",
    });
  };

  const executeCancel = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/offers/${offer.id}/cancel`);
      toast.success("Offer cancelled successfully");
      onUpdate?.();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to cancel offer");
    } finally {
      setIsLoading(false);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };


  return (
    <>
      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden hover-lift animate-fade-in">
        {/* Header */}
        <div className="p-5 flex gap-4 items-start">
          <Link
            href={`/post/${product.postId || "#"}`}
            className={cn(
              "block h-20 w-20 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden relative hover:opacity-80 transition-opacity",
              !product.postId && "pointer-events-none",
            )}
          >
            {product.imageUrl ? (
              <img
                src={api.getImageUrl(product.imageUrl)}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ShoppingBag className="text-muted-foreground/30" size={32} />
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/post/${product.postId || "#"}`}
              className={cn(
                "hover:underline block",
                !product.postId && "pointer-events-none",
              )}
            >
              <h3 className="font-bold text-base text-foreground truncate">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description || "No description"}
            </p>

            {isSeller && offer.buyer && !hideUserProfile && (
              <Link
                href={`/profile/${offer.buyer.username}`}
                className="flex items-center gap-2 mt-2 hover:opacity-80 transition-opacity w-fit"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={api.getImageUrl(offer.buyer.avatarUrl)} />
                  <AvatarFallback>{offer.buyer.username[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  from{" "}
                  <span className="font-medium text-foreground hover:underline">
                    {offer.buyer.username}
                  </span>
                </span>
              </Link>
            )}
          </div>

          <OfferStatusBadge status={offer.status} />
        </div>

        {/* Price Info */}
        <div className="px-5 pb-4 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">
              Original Price:
            </span>
            <span className="text-sm font-medium line-through text-muted-foreground">
              ฿{parseInt(product.price).toLocaleString()}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">
              Offered Price:
            </span>
            <span className="text-lg font-bold text-primary">
              ฿{parseInt(offer.offeredPrice).toLocaleString()}
            </span>
          </div>

          {offer.counterPrice && (
            <div className="flex items-baseline gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Counter Offer:
              </span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                ฿{parseInt(offer.counterPrice).toLocaleString()}
              </span>
            </div>
          )}

          {offer.buyerNote && (
            <div className="text-xs text-muted-foreground italic mt-2">
              "{offer.buyerNote}"
            </div>
          )}

          {offer.negotiationNote && (
            <div className="text-xs text-orange-600 dark:text-orange-400 italic mt-2">
              {offer.lastCounteredBy === "SELLER" ? "Seller" : "Buyer"}: "{offer.negotiationNote}"
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2">
            {new Date(offer.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
            {new Date(offer.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {formatDistanceToNow(new Date(offer.createdAt), {
              addSuffix: true,
            })}
            {offer.expiresAt && (
              <>
                {" "}
                • Expires{" "}
                {formatDistanceToNow(new Date(offer.expiresAt), {
                  addSuffix: true,
                })}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {(canRespond || canRespondCounter) && (
          <div className="px-5 pb-5 flex gap-2">
            {/* Seller: can respond when PENDING or when buyer countered back */}
            {isSeller && (canRespond || canRespondCounter) && (
              <>
                <Button
                  onClick={requestAccept}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button
                  onClick={requestCounter}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  Counter
                </Button>
                <Button
                  onClick={requestReject}
                  variant="destructive"
                  disabled={isLoading}
                >
                  Reject
                </Button>
              </>
            )}

            {/* Buyer: can respond when seller countered */}
            {isBuyer && canRespondCounter && (
              <>
                <Button
                  onClick={requestAccept}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Accept Counter
                </Button>
                <Button
                  onClick={requestCounter}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  Counter Back
                </Button>
                <Button
                  onClick={requestReject}
                  variant="destructive"
                  disabled={isLoading}
                >
                  Reject
                </Button>
              </>
            )}

            {/* Buyer Cancel Button (only when PENDING = no counter yet) */}
            {isBuyer && offer.status === "PENDING" && !isExpired && (
              <Button
                onClick={requestCancel}
                variant="outline"
                disabled={isLoading}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Cancel Offer
              </Button>
            )}
          </div>
        )}

        {/* Waiting banner when it's the other party's turn */}
        {isWaiting && (
          <div className="px-5 pb-5">
            <div className="text-center text-sm text-muted-foreground py-2 bg-muted/50 rounded-lg">
              Waiting for {offer.lastCounteredBy === "BUYER" ? "seller" : "buyer"} to respond…
            </div>
          </div>
        )}

        {isExpired && offer.status !== "EXPIRED" && (
          <div className="px-5 pb-5">
            <div className="text-center text-sm text-red-600 dark:text-red-400 py-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
              This offer has expired
            </div>
          </div>
        )}

        {offer.status === "ACCEPTED" && offer.expiresAt && !offer.orderId && timeLeft !== "Expired" && (
          <div className="px-5 pb-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 py-3 rounded-lg border border-emerald-200 shadow-sm shadow-emerald-100">
              <span className="animate-pulse text-lg">⏳</span> Checkout Time Left: <span className="font-mono text-lg">{timeLeft}</span>
            </div>
            {isBuyer && (
              <div className="text-xs text-center mt-2 text-gray-500">
                Complete your checkout in the My Offers tab before time runs out!
              </div>
            )}
            {isSeller && (
              <div className="text-xs text-center mt-2 text-gray-500">
                Awaiting buyer's checkout...
              </div>
            )}
          </div>
        )}
      </div>

      <CounterOfferDialog
        open={isCounterDialogOpen}
        onOpenChange={setIsCounterDialogOpen}
        offer={offer}
        role={role}
        onSuccess={() => {
          setIsCounterDialogOpen(false);
          onUpdate?.();
        }}
      />

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "ACCEPT"
                ? "Accept Offer"
                : confirmDialog.action === "CANCEL"
                  ? "Cancel Offer"
                  : "Reject Offer"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "ACCEPT"
                ? "Please review the transaction details and select your receiving bank account."
                : confirmDialog.action === "CANCEL"
                  ? "Are you sure you want to cancel this offer? This action cannot be undone."
                  : "Are you sure you want to reject this offer?"}
            </DialogDescription>
          </DialogHeader>

          {confirmDialog.action === "ACCEPT" && isSeller && (
            <div className="space-y-6 py-2">
              {/* Transaction Info */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium text-foreground">
                    {product.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyer:</span>
                  <span className="font-medium text-foreground">
                    {offer.buyer?.username || "Unknown Buyer"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                  <span className="text-muted-foreground">{offer.counterPrice ? "Countered Price:" : "Offered Price:"}</span>
                  <span className="font-bold text-lg text-primary">
                    ฿{parseInt(offer.counterPrice || offer.offeredPrice).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={
                confirmDialog.action === "ACCEPT"
                  ? executeAccept
                  : confirmDialog.action === "CANCEL"
                    ? executeCancel
                    : executeReject
              }
              variant={
                confirmDialog.action === "REJECT" || confirmDialog.action === "CANCEL" ? "destructive" : "default"
              }
            >
              Confirm {confirmDialog.action === "ACCEPT" ? "Accept" : confirmDialog.action === "CANCEL" ? "Cancel Order" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bank Account Required</DialogTitle>
            <DialogDescription>
              You need to add a bank account before you can accept or counter offers. This ensures you can receive payments from buyers.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-500/50 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Please navigate to Bank Settings to add your receiving account.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBankDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => window.location.href = "/settings/bank"}>
              Add Bank Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
