"use client";

import { Suspense, useEffect, useState } from "react";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Order } from "@/types/marketplace";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Store } from "lucide-react";
import { OrderCard } from "@/components/marketplace/OrderCard";

import { useSearchParams } from "next/navigation";

function OrdersContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");

  useEffect(() => {
    if (searchParams.get("tab") === "selling") {
      setActiveTab("selling");
    }
  }, [searchParams]);

  const [buyingOrders, setBuyingOrders] = useState<Order[]>([]);
  const [sellingOrders, setSellingOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const [buying, selling] = await Promise.all([
        api.get("/orders/buying"),
        api.get("/orders/selling"),
      ]);

      // Ensure we have arrays
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

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-20 scrollbar-hide">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">
          My Orders
        </h1>
      </div>

      <Tabs
        defaultValue="buying"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <TabsTrigger
            value="buying"
            className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex items-center gap-2"
          >
            <ShoppingBag size={16} />
            My Purchases
          </TabsTrigger>
          <TabsTrigger
            value="selling"
            className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex items-center gap-2"
          >
            <Store size={16} />
            My Sales
          </TabsTrigger>
        </TabsList>

        {/* BUYING TAB */}
        <TabsContent
          value="buying"
          className="space-y-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : buyingOrders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
              <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="text-muted-foreground/40" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No orders found
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                You haven't purchased anything yet.
              </p>
            </div>
          ) : (
            buyingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                role="buyer"
                onUpdate={fetchOrders}
              />
            ))
          )}
        </TabsContent>

        {/* SELLING TAB */}
        <TabsContent
          value="selling"
          className="space-y-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sellingOrders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
              <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="text-muted-foreground/40" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No sales found
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                You haven't sold anything yet.
              </p>
            </div>
          ) : (
            sellingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                role="seller"
                onUpdate={fetchOrders}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
      <Navbar />

      <main className="flex-1 container pt-4 px-2 md:px-2 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 align-start h-full">
          {/* Left Sidebar */}
          <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
            <LeftSidebar />
          </aside>

          {/* Main Content */}
          <div className="md:col-span-9 lg:col-span-9 h-full">
            <Suspense
              fallback={
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <OrdersContent />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
