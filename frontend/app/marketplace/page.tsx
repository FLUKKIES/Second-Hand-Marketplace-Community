"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { api } from "@/lib/api";
import { ShoppingBag, Star, LayoutGrid } from "lucide-react";

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    _count?: {
        groups: number;
    }
}

export default function MarketplacePage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categories = await api.get<Category[]>('/categories');
                setCategories(categories);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
            <Navbar />

            <main className="flex-1 container pt-4 px-2 md:px-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 align-start h-full">
                    
                    {/* Left Sidebar */}
                    <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
                        <LeftSidebar />
                    </aside>

                    {/* Main Content */}
                    <div className="md:col-span-9 lg:col-span-9 flex flex-col gap-6 h-full overflow-y-auto pb-20 scrollbar-hide">
                        {/* Header */}
                         {/* Header */}
                         <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center min-h-[200px]">
                              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/80 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                              <div className="relative z-10 max-w-3xl">
                                 <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                     <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                         <ShoppingBag size={32} />
                                     </div>
                                     Categories
                                 </h1>
                                 <p className="text-gray-500 text-lg leading-relaxed">
                                     Explore diverse communities and find products tailored to your interests. Joins groups, buy and sell items, and connect with people like you.
                                 </p>
                              </div>
                         </div>

                        {/* Categories Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((category) => (
                                <Link 
                                    key={category.id} 
                                    href={`/category/${category.slug}`}
                                    className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all flex flex-col items-center text-center cursor-pointer"
                                >
                                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-indigo-600">
                                        {/* Icons could be dynamic based on category name if available, defaulting to generic */}
                                        <LayoutGrid size={28} />
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {category.name}
                                    </h3>
                                    
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                        {category.description || `Browse groups and items in ${category.name}`}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-gray-50 w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 group-hover:text-indigo-500">
                                        <span>View Groups</span>
                                        {/* <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span>{category._count?.groups || 0} Groups</span> */}
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {!loading && categories.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingBag className="text-gray-300" size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No Categories Found</h3>
                                <p className="text-gray-500">Check back later for new categories.</p>
                            </div>
                        )}
                        
                        {loading && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-64 animate-pulse">
                                         <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4"></div>
                                         <div className="h-6 bg-gray-100 rounded-lg w-3/4 mx-auto mb-2"></div>
                                         <div className="h-4 bg-gray-100 rounded-lg w-full mx-auto mb-2"></div>
                                          <div className="h-4 bg-gray-100 rounded-lg w-2/3 mx-auto"></div>
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
