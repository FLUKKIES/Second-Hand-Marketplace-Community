import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";

interface SearchFiltersProps {
  filters: {
    type?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
}

export function SearchFilters({
  filters,
  onFilterChange,
  onClear,
}: SearchFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-border/50">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Post Type */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-1">
              Type:
            </span>
            <div className="flex p-1 bg-muted/50 rounded-lg">
              <button
                onClick={() => onFilterChange("type", "ALL")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!filters.type || filters.type === "ALL" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              <button
                onClick={() => onFilterChange("type", "SELLING")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filters.type === "SELLING" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Selling
              </button>
              <button
                onClick={() => onFilterChange("type", "NORMAL")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filters.type === "NORMAL" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Discussion
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Price:
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ""}
                onChange={(e) => onFilterChange("minPrice", e.target.value)}
                className="w-20 h-8 text-xs"
                min={0}
              />
              <span className="text-muted-foreground text-xs">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ""}
                onChange={(e) => onFilterChange("maxPrice", e.target.value)}
                className="w-20 h-8 text-xs"
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sort */}
          <Select
            value={filters.sort || "LATEST"}
            onValueChange={(val) => onFilterChange("sort", val)}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LATEST">Latest</SelectItem>
              <SelectItem value="POPULAR">Popular</SelectItem>
              <SelectItem value="PRICE_ASC">Price: Low to High</SelectItem>
              <SelectItem value="PRICE_DESC">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {(filters.type ||
            filters.minPrice ||
            filters.maxPrice ||
            (filters.sort && filters.sort !== "LATEST")) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
              >
                Clear Filter
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
