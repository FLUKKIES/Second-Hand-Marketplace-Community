"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, MapPin, CreditCard, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";

interface SettingsLayoutProps {
    children: React.ReactNode;
}

const sidebarItems = [
    {
        title: "Account",
        href: "/settings/account",
        icon: User,
        description: "Profile details & personal info"
    },
    {
        title: "Address",
        href: "/settings/address",
        icon: MapPin,
        description: "Shipping & delivery addresses"
    },
    {
        title: "Bank Account",
        href: "/settings/bank",
        icon: CreditCard,
        description: "Payment methods & payouts"
    }
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Content Area */}
                <div className="mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-500">Manage your account preferences and settings.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Settings Sidebar */}
                        <div className="lg:col-span-3 space-y-2">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                
                                return (
                                    <Link 
                                        key={item.href} 
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border",
                                            isActive 
                                                ? "bg-white border-primary/20 text-primary shadow-sm" 
                                                : "bg-transparent border-transparent text-gray-600 hover:bg-white hover:border-gray-100 hover:shadow-sm"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                            isActive ? "bg-primary/10" : "bg-gray-100"
                                        )}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm">{item.title}</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Settings Content */}
                        <div className="lg:col-span-9">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
