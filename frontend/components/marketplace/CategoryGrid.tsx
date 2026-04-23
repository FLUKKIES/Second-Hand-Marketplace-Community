import { Dumbbell, Laptop, Shirt, Car, Home, MoreHorizontal } from "lucide-react";

const categories = [
    { name: "Sport", icon: Dumbbell, color: "bg-indigo-100 text-indigo-600" },
    { name: "Electronic", icon: Laptop, color: "bg-blue-100 text-blue-600" },
    { name: "Fashion", icon: Shirt, color: "bg-pink-100 text-pink-600" }, // "Sport" was repeated in design, using Fashion
    { name: "Vehicles", icon: Car, color: "bg-orange-100 text-orange-600" }, // "Sport" was repeated
    { name: "Property", icon: Home, color: "bg-green-100 text-green-600" },
    { name: "See more", icon: MoreHorizontal, color: "bg-gray-100 text-gray-600" },
];

export function CategoryGrid() {
    return (
        <section className="container py-8 px-4 md:px-6">
            <h2 className="text-2xl font-bold mb-6 text-center md:text-left text-white md:text-foreground">Choose your categories</h2>
            {/* Note: In the design, this section overlayed the blue background slightly or was on blue. 
                I'll keep it simple for now, maybe add negative margin if I put it below Hero. 
                For now, standard grid.
            */}
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {categories.map((cat, idx) => (
                    <button key={idx} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all gap-3 aspect-square">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.color}`}>
                            <cat.icon size={24} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{cat.name}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
