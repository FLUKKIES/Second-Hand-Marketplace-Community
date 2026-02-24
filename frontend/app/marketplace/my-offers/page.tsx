"use client";

import { useState, useEffect, useMemo } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Offer, Address } from "@/types/marketplace";
import { OfferCard } from "@/components/marketplace/OfferCard";
import {
    Loader2,
    Package,
    ShoppingBag,
    UserCheck,
    ShoppingCart,
    Truck,
    ChevronRight,
    CheckSquare,
    Square,
    MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Navbar } from "@/components/common/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SellerGroup {
    sellerId: string;
    sellerName: string;
    sellerAvatar: string | null;
    offers: Offer[];
}

function CheckoutTimer({ expiresAt }: { expiresAt: string }) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        if (!expiresAt) return;

        const calculateTimeLeft = () => {
            const difference = new Date(expiresAt).getTime() - new Date().getTime();
            if (difference <= 0) {
                setTimeLeft("Expired");
                return;
            }

            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    if (!timeLeft) return null;

    return (
        <div className="flex flex-col items-end justify-center text-xs ml-3">
            <span className="text-gray-500 mb-0.5 whitespace-nowrap">Checkout Time Left</span>
            <span className={cn("font-mono font-medium", timeLeft === "Expired" ? "text-red-500" : "text-emerald-600")}>
                {timeLeft}
            </span>
        </div>
    );
}

