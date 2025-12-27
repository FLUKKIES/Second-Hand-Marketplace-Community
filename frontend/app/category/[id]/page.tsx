"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { GroupCard } from "@/components/social/GroupCard";
import { api } from "@/lib/api";
import { LayoutGrid, Users } from "lucide-react";

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    categoryId: number;
    _count: {
        members: number;
    };
}

export default function CategoryPage() {
    const params = useParams();
    const [category, setCategory] = useState<Category | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryData = async () => {
            if (!params.id) return;

            try {
                // Fetch category details
                const catRes = await api.get<Category>(`/categories/${params.id}`);
                setCategory(catRes.data);

                // Fetch groups in this category
                const groupsRes = await api.get<Group[]>(`/groups?categoryId=${params.id}`);
                setGroups(groupsRes.data);
            } catch (error) {
                console.error("Error fetching category data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryData();
    }, [params.id]);

    return (
        <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
            <Navbar />

            <main className="flex-1 container pt-6 px-4 md:px-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 align-start h-full">
                    
                    {/* Left Sidebar */}
                    <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
                        <LeftSidebar />
                    </aside>

                    {/* Main Content */}
                    <div className="md:col-span-9 lg:col-span-9 flex flex-col gap-6 h-full overflow-y-auto pb-20 scrollbar-hide">
                        {/* Header */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                             <div className="relative z-10">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                    <LayoutGrid className="text-indigo-600" size={32} />
                                    {loading ? "Loading..." : category?.name || "Category"}
                                </h1>
                                <p className="text-gray-500 max-w-2xl text-lg">
                                    {category ? `Discover communities in ${category.name}.` : "Explore groups in this category."}
                                </p>
                             </div>
                        </div>

                        {/* Groups Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map((group) => (
                                <GroupCard 
                                    key={group.id} 
                                    group={group} 
                                    onJoin={() => console.log("Join", group.id)} 
                                />
                            ))}
                        </div>

                        {!loading && groups.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Users className="text-gray-300" size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No Groups Found</h3>
                                <p className="text-gray-500">Be the first to create a group in this category!</p>
                            </div>
                        )}

                         {loading && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-64 animate-pulse">
                                         <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4"></div>
                                         <div className="h-6 bg-gray-100 rounded-lg w-3/4 mx-auto mb-2"></div>
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
