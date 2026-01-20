"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Dummy Announcement Data
const ANNOUNCEMENTS = [
    {
        id: 1,
        title: "Welcome to Group Mart",
        description: "The best place to buy and sell with your community.",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1774&q=80",
        color: "from-blue-600 via-indigo-600 to-purple-600"
    },
    {
        id: 2,
        title: "Join Premium Groups",
        description: "Get exclusive access to top-rated seller groups.",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1771&q=80",
        color: "from-emerald-500 via-teal-500 to-cyan-500"
    },
    {
        id: 3,
        title: "Sell Faster with Boost",
        description: "Promote your listings to reach more buyers instantly.",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1932&q=80",
        color: "from-orange-500 via-amber-500 to-yellow-500"
    }
];

export function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-slide logic
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % ANNOUNCEMENTS.length);
        }, 5000); // Change slide every 5 seconds
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? ANNOUNCEMENTS.length - 1 : prev - 1));
    };

    return (
        <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-lg mb-6 group shrink-0 bg-gray-900 z-0">
            {ANNOUNCEMENTS.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                >
                    {/* Background Image with Overlay */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slide.image})` }}
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-80`} />
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Content */}
                    <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4 md:px-12 text-white">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-md">
                            {slide.title}
                        </h2>
                        <p className="text-sm md:text-base text-white/90 max-w-xl drop-shadow-sm">
                            {slide.description}
                        </p>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight size={24} />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {ANNOUNCEMENTS.map((_, index) => (
                    <button
                        key={index} 
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
