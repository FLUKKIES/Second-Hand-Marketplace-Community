"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Order } from "@/types/marketplace";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Store, UserCheck, Package } from "lucide-react";
import { OrderCard } from "@/components/marketplace/OrderCard";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Internal component containing the logic that uses useSearchParams
function OrdersContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");
  const [buyingOrders, setBuyingOrders] = useState<Order[]>([]);
  const [sellingOrders, setSellingOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchOrders();
  }, []);

  // Helper functions
  const getActive = (orders: Order[]) => orders.filter((o) => ["TO_PAY", "TO_SHIP", "TO_RECEIVE"].includes(o.status));
  const getCompleted = (orders: Order[]) => orders.filter((o) => o.status === "COMPLETED");
  const getCancelled = (orders: Order[]) => orders.filter((o) => ["CANCELLED", "REFUNDED", "RETURNED"].includes(o.status));

  const [showCancelled, setShowCancelled] = useState(false);

  const renderOrderList = (orders: Order[], role: "buyer" | "seller") => {
    const active = getActive(orders);
    const completed = getCompleted(orders);
    const cancelled = getCancelled(orders);

    return (
      <div className="space-y-8">
        {/* Active Section */}
        <section>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
            <div className="bg-indigo-50 p-2 rounded-lg">
              {role === 'buyer' ? <UserCheck className="text-indigo-600" size={20} /> : <Package className="text-indigo-600" size={20} />}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Active {role === 'buyer' ? 'Orders' : 'Sales'}</h2>
              <p className="text-sm text-gray-500">{role === 'buyer' ? 'Orders in progress' : 'Sales requiring your attention'}</p>
            </div>
          </div>

          {active.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">No active {role === 'buyer' ? 'orders' : 'sales'}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {active.map(order => (
                <OrderCard key={order.id} order={order} role={role} onUpdate={fetchOrders} />
              ))}
            </div>
          )}
        </section>

        {/* Completed Section */}
        <section>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4 mt-8">
            <div className="bg-green-50 p-2 rounded-lg">
              {role === 'buyer' ? <ShoppingBag className="text-green-600" size={20} /> : <Store className="text-green-600" size={20} />}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Completed {role === 'buyer' ? 'Orders' : 'Sales'}</h2>
              <p className="text-sm text-gray-500">Successfully completed {role === 'buyer' ? 'orders' : 'sales'}</p>
            </div>
          </div>

          {completed.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">No completed {role === 'buyer' ? 'orders' : 'sales'}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {completed.map(order => (
                <OrderCard key={order.id} order={order} role={role} onUpdate={fetchOrders} />
              ))}
            </div>
          )}
        </section>

        {/* Cancelled Section (Collapsible) */}
        <section>
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className="w-full flex items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-4 mt-8 group hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-gray-200 transition-colors">
                <Package className="text-gray-600" size={20} />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  Cancelled / Refunded
                  <span className="text-xs font-normal bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                    {cancelled.length}
                  </span>
                </h2>
                <p className="text-sm text-gray-500">Orders that were cancelled or returned</p>
              </div>
            </div>
            <div className={`text-gray-400 transition-transform duration-300 ${showCancelled ? "rotate-180" : ""}`}>
              ▼
            </div>
          </button>

          {showCancelled && (
            cancelled.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2">
                <p className="text-gray-500 text-sm">No cancelled orders</p>
              </div>
            ) : (
              <div className="grid gap-4 opacity-75 hover:opacity-100 transition-opacity animate-in fade-in slide-in-from-top-2">
                {cancelled.map(order => (
                  <OrderCard key={order.id} order={order} role={role} onUpdate={fetchOrders} />
                ))}
              </div>
            )
          )}
        </section>
      </div>
    );
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
                    My Orders
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Manage your purchases and sales
                  </p>
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
            <div className="p-6 bg-white min-h-full">
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
