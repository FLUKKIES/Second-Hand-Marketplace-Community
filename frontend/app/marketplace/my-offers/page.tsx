"use client";

import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Offer } from "@/types/marketplace";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { Loader2, Package, ShoppingBag, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Navbar } from "@/components/common/Navbar";

export default function MyOffersPage() {
    const { user } = useAuth();
    const [myOffers, setMyOffers] = useState<Offer[]>([]);
    const [incomingOffers, setIncomingOffers] = useState<Offer[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]); // NEW: Store accounts
    const [isLoading, setIsLoading] = useState(true);
    const [hasBankAccount, setHasBankAccount] = useState(false);
    const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            setIsLoading(true);
            const [sentData, receivedData, bankAccounts] = await Promise.all([
                api.get<Offer[]>("/offers/my-offers"),
                api.get<Offer[]>("/offers/incoming"),
                api.get<any[]>("/bank-accounts/me"),
            ]);
            setMyOffers(sentData);
            setIncomingOffers(receivedData);
            setBankAccounts(Array.isArray(bankAccounts) ? bankAccounts : []); // Set state
            setHasBankAccount(Array.isArray(bankAccounts) && bankAccounts.length > 0);
        } catch (error) {
            console.error("Failed to fetch offers:", getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
            {/* Top Navbar */}
            <Navbar />

            {/* Main Layout */}
            <main className="flex-1 pt-4 px-2 md:px-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 align-start h-full">
                    {/* Left Sidebar */}
                    <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
                        <LeftSidebar />
                    </aside>

                    {/* Main Content */}
                    <div className="md:col-span-9 lg:col-span-9 flex flex-col h-full overflow-y-auto pb-20 scrollbar-hide rounded-tl-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95 rounded-t-xl">
                            <div className="px-6 pt-6 pb-0">
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                        My Offers
                                    </h1>
                                    <p className="text-gray-500 text-sm">
                                        Manage your sent and received offers
                                    </p>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setActiveTab("sent")}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2 ${activeTab === "sent"
                                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        <ShoppingBag size={18} />
                                        <span>Sent (Buying)</span>
                                        {myOffers.filter((o: Offer) =>
                                            ["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                        ).length > 0 && (
                                                <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full ml-1">
                                                    {
                                                        myOffers.filter((o: Offer) =>
                                                            ["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                                        ).length
                                                    }
                                                </span>
                                            )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("received")}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2 ${activeTab === "received"
                                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        <Package size={18} />
                                        <span>Received (Selling)</span>
                                        {incomingOffers.filter((o: Offer) =>
                                            ["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                        ).length > 0 && (
                                                <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full ml-1">
                                                    {
                                                        incomingOffers.filter((o: Offer) =>
                                                            ["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                                        ).length
                                                    }
                                                </span>
                                            )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 bg-white min-h-full">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-primary" size={40} />
                                </div>
                            ) : activeTab === "sent" ? (
                                <div className="space-y-8">
                                    {/* Active Section */}
                                    <section>
                                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                                            <div className="bg-indigo-50 p-2 rounded-lg">
                                                <UserCheck className="text-indigo-600" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-gray-900 text-lg">
                                                    Active Offers
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    Offers you are currently negotiating
                                                </p>
                                            </div>
                                        </div>

                                        {myOffers.filter((o: Offer) =>
                                            ["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                        ).length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <p className="text-gray-500 text-sm">
                                                    No active offers
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {myOffers
                                                    .filter((o: Offer) =>
                                                        ["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                                    )
                                                    .map((offer: Offer) => (
                                                        <OfferCard
                                                            key={offer.id}
                                                            offer={offer}
                                                            role="buyer"
                                                            onUpdate={fetchOffers}
                                                            hasUserBankAccount={hasBankAccount}
                                                        />
                                                    ))}
                                            </div>
                                        )}
                                    </section>

                                    {/* History Section */}
                                    <section>
                                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4 mt-8">
                                            <div className="bg-gray-100 p-2 rounded-lg">
                                                <ShoppingBag className="text-gray-600" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-gray-900 text-lg">
                                                    Offer History
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    Past offers (Accepted, Rejected, Expired)
                                                </p>
                                            </div>
                                        </div>

                                        {myOffers.filter(
                                            (o: Offer) =>
                                                !["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                        ).length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <p className="text-gray-500 text-sm">
                                                    No offer history
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
                                                {myOffers
                                                    .filter(
                                                        (o: Offer) =>
                                                            !["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                                    )
                                                    .map((offer: Offer) => (
                                                        <OfferCard
                                                            key={offer.id}
                                                            offer={offer}
                                                            role="buyer"
                                                            onUpdate={fetchOffers}
                                                            hasUserBankAccount={hasBankAccount}
                                                        />
                                                    ))}
                                            </div>
                                        )}
                                    </section>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Active Section */}
                                    <section>
                                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                                            <div className="bg-indigo-50 p-2 rounded-lg">
                                                <Package className="text-indigo-600" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-gray-900 text-lg">
                                                    Active Offers
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    Offers requiring your attention
                                                </p>
                                            </div>
                                        </div>

                                        {incomingOffers.filter((o: Offer) =>
                                            ["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                        ).length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <p className="text-gray-500 text-sm">
                                                    No active offers
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {incomingOffers
                                                    .filter((o: Offer) =>
                                                        ["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                                    )
                                                    .map((offer: Offer) => (
                                                        <OfferCard
                                                            key={offer.id}
                                                            offer={offer}
                                                            role="seller"
                                                            onUpdate={fetchOffers}
                                                            hasUserBankAccount={hasBankAccount}
                                                        />
                                                    ))}
                                            </div>
                                        )}
                                    </section>

                                    {/* History Section */}
                                    <section>
                                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4 mt-8">
                                            <div className="bg-gray-100 p-2 rounded-lg">
                                                <Package className="text-gray-600" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-gray-900 text-lg">
                                                    Offer History
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    Past offers (Accepted, Rejected, Expired)
                                                </p>
                                            </div>
                                        </div>

                                        {incomingOffers.filter(
                                            (o: Offer) =>
                                                !["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                        ).length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <p className="text-gray-500 text-sm">
                                                    No offer history
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
                                                {incomingOffers
                                                    .filter(
                                                        (o: Offer) =>
                                                            !["PENDING", "COUNTER_OFFERED"].includes(o.status)
                                                    )
                                                    .map((offer: Offer) => (
                                                        <OfferCard
                                                            key={offer.id}
                                                            offer={offer}
                                                            role="seller"
                                                            onUpdate={fetchOffers}
                                                            hasUserBankAccount={hasBankAccount}
                                                        />
                                                    ))}
                                            </div>
                                        )}
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