export default function MyOffersPage() {
    const { user } = useAuth();
    const [myOffers, setMyOffers] = useState<Offer[]>([]);
    const [incomingOffers, setIncomingOffers] = useState<Offer[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasBankAccount, setHasBankAccount] = useState(false);
    const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");

    // Collapsible state
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        checkout: true,
        active: true,
        awaiting: true,
        completed: false,
        cancelled: false,
    });
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Multi-offer checkout state
    const [selectedOfferIds, setSelectedOfferIds] = useState<Set<string>>(new Set());
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [myAddresses, setMyAddresses] = useState<Address[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [sellerBankAccount, setSellerBankAccount] = useState<any>(null);
    const [isLoadingBank, setIsLoadingBank] = useState(false);
    const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchOffers();
        fetchMyAddresses();
    }, []);

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

    const fetchOffers = async () => {
        try {
            setIsLoading(true);
            const [sentData, receivedData] = await Promise.all([
                api.get<Offer[]>("/offers/my-offers"),
                api.get<Offer[]>("/offers/incoming"),
            ]);
            setMyOffers(sentData);
            setIncomingOffers(receivedData);
            setSelectedOfferIds(new Set());
        } catch (error) {
            console.error("Failed to fetch offers:", getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Categorize offers
    const getActive = (offers: Offer[]) => offers.filter(o => ["PENDING", "COUNTER_OFFERED"].includes(o.status));
    const getReadyToCheckout = (offers: Offer[]) => offers.filter(o => o.status === "ACCEPTED" && !o.orderId);
    const getCompleted = (offers: Offer[]) => offers.filter(o => o.status === "ACCEPTED" && o.orderId);
    const getCancelled = (offers: Offer[]) => offers.filter(o => ["REJECTED", "CANCELLED", "EXPIRED"].includes(o.status));

    // Group offers by seller/buyer
    const groupBySeller = (offers: Offer[]): SellerGroup[] => {
        const groups = new Map<string, SellerGroup>();
        for (const offer of offers) {
            const author = offer.product?.post?.author;
            if (!author) continue;
            const sellerId = author.id;
            if (!groups.has(sellerId)) {
                groups.set(sellerId, {
                    sellerId,
                    sellerName: author.username,
                    sellerAvatar: author.avatarUrl,
                    offers: [],
                });
            }
            groups.get(sellerId)!.offers.push(offer);
        }
        return Array.from(groups.values());
    };

    const groupByBuyer = (offers: Offer[]): SellerGroup[] => {
        const groups = new Map<string, SellerGroup>();
        for (const offer of offers) {
            const buyer = offer.buyer;
            if (!buyer) continue;
            const buyerId = buyer.id;
            if (!groups.has(buyerId)) {
                groups.set(buyerId, {
                    sellerId: buyerId,
                    sellerName: buyer.username,
                    sellerAvatar: buyer.avatarUrl,
                    offers: [],
                });
            }
            groups.get(buyerId)!.offers.push(offer);
        }
        return Array.from(groups.values());
    };

    // Checkout logic
    const toggleOfferSelection = (offerId: string) => {
        setSelectedOfferIds(prev => {
            const next = new Set(prev);
            if (next.has(offerId)) next.delete(offerId);
            else next.add(offerId);
            return next;
        });
    };

    const toggleAllInGroup = (offers: Offer[]) => {
        const allSelected = offers.every(o => selectedOfferIds.has(o.id));
        setSelectedOfferIds(prev => {
            const next = new Set(prev);
            for (const o of offers) {
                if (allSelected) next.delete(o.id);
                else next.add(o.id);
            }
            return next;
        });
    };

    const getSelectedSellerId = (): string | null => {
        const readyOffers = getReadyToCheckout(myOffers);
        for (const id of selectedOfferIds) {
            const offer = readyOffers.find(o => o.id === id);
            if (offer?.product?.post?.authorId) return offer.product.post.authorId;
        }
        return null;
    };

    const selectedCheckoutSummary = useMemo(() => {
        const readyOffers = getReadyToCheckout(myOffers);
        const selected = readyOffers.filter(o => selectedOfferIds.has(o.id));

        let itemsTotal = 0;
        let maxShipping = 0;

        for (const offer of selected) {
            const finalPrice = offer.counterPrice ? parseFloat(offer.counterPrice) : parseFloat(offer.offeredPrice);
            itemsTotal += finalPrice;

            const shippingCost = offer.product?.post?.shippingCost ? parseFloat(offer.product.post.shippingCost) : 0;
            if (shippingCost > maxShipping) maxShipping = shippingCost;
        }

        return { count: selected.length, itemsTotal, shippingCost: maxShipping, total: itemsTotal + maxShipping };
    }, [selectedOfferIds, myOffers]);

    const fetchSellerBank = async (sellerId: string) => {
        try {
            setIsLoadingBank(true);
            const bankAccount = await api.get<any>(`/bank-accounts/user/${sellerId}`);
            setSellerBankAccount(bankAccount);
        } catch (error) {
            console.error(error);
            toast.error("Seller hasn't set up a bank account yet.");
            setSellerBankAccount(null);
        } finally {
            setIsLoadingBank(false);
        }
    };

    const handleCheckout = async () => {
        if (selectedOfferIds.size === 0) return;
        if (!selectedAddressId) { toast.error("Shipping address required"); return; }
        if (!paymentSlipFile) { toast.error("Payment slip required"); return; }
        if (!sellerBankAccount) { toast.error("Seller has no bank account"); return; }

        const selectedAddress = myAddresses.find(a => a.id === selectedAddressId);
        if (!selectedAddress) { toast.error("Invalid shipping address selected"); return; }
        const shippingAddressString = `${selectedAddress.addressLine1} ${selectedAddress.addressLine2 ? selectedAddress.addressLine2 + ' ' : ''}${selectedAddress.subDistrict}, ${selectedAddress.district}, ${selectedAddress.province} ${selectedAddress.postalCode} ${selectedAddress.phoneNumber ? '(Phone: ' + selectedAddress.phoneNumber + ')' : ''}`.trim();

        const readyOffers = getReadyToCheckout(myOffers);
        const selected = readyOffers.filter(o => selectedOfferIds.has(o.id));
        const sellers = new Set(selected.map(o => o.product?.post?.authorId));
        if (sellers.size > 1) {
            toast.error("Please select offers from the same seller only");
            return;
        }

        try {
            setIsCheckingOut(true);
            const slipUrl = await api.uploadImage(paymentSlipFile, 'slip');
            await api.post("/orders/create-from-offers", {
                offerIds: Array.from(selectedOfferIds),
                shippingAddress: shippingAddressString,
                paymentSlipUrl: slipUrl
            });
            toast.success("Order created successfully! 🎉");
            setSelectedOfferIds(new Set());
            setPaymentSlipFile(null);
            setIsAddressModalOpen(false);
            router.push('/marketplace/orders');
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsCheckingOut(false);
        }
    };

    // ── Render helpers ──

    const renderSectionHeader = (
        key: string,
        icon: React.ReactNode,
        title: string,
        subtitle: string,
        count: number,
        bgColor: string,
    ) => (
        <button
            onClick={() => toggleSection(key)}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", bgColor)}>
                    {icon}
                </div>
                <div className="text-left">
                    <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        {title}
                        <span className="text-xs font-normal bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                            {count}
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
            </div>
            <div className="text-gray-400 transition-transform duration-200" style={{ transform: expandedSections[key] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                <ChevronRight size={20} />
            </div>
        </button>
    );

    const renderCollapsibleGroup = (
        group: SellerGroup,
        label: string,
        sectionKey: string,
        role: "buyer" | "seller",
    ) => {
        const groupKey = `${sectionKey}-${group.sellerId}`;
        const isExpanded = expandedGroups[groupKey] !== false;

        return (
            <div key={group.sellerId} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors"
                >
                    <div className="text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        <ChevronRight size={16} />
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                        {group.sellerAvatar ? (
                            <img src={group.sellerAvatar} alt={group.sellerName} className="object-cover w-full h-full" />
                        ) : (
                            group.sellerName.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="text-left flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{group.sellerName}</p>
                        <p className="text-xs text-gray-500">{label} · {group.offers.length} offer{group.offers.length > 1 ? "s" : ""}</p>
                    </div>
                </button>

                {isExpanded && (
                    <div className="px-4 pb-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        {group.offers.map(offer => (
                            <OfferCard
                                key={offer.id}
                                offer={offer}
                                role={role}
                                onUpdate={fetchOffers}
                                hideUserProfile
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderCheckoutSection = () => {
        const readyOffers = getReadyToCheckout(myOffers);
        if (readyOffers.length === 0) return null;

        const groups = groupBySeller(readyOffers);
        const selectedSellerId = getSelectedSellerId();

        return (
            <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {renderSectionHeader(
                    "checkout",
                    <ShoppingCart className="text-emerald-600" size={20} />,
                    "Ready to Checkout",
                    "Select offers to create an order",
                    readyOffers.length,
                    "bg-emerald-50",
                )}

                {expandedSections.checkout && (
                    <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="space-y-3">
                            {groups.map(group => {
                                const groupAllSelected = group.offers.every(o => selectedOfferIds.has(o.id));
                                const isDisabled = selectedSellerId !== null && selectedSellerId !== group.sellerId;

                                return (
                                    <div key={group.sellerId} className={cn(
                                        "rounded-xl border-2 transition-all overflow-hidden",
                                        isDisabled
                                            ? "border-gray-100 opacity-50"
                                            : selectedOfferIds.size > 0 && !isDisabled
                                                ? "border-emerald-200 shadow-sm shadow-emerald-100"
                                                : "border-gray-100"
                                    )}>
                                        {/* Group header with select all */}
                                        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                                            <button
                                                onClick={() => !isDisabled && toggleAllInGroup(group.offers)}
                                                disabled={isDisabled}
                                                className="text-gray-400 hover:text-emerald-600 transition-colors disabled:cursor-not-allowed"
                                            >
                                                {groupAllSelected && !isDisabled ? (
                                                    <CheckSquare size={20} className="text-emerald-600" />
                                                ) : (
                                                    <Square size={20} />
                                                )}
                                            </button>
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                {group.sellerAvatar ? (
                                                    <img src={group.sellerAvatar} alt={group.sellerName} className="object-cover w-full h-full" />
                                                ) : (
                                                    group.sellerName.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 text-sm">{group.sellerName}</p>
                                                <p className="text-xs text-gray-500">{group.offers.length} item{group.offers.length > 1 ? "s" : ""} ready</p>
                                            </div>
                                            {group.offers[0]?.product?.post?.shippingCost && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                                    <Truck size={12} />
                                                    <span>
                                                        {parseFloat(group.offers[0].product.post.shippingCost) === 0
                                                            ? "Free"
                                                            : `฿${parseFloat(group.offers[0].product.post.shippingCost).toLocaleString()}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Offer items with checkboxes */}
                                        <div className="divide-y divide-gray-50">
                                            {group.offers.map(offer => (
                                                <div key={offer.id} className="flex items-start gap-3 p-4 hover:bg-gray-50/50 transition-colors">
                                                    <button
                                                        onClick={() => !isDisabled && toggleOfferSelection(offer.id)}
                                                        disabled={isDisabled}
                                                        className="mt-1 text-gray-400 hover:text-emerald-600 transition-colors disabled:cursor-not-allowed"
                                                    >
                                                        {selectedOfferIds.has(offer.id) ? (
                                                            <CheckSquare size={18} className="text-emerald-600" />
                                                        ) : (
                                                            <Square size={18} />
                                                        )}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3">
                                                            {offer.product.imageUrl && (
                                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                                    <img src={api.getImageUrl(offer.product.imageUrl)} alt={offer.product.name} className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 text-sm truncate">{offer.product.name}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-xs text-gray-500">Listed: ฿{parseFloat(offer.product.price).toLocaleString()}</span>
                                                                    <span className="text-xs text-gray-300">→</span>
                                                                    <span className="text-sm font-semibold text-emerald-600">
                                                                        ฿{(offer.counterPrice ? parseFloat(offer.counterPrice) : parseFloat(offer.offeredPrice)).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {offer.expiresAt && (
                                                                <CheckoutTimer expiresAt={offer.expiresAt} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Floating Checkout Bar */}
                        {selectedOfferIds.size > 0 && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold text-emerald-700">{selectedCheckoutSummary.count}</span> item{selectedCheckoutSummary.count > 1 ? "s" : ""} selected
                                        </p>
                                        <div className="text-xs text-gray-500 space-y-0.5">
                                            <p>Items: ฿{selectedCheckoutSummary.itemsTotal.toLocaleString()}</p>
                                            <p className="flex items-center gap-1">
                                                <Truck size={10} />
                                                Shipping: {selectedCheckoutSummary.shippingCost === 0 ? "Free" : `฿${selectedCheckoutSummary.shippingCost.toLocaleString()}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Total</p>
                                        <p className="text-xl font-bold text-emerald-700">
                                            ฿{selectedCheckoutSummary.total.toLocaleString()}
                                        </p>
                                        <Button
                                            onClick={() => {
                                                const sellerId = getSelectedSellerId();
                                                if (sellerId) fetchSellerBank(sellerId);
                                                setIsAddressModalOpen(true);
                                            }}
                                            disabled={isCheckingOut}
                                            className="mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-6 shadow-lg shadow-emerald-200"
                                        >
                                            {isCheckingOut ? (
                                                <Loader2 className="animate-spin mr-2" size={16} />
                                            ) : (
                                                <ShoppingCart size={16} className="mr-2" />
                                            )}
                                            Checkout
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>
        );
    };

    const renderSentTab = () => {
        const active = getActive(myOffers);
        const completed = getCompleted(myOffers);
        const cancelled = getCancelled(myOffers);
        const activeGroups = groupBySeller(active);
        const completedGroups = groupBySeller(completed);

        return (
            <div className="space-y-4">
                {/* Ready to Checkout Section */}
                {renderCheckoutSection()}

                {/* Active Section */}
                <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {renderSectionHeader(
                        "active",
                        <UserCheck className="text-indigo-600" size={20} />,
                        "Active Offers",
                        "Offers currently in negotiation",
                        active.length,
                        "bg-indigo-50",
                    )}
                    {expandedSections.active && (
                        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            {activeGroups.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No active offers</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeGroups.map(group => renderCollapsibleGroup(group, "Seller", "sent-active", "buyer"))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Completed Section */}
                <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {renderSectionHeader(
                        "completed",
                        <ShoppingBag className="text-green-600" size={20} />,
                        "Completed Offers",
                        "Offers with orders created",
                        completed.length,
                        "bg-green-50",
                    )}
                    {expandedSections.completed && (
                        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            {completedGroups.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No completed offers</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {completedGroups.map(group => renderCollapsibleGroup(group, "Seller", "sent-completed", "buyer"))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Cancelled Section */}
                <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {renderSectionHeader(
                        "cancelled",
                        <Package className="text-gray-500" size={20} />,
                        "Cancelled / Rejected",
                        "Offers that didn't go through",
                        cancelled.length,
                        "bg-gray-100",
                    )}
                    {expandedSections.cancelled && (
                        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            {cancelled.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No cancelled offers</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 opacity-75 hover:opacity-100 transition-opacity">
                                    {cancelled.map(offer => (
                                        <OfferCard key={offer.id} offer={offer} role="buyer" onUpdate={fetchOffers} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        );
    };

    const renderReceivedTab = () => {
        const active = getActive(incomingOffers);
        const readyToShip = getReadyToCheckout(incomingOffers);
        const completed = getCompleted(incomingOffers);
        const cancelled = getCancelled(incomingOffers);
        const activeGroups = groupByBuyer(active);
        const readyGroups = groupByBuyer(readyToShip);
        const completedGroups = groupByBuyer(completed);

        return (
            <div className="space-y-4">
                {/* Active Section */}
                <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {renderSectionHeader(
                        "active",
                        <Package className="text-indigo-600" size={20} />,
                        "Active Offers",
                        "Offers pending your response",
                        active.length,
                        "bg-indigo-50",
                    )}
                    {expandedSections.active && (
                        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            {activeGroups.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No active offers</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeGroups.map(group => renderCollapsibleGroup(group, "Buyer", "recv-active", "seller"))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Accepted - Awaiting Buyer Checkout */}
                {readyGroups.length > 0 && (
                    <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        {renderSectionHeader(
                            "awaiting",
                            <ShoppingCart className="text-emerald-600" size={20} />,
                            "Accepted - Awaiting Checkout",
                            "Buyer needs to create order",
                            readyToShip.length,
                            "bg-emerald-50",
                        )}
                        {expandedSections.awaiting && (
                            <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="space-y-3">
                                    {readyGroups.map(group => renderCollapsibleGroup(group, "Buyer", "recv-awaiting", "seller"))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Completed Section */}
                <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {renderSectionHeader(
                        "completed",
                        <ShoppingBag className="text-green-600" size={20} />,
                        "Completed Offers",
                        "Offers with orders created",
                        completed.length,
                        "bg-green-50",
                    )}
                    {expandedSections.completed && (
                        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            {completedGroups.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No completed offers</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {completedGroups.map(group => renderCollapsibleGroup(group, "Buyer", "recv-completed", "seller"))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Cancelled Section */}
                <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {renderSectionHeader(
                        "cancelled",
                        <Package className="text-gray-500" size={20} />,
                        "Cancelled / Rejected",
                        "Offers that didn't go through",
                        cancelled.length,
                        "bg-gray-100",
                    )}
                    {expandedSections.cancelled && (
                        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            {cancelled.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No cancelled offers</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 opacity-75 hover:opacity-100 transition-opacity">
                                    {cancelled.map(offer => (
                                        <OfferCard key={offer.id} offer={offer} role="seller" onUpdate={fetchOffers} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        );
    };

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
                        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95 rounded-t-xl">
                            <div className="px-6 pt-6 pb-0">
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">My Offers</h1>
                                    <p className="text-gray-500 text-sm">Manage your sent and received offers</p>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setActiveTab("sent")}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2",
                                            activeTab === "sent"
                                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        <ShoppingBag size={18} />
                                        <span>Sent (Buying)</span>
                                        {(getActive(myOffers).length + getReadyToCheckout(myOffers).length) > 0 && (
                                            <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full ml-1">
                                                {getActive(myOffers).length + getReadyToCheckout(myOffers).length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("received")}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2",
                                            activeTab === "received"
                                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        <Package size={18} />
                                        <span>Received (Selling)</span>
                                        {getActive(incomingOffers).length > 0 && (
                                            <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full ml-1">
                                                {getActive(incomingOffers).length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 bg-gray-50/50 min-h-full">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-primary" size={40} />
                                </div>
                            ) : activeTab === "sent" ? (
                                renderSentTab()
                            ) : (
                                renderReceivedTab()
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Address Selection Dialog */}
            <Dialog open={isAddressModalOpen} onOpenChange={(open) => {
                setIsAddressModalOpen(open);
                if (!open) { setPaymentSlipFile(null); setSellerBankAccount(null); }
            }}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Complete Checkout</DialogTitle>
                        <DialogDescription>
                            Please provide your shipping address and upload a payment slip to complete the order.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                                    <Button variant="outline" className="w-full mt-2" onClick={() => { setIsAddressModalOpen(false); router.push("/settings/address"); }}>
                                        Manage Addresses
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-200 text-center space-y-3">
                                    <p>You haven't added any shipping address yet.</p>
                                    <Button onClick={() => { setIsAddressModalOpen(false); router.push("/settings/address"); }}>
                                        Add Address
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                            <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Order Summary</h3>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal ({selectedCheckoutSummary.count} items)</span>
                                <span>฿{selectedCheckoutSummary.itemsTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Shipping Fee</span>
                                <span>{selectedCheckoutSummary.shippingCost === 0 ? "Free" : `฿${selectedCheckoutSummary.shippingCost.toLocaleString()}`}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 text-base">
                                <span>Total Payment</span>
                                <span className="text-indigo-600">฿{selectedCheckoutSummary.total.toLocaleString()}</span>
                            </div>
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
                        <Button variant="outline" onClick={() => setIsAddressModalOpen(false)} disabled={isCheckingOut}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCheckout}
                            disabled={isCheckingOut || !selectedAddressId || !paymentSlipFile || !sellerBankAccount}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
