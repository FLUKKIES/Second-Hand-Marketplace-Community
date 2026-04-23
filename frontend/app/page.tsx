import { Navbar } from "@/components/common/Navbar";
import { HeroSection } from "@/components/common/HeroSection";
import { PostFeed } from "@/components/social/PostFeed";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { CategoryPills } from "@/components/marketplace/CategoryPills";
import { Suspense } from "react";

export default function Home() {
    return (
        <div className="flex flex-col h-screen bg-gray-50/50 overflow-hidden">
            <Navbar />

            <main className="flex-1 pt-2 px-2 md:px-2 overflow-hidden">
                {/* Mobile: Hero matches width, Desktop: 3-column layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 align-start h-full">

                    {/* Left Sidebar (25% ~ 3 cols) - Hidden on mobile */}
                    <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-2 scrollbar-hide">
                        <LeftSidebar />
                    </aside>

                    {/* Main Feed (50-58% ~ 6-7 cols) */}
                    <div className="md:col-span-9 lg:col-span-6 flex flex-col h-full overflow-y-auto scrollbar-hide">
                        <HeroSection />
                        <PostFeed />
                    </div>

                    {/* Right Sidebar (25% ~ 3 cols) - Hidden on tablet/mobile */}
                    <aside className="hidden lg:block lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
                        <RightSidebar />
                    </aside>

                </div>
            </main>
        </div>
    );
}
