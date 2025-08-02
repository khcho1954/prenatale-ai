import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 15, // 15 minutes (longer cache)
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Prevent mount refetch if data exists
    refetchInterval: false, // No automatic polling
  });

  // Listen for auth token changes and refetch user data
  useEffect(() => {
    const handleAuthTokenChanged = () => {
      console.log("Auth token changed in useAuth, refetching user data");
      refetch();
    };

    window.addEventListener('authTokenChanged', handleAuthTokenChanged);
    return () => window.removeEventListener('authTokenChanged', handleAuthTokenChanged);
  }, [refetch]);

  // Helper function to check if user has Prena plan access
  const hasPrenaPlan = (user as any)?.subscriptionPlan === 'prena' && (user as any)?.subscriptionStatus === 'active';

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    hasPrenaPlan,
  };
}