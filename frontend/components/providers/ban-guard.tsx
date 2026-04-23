"use client";

import { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export function BanGuard() {
    const router = useRouter();

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                // Check for 403 Forbidden
                if (error.response?.status === 403) {
                    const data = error.response.data;

                    // Specific check for ban payload structure
                    if (data?.message === 'Your account has been suspended' || data?.reason || data?.expiresAt) {
                        const { reason, expiresAt } = data;
                        const params = new URLSearchParams();
                        if (reason) params.set('reason', reason);
                        if (expiresAt) params.set('expiresAt', expiresAt);

                        // Prevent infinite redirect loop if already on /banned
                        if (!window.location.pathname.includes('/banned')) {
                            router.push(`/banned?${params.toString()}`);
                        }
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [router]);

    return null;
}
