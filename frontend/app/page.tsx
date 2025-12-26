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
      
      <main className="flex-1 container pt-6 px-4 md:px-6 overflow-hidden">
        {/* Mobile: Hero matches width, Desktop: 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 align-start h-full">
            
            {/* Left Sidebar (25% ~ 3 cols) - Hidden on mobile */}
            <aside className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-y-auto pb-20 scrollbar-hide">
                <LeftSidebar />
            </aside>

            {/* Main Feed (50-58% ~ 6-7 cols) */}
            <div className="md:col-span-9 lg:col-span-6 flex flex-col gap-6 h-full overflow-y-auto pb-20 scrollbar-hide">
                <HeroSection />
                
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                         <h2 className="text-lg font-bold text-gray-800">Explore Feed</h2>
                         <button className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
                    </div>
                    {/* Horizontal Category Pills */}
                    <Suspense fallback={<div className="h-10 w-full bg-gray-100 rounded-full animate-pulse"></div>}>
                        <CategoryPills />
                    </Suspense>
                    
                    {/* Feed */}
                    <PostFeed />
                </div>
                
                {/* Fallback for "end of feed" */}
                <div className="text-center py-8 text-gray-400 text-sm">
                    You've reached the end!
                </div>
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
