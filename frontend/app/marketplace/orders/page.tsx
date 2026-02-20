"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Order } from "@/types/marketplace";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Store, UserCheck, Package, ChevronDown, ChevronRight } from "lucide-react";
import { OrderCard } from "@/components/marketplace/OrderCard";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface UserGroup {
  userId: string;
  username: string;
  avatarUrl: string | null;
  orders: Order[];
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");
  const [buyingOrders, setBuyingOrders] = useState<Order[]>([]);
  const [sellingOrders, setSellingOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    active: true,
    completed: false,
    cancelled: false,
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (searchParams.get("tab") === "selling") {
      setActiveTab("selling");
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const [buying, selling] = await Promise.all([
        api.get<Order[]>("/orders/buying"),
        api.get<Order[]>("/orders/selling"),
      ]);
      setBuyingOrders(Array.isArray(buying) ? buying : []);
      setSellingOrders(Array.isArray(selling) ? selling : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper functions
  const getActive = (orders: Order[]) => orders.filter((o) => ["TO_PAY", "TO_SHIP", "TO_RECEIVE"].includes(o.status));
  const getCompleted = (orders: Order[]) => orders.filter((o) => o.status === "COMPLETED");
  const getCancelled = (orders: Order[]) => orders.filter((o) => ["CANCELLED", "REFUNDED", "RETURNED"].includes(o.status));

  // Group orders by the other party
  const groupOrders = (orders: Order[], role: "buyer" | "seller"): UserGroup[] => {
    const groups = new Map<string, UserGroup>();
    for (const order of orders) {
      const otherParty = role === "buyer" ? order.seller : order.buyer;
      if (!otherParty) continue;
      const id = otherParty.id;
      if (!groups.has(id)) {
        groups.set(id, { userId: id, username: otherParty.username, avatarUrl: otherParty.avatarUrl, orders: [] });
      }
      groups.get(id)!.orders.push(order);
    }
    return Array.from(groups.values());
  };

  const renderGroupedOrders = (orders: Order[], role: "buyer" | "seller", sectionKey: string) => {
    const groups = groupOrders(orders, role);
    const label = role === "buyer" ? "Seller" : "Buyer";

    if (groups.length === 0) return null;

    return (
      <div className="space-y-3">
        {groups.map(group => {
          const groupKey = `${sectionKey}-${group.userId}`;
          const isExpanded = expandedGroups[groupKey] !== false; // default open

          return (
            <div key={group.userId} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
              {/* Group Header - Clickable */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors"
              >
                <div className="text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <ChevronRight size={16} />
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                  {group.avatarUrl ? (
                    <img src={group.avatarUrl} alt={group.username} className="object-cover w-full h-full" />
                  ) : (
                    group.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{group.username}</p>
                  <p className="text-xs text-gray-500">{label} · {group.orders.length} order{group.orders.length > 1 ? "s" : ""}</p>
                </div>
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {group.orders.map(order => (
                    <OrderCard key={order.id} order={order} role={role} onUpdate={fetchOrders} hideUserProfile />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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

  const renderOrderList = (orders: Order[], role: "buyer" | "seller") => {
    const active = getActive(orders);
    const completed = getCompleted(orders);
    const cancelled = getCancelled(orders);

    return (
      <div className="space-y-4">
        {/* Active Section */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {renderSectionHeader(
            "active",
            role === 'buyer' ? <UserCheck className="text-indigo-600" size={20} /> : <Package className="text-indigo-600" size={20} />,
            `Active ${role === 'buyer' ? 'Orders' : 'Sales'}`,
            role === 'buyer' ? 'Orders in progress' : 'Sales requiring your attention',
            active.length,
            "bg-indigo-50",
          )}
          {expandedSections.active && (
            <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {active.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">No active {role === 'buyer' ? 'orders' : 'sales'}</p>
                </div>
              ) : (
                renderGroupedOrders(active, role, "active")
              )}
            </div>
          )}
        </section>

        {/* Completed Section */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {renderSectionHeader(
            "completed",
            role === 'buyer' ? <ShoppingBag className="text-green-600" size={20} /> : <Store className="text-green-600" size={20} />,
            `Completed ${role === 'buyer' ? 'Orders' : 'Sales'}`,
            `Successfully completed ${role === 'buyer' ? 'orders' : 'sales'}`,
            completed.length,
            "bg-green-50",
          )}
          {expandedSections.completed && (
            <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {completed.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">No completed {role === 'buyer' ? 'orders' : 'sales'}</p>
                </div>
              ) : (
                renderGroupedOrders(completed, role, "completed")
              )}
            </div>
          )}
        </section>

        {/* Cancelled Section */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {renderSectionHeader(
            "cancelled",
            <Package className="text-gray-500" size={20} />,
            "Cancelled / Refunded",
            "Orders that were cancelled or returned",
            cancelled.length,
            "bg-gray-100",
          )}
          {expandedSections.cancelled && (
            <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {cancelled.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">No cancelled orders</p>
                </div>
              ) : (
                <div className="opacity-75 hover:opacity-100 transition-opacity">
                  {renderGroupedOrders(cancelled, role, "cancelled")}
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
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">My Orders</h1>
                  <p className="text-gray-500 text-sm">Manage your purchases and sales</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab("buying")}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2",
                      activeTab === "buying"
                        ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <ShoppingBag size={18} />
                    <span>My Purchases</span>
                    {getActive(buyingOrders).length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full ml-1">
                        {getActive(buyingOrders).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("selling")}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2",
                      activeTab === "selling"
                        ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Store size={18} />
                    <span>My Sales</span>
                    {getActive(sellingOrders).length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full ml-1">
                        {getActive(sellingOrders).length}
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
              ) : activeTab === "buying" ? (
                renderOrderList(buyingOrders, "buyer")
              ) : (
                renderOrderList(sellingOrders, "seller")
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main page component wrapped in Suspense
import { Suspense } from "react";

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50/50">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
