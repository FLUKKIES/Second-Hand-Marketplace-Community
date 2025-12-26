import Link from "next/link";
import { Search, ShoppingBag, Bell, User, Menu, ChevronDown, MessageCircle } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-surface/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
           <div className="bg-foreground text-background p-1.5 rounded-lg">
             <ShoppingBag size={20} />
           </div>
           <span>GroupMart</span>
        </Link>
        
        {/* Center Search Bar */}
        <div className="hidden md:flex flex-1 justify-center px-6">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input 
                    type="text" 
                    placeholder="Search GroupMart..." 
                    className="w-full h-10 pl-10 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none"
                />
            </div>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
             <button className="text-muted-foreground hover:text-foreground md:hidden">
                <Search size={22} />
             </button>
             <button className="text-muted-foreground hover:text-foreground relative group">
                <MessageCircle size={22} />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">3</span>
             </button>
             <button className="text-muted-foreground hover:text-foreground relative group">
                <Bell size={22} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             <button className="text-muted-foreground hover:text-foreground">
                <ShoppingBag size={22} />
             </button>
             <button className="flex items-center gap-2 pl-4 border-l">
                 <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden ring-2 ring-transparent hover:ring-indigo-100 transition-all">
                    {/* Avatar Placeholder */}
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia" alt="User" className="w-full h-full object-cover" />
                 </div>
             </button>
        </div>

         {/* Mobile Menu */}
         <button className="md:hidden text-foreground">
            <Menu size={24} />
         </button>
      </div>
    </header>
  );
}
