"use client";

import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { Suspense } from "react";

function BannedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const reason = searchParams.get('reason');
    const expiresAt = searchParams.get('expiresAt');

    const handleLogout = () => {
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="text-center max-w-md">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <AlertOctagon className="w-8 h-8 text-red-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Account Suspended
                </h1>

                <p className="text-gray-600 mb-6">
                    Your account has been suspended due to a violation of our community guidelines.
                </p>

                {reason && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 text-left">
                        <p className="text-sm font-medium text-gray-700">Reason:</p>
                        <p className="text-sm text-gray-600">{reason}</p>
                    </div>
                )}

                {expiresAt && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 text-left">
                        <p className="text-sm font-medium text-gray-700">Expires At:</p>
                        <p className="text-sm text-gray-600">{new Date(expiresAt).toLocaleString()}</p>
                    </div>
                )}

                <Button onClick={handleLogout} className="w-full">
                    Sign Out
                </Button>
            </div>
        </div>
    );
}

export default function BannedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <BannedContent />
        </Suspense>
    );
}
