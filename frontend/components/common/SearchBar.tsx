"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keyword.trim()) {
      const params = new URLSearchParams();
      params.set("keyword", keyword.trim());
      
      // Check if we are inside a group (e.g., /groups/123)
      const groupMatch = pathname.match(/^\/groups\/([^/]+)/);
      if (groupMatch) {
         params.set("groupId", groupMatch[1]);
      }

      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="relative w-full max-w-md group">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 h-4 w-4 transition-colors group-focus-within:text-primary" />
      <input
        type="text"
        placeholder="Search for products, groups, or people..."
        className="w-full h-10 pl-10 pr-4 bg-muted/50 border border-transparent hover:border-border focus:border-primary/30 rounded-full text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-background transition-all duration-300"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleSearch}
      />
    </div>
  );
}
