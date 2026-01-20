"use client";

import {
  Dumbbell,
  Laptop,
  Shirt,
  Car,
  Home,
  MoreHorizontal,
  Camera,
  Gamepad2,
  Watch,
  Layers,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Category } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";

// Utility to map category names to icons/colors (Fallback)
const getCategoryStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("fashion") || n.includes("cloth"))
    return { icon: Shirt, color: "text-pink-600 bg-pink-100" };
  if (n.includes("electronic") || n.includes("phone"))
    return { icon: Laptop, color: "text-blue-600 bg-blue-100" };
  if (n.includes("vehicle") || n.includes("car"))
    return { icon: Car, color: "text-orange-600 bg-orange-100" };
  if (n.includes("property") || n.includes("home"))
    return { icon: Home, color: "text-green-600 bg-green-100" };
  if (n.includes("sport") || n.includes("gym"))
    return { icon: Dumbbell, color: "text-indigo-600 bg-indigo-100" };
  if (n.includes("hobby") || n.includes("camera"))
    return { icon: Camera, color: "text-purple-600 bg-purple-100" };
  if (n.includes("game"))
    return { icon: Gamepad2, color: "text-red-600 bg-red-100" };
  if (n.includes("access"))
    return { icon: Watch, color: "text-teal-600 bg-teal-100" };
  return { icon: Layers, color: "text-gray-600 bg-gray-100" };
};

export function CategoryPills() {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategoryId = searchParams.get("categoryId");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await api.get<Category[]>("/categories");
        setCategories(categories);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (id: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentCategoryId === String(id)) {
      params.delete("categoryId"); // Toggle off
    } else {
      params.set("categoryId", String(id));
    }
    router.push(`/?${params.toString()}`);
  };

  if (categories.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-3">
        <button
          onClick={() => router.push("/")}
          className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full shadow-sm border transition-all whitespace-nowrap min-w-fit ${
            !currentCategoryId
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white border-gray-100 text-gray-700 hover:shadow-md"
          }`}
        >
          <div
            className={`p-1.5 rounded-full ${!currentCategoryId ? "bg-white/20" : "bg-gray-100"}`}
          >
            <MoreHorizontal size={16} />
          </div>
          <span className="text-sm font-medium">All</span>
        </button>

        {categories.map((cat) => {
          const style = getCategoryStyle(cat.name);
          const isActive = currentCategoryId === String(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full shadow-sm border transition-all whitespace-nowrap min-w-fit ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white border-gray-100 text-gray-700 hover:shadow-md hover:border-indigo-100"
              }`}
            >
              <div
                className={`p-1.5 rounded-full ${isActive ? "bg-white/20" : style.color}`}
              >
                {cat.imageUrl ? (
                  <img
                    src={api.getImageUrl(cat.imageUrl)}
                    alt=""
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <style.icon size={16} />
                )}
              </div>
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
