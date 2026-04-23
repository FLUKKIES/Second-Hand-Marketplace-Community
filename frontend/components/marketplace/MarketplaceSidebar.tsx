"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

const CATEGORIES = [
    { id: 1, name: "Electronics" },
    { id: 2, name: "Clothing" },
    { id: 3, name: "Home & Garden" },
    { id: 4, name: "Books" },
    { id: 5, name: "Sports" },
    { id: 6, name: "Toys" },
    { id: 7, name: "Hobbies" },
    { id: 8, name: "Other" },
]

export function MarketplaceSidebar() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get("q") || "")
    const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
    const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("categoryId"))

    // Sync local state with URL params if they change externally (e.g. back button)
    useEffect(() => {
        setSearch(searchParams.get("q") || "")
        setMinPrice(searchParams.get("minPrice") || "")
        setMaxPrice(searchParams.get("maxPrice") || "")
        setSelectedCategory(searchParams.get("categoryId"))
    }, [searchParams])

    const handleApplyFilters = () => {
        const params = new URLSearchParams()
        if (search) params.set("q", search)
        if (minPrice) params.set("minPrice", minPrice)
        if (maxPrice) params.set("maxPrice", maxPrice)
        if (selectedCategory) params.set("categoryId", selectedCategory)

        router.push(`/marketplace?${params.toString()}`)
    }

    const handleReset = () => {
        setSearch("")
        setMinPrice("")
        setMaxPrice("")
        setSelectedCategory(null)
        router.push("/marketplace")
    }

    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                        id="search"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Categories */}
                <div className="space-y-2">
                    <Label>Category</Label>
                    <div className="flex flex-col space-y-1">
                        <button
                            key="all"
                            onClick={() => setSelectedCategory(null)}
                            className={`text-sm text-left px-2 py-1.5 rounded-md transition-colors ${!selectedCategory
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            All Categories
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(String(cat.id))}
                                className={`text-sm text-left px-2 py-1.5 rounded-md transition-colors ${selectedCategory === String(cat.id)
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                    <Label>Price Range (฿)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="Min"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="number"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={handleApplyFilters}>Apply Filters</Button>
                    <Button variant="outline" onClick={handleReset}>Reset</Button>
                </div>
            </CardContent>
        </Card>
    )
}
