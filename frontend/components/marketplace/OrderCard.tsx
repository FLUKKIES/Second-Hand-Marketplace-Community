import { Order } from "@/types/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Package, Truck, CheckCircle, XCircle } from "lucide-react";

interface OrderCardProps {
    order: Order;
    role: "buyer" | "seller";
    onUpdate: () => void;
}

export function OrderCard({ order, role, onUpdate }: OrderCardProps) {
    const isBuyer = role === "buyer";
    const otherParty = isBuyer ? order.seller : order.buyer;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "TO_PAY": return "bg-yellow-100 text-yellow-800";
            case "TO_SHIP": return "bg-blue-100 text-blue-800";
            case "TO_RECEIVE": return "bg-purple-100 text-purple-800";
            case "COMPLETED": return "bg-green-100 text-green-800";
            case "CANCELLED": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Card className="p-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                            {isBuyer ? "Seller" : "Buyer"}: {otherParty?.username || "Unknown"}
                        </span>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status.replace("_", " ")}
                        </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                        Order ID: {order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div className="text-right">
                    <p className="font-bold text-indigo-600">{formatCurrency(Number(order.totalPrice))}</p>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                        <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                            {item.product.imageUrl && (
                                <img
                                    src={api.getImageUrl(item.product.imageUrl)}
                                    alt={item.product.name}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-gray-500">x{item.quantity}</p>
                            <p className="text-xs font-semibold text-gray-700">{formatCurrency(Number(item.price))}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                {/* Actions Placeholder - simplified for now since logic is complex */}
                <Link href={`/marketplace/orders/${order.id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full">
                        View Details
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
