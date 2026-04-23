"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotification } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { NotificationType } from "@/types";

export function NotificationDropdown() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
    const router = useRouter();

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        // Navigate based on type
        switch (notification.type) {
            case NotificationType.OFFER_RECEIVED:
            case NotificationType.OFFER_ACCEPTED:
            case NotificationType.OFFER_REJECTED:
                if (notification.data?.offerId) {
                   // Navigate to specific offer (Assuming we have a page or just to offers list)
                   // For now, go to my-offers
                   router.push('/marketplace/my-offers');
                }
                break;
            case NotificationType.ORDER_CREATED:
            case NotificationType.ORDER_PAID:
            case NotificationType.ORDER_SHIPPED:
            case NotificationType.ORDER_COMPLETED:
            case NotificationType.ORDER_CANCELLED:
                 if (notification.data?.orderId) {
                    router.push('/marketplace/orders');
                 }
                break;
            default:
                break;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full relative group">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-background animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto px-2 text-xs text-primary hover:text-primary/80"
                            onClick={() => markAllAsRead()}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-muted/50 border-b last:border-0",
                                    !notification.isRead && "bg-muted/20"
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start justify-between w-full gap-2">
                                    <span className={cn("font-medium text-sm", !notification.isRead && "text-foreground")}>
                                        {notification.title}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </p>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
