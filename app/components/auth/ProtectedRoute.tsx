"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client" | "user";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, initialized, isAuthenticated } = useAuth();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!initialized || hasRedirectedRef.current) return;

    if (!isAuthenticated) {
      hasRedirectedRef.current = true;
      router.push("/auth/login");
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      hasRedirectedRef.current = true;
      router.push("/dashboard");
    }
  }, [initialized, isAuthenticated, user, requiredRole, router]);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
