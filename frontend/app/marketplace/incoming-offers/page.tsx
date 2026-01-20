"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Offer } from "@/types/marketplace";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function IncomingOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]); // NEW: Store accounts
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [checkingBankAccount, setCheckingBankAccount] = useState(true);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const offers = await api.get<Offer[]>("/offers/incoming");
      setOffers(offers);

      // Also refresh bank accounts to ensure latest data
      await checkBankAccount();
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBankAccount = async () => {
    try {
      const accounts = await api.get<any[]>("/bank-accounts/me");
      const has = Array.isArray(accounts) && accounts.length > 0;
      setBankAccounts(Array.isArray(accounts) ? accounts : []);
      setHasBankAccount(has);
    } catch (error) {
      console.error("Failed to check bank account:", error);
    } finally {
      setCheckingBankAccount(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    checkBankAccount();
  }, []);

  const pendingOffers = offers.filter(
    (o) => o.status === "PENDING" || o.status === "COUNTER_OFFERED",
  );
  const otherOffers = offers.filter(
    (o) => o.status !== "PENDING" && o.status !== "COUNTER_OFFERED",
  );

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Incoming Offers</h1>
        <p className="text-muted-foreground mt-2">
          Offers received from buyers
        </p>
      </div>

      {!checkingBankAccount && !hasBankAccount && (
        <Alert className="mb-6 border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            You need to add a bank account before you can accept offers.{" "}
            <a href="/settings/bank" className="underline font-medium">
              Add bank account
            </a>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={40} />
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📬</div>
          <h3 className="text-lg font-semibold mb-2">No incoming offers</h3>
          <p className="text-muted-foreground">
            When buyers make offers on your products, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingOffers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Pending ({pendingOffers.length})
              </h2>
              <div className="space-y-4">
                {pendingOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    role="seller"
                    onUpdate={fetchOffers}
                    hasUserBankAccount={hasBankAccount}
                    userBankAccounts={bankAccounts} // NEW
                  />
                ))}
              </div>
            </div>
          )}

          {otherOffers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                History ({otherOffers.length})
              </h2>
              <div className="space-y-4">
                {otherOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    role="seller"
                    onUpdate={fetchOffers}
                    hasUserBankAccount={hasBankAccount}
                    userBankAccounts={bankAccounts} // NEW
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
