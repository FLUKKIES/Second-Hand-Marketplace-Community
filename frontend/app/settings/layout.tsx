"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { User, MapPin, CreditCard, ChevronLeft } from "lucide-react";

interface SettingsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname();

    const sidebarItems = [
        {
            title: "Account",
            href: "/settings/account",
            icon: <User size={18} />,
        },
        {
            title: "Address",
            href: "/settings/address",
            icon: <MapPin size={18} />,
        },
        {
            title: "Bank Accounts",
            href: "/settings/bank",
            icon: <CreditCard size={18} />,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Simple Navbar */}
            <nav className="bg-white border-b border-gray-200 px-4 py-3 mb-6 sticky top-0 z-50">
                <div className="container max-w-5xl mx-auto">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                        <ChevronLeft className="mr-1 h-5 w-5" />
                        Back to Home
                    </Link>
                </div>
            </nav>

            <div className="container max-w-5xl mx-auto pb-12 px-4">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>
                
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 space-y-2">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    pathname === item.href
                                        ? "bg-primary text-primary-foreground"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                )}
                            >
                                {item.icon}
                                {item.title}
                            </Link>
                        ))}
                    </aside>

                    {/* Content */}
                    <div className="flex-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
