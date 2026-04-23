"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isAdminRoute = pathname.startsWith("/admin");
    const isAuthRoute =
      pathname.startsWith("/login") || pathname.startsWith("/register");

    // If not logged in, rely on page-level protection or redirect to login for admin routes
    if (!user) {
      if (isAdminRoute) {
        router.push("/login");
      }
      return;
    }

    // If logged in as ADMIN
    if (user.role === "ADMIN") {
      // Prevent access to non-admin routes (except purely functional ones if needed, but strict for now)
      if (!isAdminRoute) {
        router.push("/admin");
      }
    }

    // If logged in as USER (non-admin)
    if (user.role !== "ADMIN") {
      // Prevent access to admin routes
      if (isAdminRoute) {
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
