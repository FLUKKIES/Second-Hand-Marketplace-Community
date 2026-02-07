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

  // Helper to filter active orders
  const getActiveOrders = (orders: Order[]) =>
    orders.filter((o) => ["TO_PAY", "TO_SHIP", "TO_RECEIVE"].includes(o.status));

  // Helper to filter history orders
  const getHistoryOrders = (orders: Order[]) =>
    orders.filter((o) => ["COMPLETED", "CANCELLED"].includes(o.status));

  const activeBuyingOrders = getActiveOrders(buyingOrders);
  const historyBuyingOrders = getHistoryOrders(buyingOrders);
  const activeSellingOrders = getActiveOrders(sellingOrders);
  const historySellingOrders = getHistoryOrders(sellingOrders);

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
                    {activeBuyingOrders.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full ml-1">
                        {activeBuyingOrders.length}
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
                    {activeSellingOrders.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full ml-1">
                        {activeSellingOrders.length}
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
                <div className="space-y-8">
                  {/* Active Section */}
                  <section>
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                      <div className="bg-indigo-50 p-2 rounded-lg">
                        <UserCheck className="text-indigo-600" size={20} />
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900 text-lg">
                          Active Orders
                        </h2>
                        <p className="text-sm text-gray-500">
                          Orders in progress
                        </p>
                      </div>
                    </div>

                    {activeBuyingOrders.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">
                          No active orders
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {activeBuyingOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            role="buyer"
                            onUpdate={fetchOrders}
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
                          Order History
                        </h2>
                        <p className="text-sm text-gray-500">
                          Past orders (Completed, Cancelled)
                        </p>
                      </div>
                    </div>

                    {historyBuyingOrders.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">
                          No order history
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
                        {historyBuyingOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            role="buyer"
                            onUpdate={fetchOrders}
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
                          Active Sales
                        </h2>
                        <p className="text-sm text-gray-500">
                          Sales requiring your attention
                        </p>
                      </div>
                    </div>

                    {activeSellingOrders.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">
                          No active sales
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {activeSellingOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            role="seller"
                            onUpdate={fetchOrders}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* History Section */}
                  <section>
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4 mt-8">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <Store className="text-gray-600" size={20} />
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900 text-lg">
                          Sales History
                        </h2>
                        <p className="text-sm text-gray-500">
                          Past sales (Completed, Cancelled)
                        </p>
                      </div>
                    </div>

                    {historySellingOrders.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">
                          No sales history
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
                        {historySellingOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            role="seller"
                            onUpdate={fetchOrders}
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
