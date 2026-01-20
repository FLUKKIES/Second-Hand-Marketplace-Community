"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface ImageViewerProps {
    images: { url: string }[] | string[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageViewer({ images, initialIndex = 0, isOpen, onClose }: ImageViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);

    // Reset index when opening with a new initialIndex
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setIsZoomed(false);
        }
    }, [isOpen, initialIndex]);

    const urls = images.map(img => typeof img === 'string' ? img : img.url);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev: number) => (prev === 0 ? urls.length - 1 : prev - 1));
        setIsZoomed(false);
    }, [urls.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev: number) => (prev === urls.length - 1 ? 0 : prev + 1));
        setIsZoomed(false);
    }, [urls.length]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, handlePrev, handleNext]);

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const currentUrl = api.getImageUrl(urls[currentIndex]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                <div className="bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
                    {currentIndex + 1} / {urls.length}
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose}
                    className="rounded-full bg-black/20 text-white hover:bg-white/20 hover:text-white transition-colors border border-transparent hover:border-white/10"
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Navigation Left */}
            {urls.length > 1 && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 bg-black/20 text-white hover:bg-white/20 hover:text-white transition-all border border-transparent hover:border-white/10 hidden sm:flex"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
            )}

            {/* Main Image */}
            <div 
                className={cn(
                    "relative transition-transform duration-300 ease-out max-w-full max-h-full p-4 flex items-center justify-center",
                    isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
                )}
                onClick={() => setIsZoomed(!isZoomed)}
            >
                <img 
                    src={currentUrl} 
                    alt={`Image ${currentIndex + 1}`} 
                    className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg select-none"
                    draggable={false}
                />
            </div>

             {/* Navigation Right */}
             {urls.length > 1 && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 bg-black/20 text-white hover:bg-white/20 hover:text-white transition-all border border-transparent hover:border-white/10 hidden sm:flex"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            )}

            {/* Mobile Navigation Indicators (Bottom) */}
            {urls.length > 1 && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:hidden">
                    {urls.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all", 
                                idx === currentIndex ? "bg-white scale-125" : "bg-white/30"
                            )} 
                        />
                    ))}
                 </div>
            )}
        </div>
    );
}
