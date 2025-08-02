import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, LogIn, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface RecentlyReadProps {
  userId: number;
}

export function RecentlyRead({ userId }: RecentlyReadProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const { data: recentlyRead = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/users", userId, "recently-read"],
    enabled: !!userId && isAuthenticated,
    staleTime: 0, // Make this query always fresh
    gcTime: 0, // Don't cache at all
    refetchOnWindowFocus: true, // Refetch when user comes back to the page
    refetchOnMount: "always", // Always refetch when component mounts
    refetchInterval: false,
    retry: 0,
  });
  
  // Backend already returns data sorted by readAt (most recent first) and limited to 10

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ storyId }: { storyId: number }) => {
      return apiRequest("POST", `/api/reading-progress/favorite`, { storyId });
    },
    onSuccess: () => {
      // 모든 관련 쿼리를 무효화하여 즐겨찾기 상태 동기화
      queryClient.invalidateQueries({ 
        queryKey: ["/api/users", userId, "recently-read"],
        exact: false,
        refetchType: "active"
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/stories/library/all`],
        exact: false,
        refetchType: "active"
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/stories/library/favorites`],
        exact: false,
        refetchType: "active"
      });
    },
  });

  const handleToggleFavorite = (storyId: number) => {
    toggleFavoriteMutation.mutate({ storyId });
  };

  // Show login prompt for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-heading text-gray-custom font-medium mb-4">
          {t("recentlyRead")}
        </h3>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-lavender/20 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-8 h-8 text-lavender" />
            </div>
            <h4 className="font-heading text-lg text-gray-custom font-medium mb-2">
              {t("startYourFairyTaleJourney")}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              {t("signInToCheckRecentReading")}
            </p>
            <Button 
              onClick={() => navigate("/login")}
              className="w-full bg-lavender hover:bg-lavender/90 text-white rounded-xl font-medium py-2"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {t("signInButton")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-heading text-gray-custom font-medium mb-4">
          {t("recentlyRead")}
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="flex space-x-2">
                    <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentlyRead.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-heading text-gray-custom font-medium mb-4">
          {t("recentlyRead")}
        </h3>
        <div className="text-center py-8 text-gray-500">
          <p>{t("noStoriesYet")}</p>
          <p className="text-sm mt-1">{t("fillLibraryMessage")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-heading text-gray-custom font-medium mb-4">
        {t("recentlyRead")}
      </h3>
      
      <div className="space-y-3">
        {recentlyRead.map((item: any) => (
          <div 
            key={item.id} 
            className="flex gap-3 bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/story/${item.story.storyUuid || item.story.id}`)}
          >
            <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
              {item.story.imageUrl ? (
                <img 
                  src={item.story.imageUrl} 
                  alt={item.story.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide broken image and show fallback
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs bg-gradient-to-br from-cream to-gray-100"
                style={{ display: item.story.imageUrl ? 'none' : 'flex' }}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-lavender/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-lavender">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H19V9Z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-medium text-sm truncate text-gray-custom">
                {item.story.title}
              </h3>
              <p className="text-xs text-gray-600 opacity-75 line-clamp-1 mt-1 truncate">
                {item.story.summary}
              </p>
              <div className="flex items-center justify-between mt-1">
                <div className="flex gap-1 overflow-hidden flex-1 min-w-0">
                  {(Array.isArray(item.story.tags) ? item.story.tags : [])?.slice(0, 3).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs text-lavender px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: '#9680c21a' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(item.story.id);
                  }}
                  className={cn(
                    "flex items-center gap-1 ml-2 p-1 hover:bg-gray-100 rounded-full",
                    item.isFavorite ? "text-lavender" : "text-gray-400"
                  )}
                  disabled={toggleFavoriteMutation.isPending}
                >
                  <Heart 
                    className={cn(
                      "w-4 h-4",
                      item.isFavorite ? "heart-filled" : "heart-empty"
                    )}
                  />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
