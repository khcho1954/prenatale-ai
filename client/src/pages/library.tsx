import { useState, useEffect, useCallback, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Heart, Calendar, Edit, Bell } from "lucide-react";
import { LibraryGrid } from "@/components/library-grid";
import { LibraryEmptyState } from "@/components/library-empty-state";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

type FilterType = "all" | "today" | "favorites" | "created";

export default function Library() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("library");
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/stories/library", activeFilter, debouncedSearchQuery],
    queryFn: ({ pageParam = 1 }) => {
      let url = `/api/stories/library/${activeFilter}?page=${pageParam}&limit=20`;
      if (debouncedSearchQuery) {
        url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
      }
      return fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch');
        }
        return res.json();
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Flatten all pages into a single array and memoize for performance
  const libraryStories = useMemo(() => {
    return data?.pages.flatMap(page => page.stories) || [];
  }, [data?.pages]);

  // Handle favorite toggle with optimistic UI update
  const handleFavoriteToggle = async (storyId: number, isFavorite: boolean) => {
    // Optimistic update - update UI immediately for ALL filter queries
    queryClient.setQueriesData(
      { queryKey: ["/api/stories/library"] },
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            stories: page.stories.map((story: any) => 
              story.id === storyId 
                ? { ...story, isFavorite: isFavorite }
                : story
            )
          }))
        };
      }
    );

    try {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/reading-progress/favorite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ storyId }),
      });

      if (response.ok) {
        // 모든 관련 쿼리를 무효화하여 즐겨찾기 상태 동기화
        queryClient.invalidateQueries({ queryKey: ["/api/stories/library"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users", 3, "recently-read"] });
        queryClient.invalidateQueries({ queryKey: [`/api/stories/library/all`] });
        queryClient.invalidateQueries({ queryKey: [`/api/stories/library/favorites`] });
      } else {
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: ["/api/stories/library"] });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["/api/stories/library"] });
    }
  };

  const filters: { value: FilterType; label: string; icon: any }[] = [
    { value: "all", label: t("allStories"), icon: BookOpen },
    { value: "favorites", label: t("favorites"), icon: Heart },
    { value: "today", label: t("todaysStories"), icon: Calendar },
    { value: "created", label: t("createdStories"), icon: Edit },
  ];

  const filteredStories = (libraryStories && Array.isArray(libraryStories))
    ? libraryStories.filter((story: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          story.title.toLowerCase().includes(query) ||
          story.tags?.some((tag: string) => tag.toLowerCase().includes(query))
        );
      })
    : [];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "today") {
      navigate("/");
    } else if (tab === "create") {
      navigate("/create");
    } else if (tab === "mypage") {
      navigate("/mypage");
    }
  };

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000 // Load more when 1000px from bottom
    ) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="container-mobile bg-cream min-h-screen">
      {/* Header */}
      <header className="py-3 bg-cream sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-heading text-lavender font-semibold">
            prena tale
          </h1>
          <Button variant="ghost" size="sm" className="p-2 rounded-full">
            <Bell className="w-5 h-5 text-gray-custom" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 pt-4">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-lg font-heading text-gray-custom font-medium">
            {t("yourLibrary")}
          </h2>
        </div>
        {/* Filter Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {filters.map((filter) => {
            return (
              <Button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "flex items-center justify-center py-2 rounded-xl font-medium h-10",
                  activeFilter === filter.value
                    ? "bg-lavender text-white"
                    : "bg-white text-gray-custom hover:bg-gray-50"
                )}
                style={{ fontSize: '14px' }}
                variant={activeFilter === filter.value ? "default" : "outline"}
              >
                {filter.label}
              </Button>
            );
          })}
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder={t("searchYourLibrary")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-lavender focus:border-lavender"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        {/* Content */}
        {/* Non-authenticated users always see the empty state */}
        {!isAuthenticated ? (
          <LibraryEmptyState filter={activeFilter} isAuthenticated={false} />
        ) : isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender"></div>
          </div>
        ) : isError ? (
          <LibraryEmptyState filter={activeFilter} isAuthenticated={true} />
        ) : filteredStories.length > 0 ? (
          <>
            <LibraryGrid stories={filteredStories} onFavoriteToggle={handleFavoriteToggle} />
            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender"></div>
              </div>
            )}
          </>
        ) : (
          /* Empty state for authenticated users with no stories */
          <LibraryEmptyState filter={activeFilter} isAuthenticated={true} />
        )}
        
        {/* Search results empty state */}
        {searchQuery && filteredStories.length === 0 && !isLoading && isAuthenticated && (
          <div className="bg-white p-8 rounded-xl text-center shadow-sm">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-heading text-lg mb-2 text-gray-custom">No Stories Found</h3>
            <p className="text-gray-600">
              No results for "{searchQuery}". Try a different search term.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}