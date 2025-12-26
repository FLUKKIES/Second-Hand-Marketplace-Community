import Link from "next/link";

const dummyGroups = [
    { name: "Basketball Sneakers", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&h=100", id: 1 },
    { name: "Nike Stuff", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&h=100", id: 2 },
    { name: "Pez", img: "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&w=100&h=100", id: 3 },
    { name: "Iphone", img: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=100&h=100", id: 4 },
    { name: "Clothing", img: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=100&h=100", id: 5 }, 
];

export function MyGroups() {
    return (
        <section className="container py-8 px-4 md:px-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">My Group</h2>
                <Link href="/groups" className="text-sm text-primary hover:underline">See All</Link>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {dummyGroups.map((group) => (
                    <Link key={group.id} href={`/groups/${group.id}`} className="flex flex-col items-center gap-2 min-w-[80px]">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
                            <img src={group.img} alt={group.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-medium text-center leading-tight line-clamp-2 w-full">{group.name}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
