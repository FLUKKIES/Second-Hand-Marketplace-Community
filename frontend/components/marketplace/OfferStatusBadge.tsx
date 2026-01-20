import { cn } from "@/lib/utils";

type OfferStatus = 'PENDING' | 'COUNTER_OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

interface OfferStatusBadgeProps {
    status: OfferStatus;
    className?: string;
}

const statusConfig = {
    PENDING: {
        label: 'Pending',
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        icon: '⏳'
    },
    COUNTER_OFFERED: {
        label: 'Counter Offer',
        className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        icon: '💬'
    },
    ACCEPTED: {
        label: 'Accepted',
        className: 'bg-green-500/10 text-green-600 border-green-500/20',
        icon: '✓'
    },
    REJECTED: {
        label: 'Rejected',
        className: 'bg-red-500/10 text-red-600 border-red-500/20',
        icon: '✕'
    },
    EXPIRED: {
        label: 'Expired',
        className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        icon: '⌛'
    },
    CANCELLED: {
        label: 'Cancelled',
        className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        icon: '⊗'
    }
};

export function OfferStatusBadge({ status, className }: OfferStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.PENDING;

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all",
            config.className,
            className
        )}>
            <span className="text-sm">{config.icon}</span>
            {config.label}
        </div>
    );
}
