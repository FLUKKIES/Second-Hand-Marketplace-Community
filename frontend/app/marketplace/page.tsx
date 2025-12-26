import { Navbar } from "@/components/common/Navbar"
import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar"
import { MarketplaceFeed } from "@/components/marketplace/MarketplaceFeed"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

function MarketplaceLoader() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <Loader2 className="animate-spin text-muted-foreground" />
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 shrink-0">
                <Suspense fallback={<MarketplaceLoader />}>
                    <MarketplaceSidebar />
                </Suspense>
            </aside>
            
            {/* Main Content */}
            <div className="flex-1">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
                    <p className="text-muted-foreground">Find the best deals from the community</p>
                </div>
                <Suspense fallback={<MarketplaceLoader />}>
                    <MarketplaceFeed />
                </Suspense>
            </div>
        </div>
      </main>
    </div>
  )
}
