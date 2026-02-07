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
}

export function OfferCard({
  offer,
  role,
  onUpdate,
  hasUserBankAccount,
  userBankAccounts,
}: OfferCardProps & { userBankAccounts?: BankAccount[] }) {
  const [isCounterDialogOpen, setIsCounterDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState<string>("");

  const requestCounter = () => {
    if (isSeller) {
      const hasAccounts =
        (userBankAccounts && userBankAccounts.length > 0) ||
        localBankAccounts.length > 0;

      if (!hasAccounts) {
        setIsBankDialogOpen(true);
        return;
      }
    }
    setIsCounterDialogOpen(true);
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
  const canRespond = offer.status === "PENDING" && !isExpired;
  const canRespondCounter = offer.status === "COUNTER_OFFERED" && !isExpired;

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

  const requestAccept = () => {
    // Validation: Seller must have bank account to accept offer
    if (isSeller) {
      // Check both sources
      const hasAccounts =
        (userBankAccounts && userBankAccounts.length > 0) ||
        localBankAccounts.length > 0;

      // If we don't have accounts yet, we might need to wait for fetch?
      // But if fetch failed or really 0, we show dialog.
      // We rely on "hasUserBankAccount" prop for the initial check,
      // OR we just let the dialog open and show "No accounts" state.

      // Actually, if we have 0 accounts, we should probably warn?
      // But let's assume the UI inside the dialog handles the "0 accounts" case
      // by disabling the button and showing the message.

      // Note: We modified the UI to show a red box if 0 accounts.
      if (!hasAccounts) {
        setIsBankDialogOpen(true);
        return;
      }

      // Auto-select logic:
      if (accountsToUse.length === 1) {
        setSelectedBankAccountId(accountsToUse[0].id);
      } else {
        setSelectedBankAccountId(""); // Clear selection to force choice
      }
    }

    setConfirmDialog({
      open: true,
      action: "ACCEPT",
      type: canRespondCounter ? "COUNTER" : "OFFER",
    });
  };

  const executeAccept = async () => {
    try {
      setIsLoading(true);
      if (isSeller) {
        await api.patch(`/offers/${offer.id}/respond`, {
          action: "ACCEPT",
          bankAccountId: selectedBankAccountId || undefined, // Send selected ID
        });
        toast.success("Offer accepted! Order created.");

        // Redirect to My Sales page
        router.push("/marketplace/orders?tab=selling");
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

            {isSeller && offer.buyer && (
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

          {offer.counterNote && (
            <div className="text-xs text-orange-600 dark:text-orange-400 italic mt-2">
              Seller: "{offer.counterNote}"
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2">
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
            {isSeller && canRespond && (
              <>
                <Button
                  onClick={requestAccept}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Accept Offer
                </Button>
                <Button
                  onClick={requestCounter}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  Counter Offer
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
                  onClick={requestReject}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  Reject Counter
                </Button>
              </>
            )}

            {/* Buyer Cancel Button */}
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

        {isExpired && offer.status !== "EXPIRED" && (
          <div className="px-5 pb-5">
            <div className="text-center text-sm text-red-600 dark:text-red-400 py-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
              This offer has expired
            </div>
          </div>
        )}
      </div>

      {isSeller && (
        <CounterOfferDialog
          open={isCounterDialogOpen}
          onOpenChange={setIsCounterDialogOpen}
          offer={offer}
          onSuccess={() => {
            setIsCounterDialogOpen(false);
            onUpdate?.();
          }}
        />
      )}

      <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bank Account Required</DialogTitle>
            <DialogDescription>
              Please add a bank account before accepting an order. This is
              required for buyers to pay you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBankDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => (window.location.href = "/settings/bank")}>
              Go to Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <span className="text-muted-foreground">Offered Price:</span>
                  <span className="font-bold text-lg text-primary">
                    ฿{parseInt(offer.offeredPrice).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bank Selection */}
              {accountsToUse && accountsToUse.length > 0 ? (
                <div className="space-y-3">
                  <label className="text-sm font-medium block">
                    Select Receiving Bank Account ({accountsToUse.length}{" "}
                    available):
                  </label>
                  <RadioGroup
                    value={selectedBankAccountId}
                    onValueChange={setSelectedBankAccountId}
                    className="gap-3"
                  >
                    {accountsToUse.map((account) => (
                      <div
                        key={account.id}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg border p-4 transition-all cursor-pointer hover:bg-accent",
                          selectedBankAccountId === account.id
                            ? "border-primary ring-1 ring-primary bg-accent"
                            : "border-border",
                        )}
                        onClick={() => setSelectedBankAccountId(account.id)}
                      >
                        <RadioGroupItem value={account.id} id={account.id} />
                        <div className="flex-1 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {account.bank.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {account.accountName}
                            </span>
                          </div>
                          <span className="text-sm font-mono font-medium">
                            {account.accountNumber}
                          </span>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ) : (
                <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm">
                  Debug: No bank accounts detected (
                  {userBankAccounts?.length || 0}). Please check your settings.
                </div>
              )}
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
              disabled={
                confirmDialog.action === "ACCEPT" &&
                isSeller &&
                !selectedBankAccountId
              }
            >
              Confirm {confirmDialog.action === "ACCEPT" ? "Accept" : confirmDialog.action === "CANCEL" ? "Cancel Order" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
