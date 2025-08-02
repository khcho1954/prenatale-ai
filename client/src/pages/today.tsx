import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StorySwiper } from "@/components/story-swiper";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { RecentlyRead } from "@/components/recently-read";
import { BottomNavigation } from "@/components/bottom-navigation";
import { LoginModal } from "@/components/login-modal";
import { StorySkeleton, WeeklyCalendarSkeleton, RecentlyReadSkeleton } from "@/components/skeleton-loader";
import { BusinessFooter } from "@/components/business-footer";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { detectUserTimezone } from "@/lib/timezone";
import type { LegacyStory } from "@shared/legacy-story";

export default function TodayPage() {
  const [activeTab, setActiveTab] = useState("today");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Get user ID from authenticated user
  const userId = user?.id || 1;

  const { data: stories = [], isLoading } = useQuery<LegacyStory[]>({
    queryKey: ["/api/stories/today", user?.id],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let url = "/api/stories/today";

      // 비로그인 사용자인 경우 timezone 자동 탐지
      if (!user) {
        const timezone = detectUserTimezone();
        url += `?timezone=${encodeURIComponent(timezone)}`;
      }

      const response = await fetch(url, {
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Today stories API response:", data);

      // Handle both old and new response formats
      if (Array.isArray(data) && data.length > 0) {
        // Check if it's new format with story/progress objects
        if (data[0].story && data[0].progress !== undefined) {
          return data.map((item) => ({
            ...item.story,
            isFavorite: item.progress?.isFavorite || false,
          }));
        }
        // Old format - return as is
        return data;
      }

      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (longer cache for stability)
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchInterval: false, // No auto-refresh for better performance
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (storyId: string) => {
      return apiRequest("POST", "/api/reading-progress", {
        userId,
        storyId: parseInt(storyId), // Convert to number for story ID
        isFavorite: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/users", userId, "recently-read"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users", userId, "weekly-reading"],
      });
    },
  });

  const handleReadStory = (storyUuid: string) => {
    // 비로그인 사용자인 경우 로그인 모달 표시
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // 로그인 사용자는 스토리 상세 페이지로 이동 (UUID 사용)
    navigate(`/story/${storyUuid}`);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "library") {
      navigate("/library");
    } else if (tab === "create") {
      navigate("/create");
    } else if (tab === "mypage") {
      navigate("/mypage");
    }
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container-mobile bg-cream min-h-screen relative">
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

        {/* Loading Content */}
        <main className="pb-24 pt-1">
          <div className="mb-6">
            <WeeklyCalendarSkeleton />
          </div>
          
          <div className="mb-6 flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          
          <div className="mb-6">
            <StorySkeleton />
          </div>
          
          <div className="mb-4">
            <div className="h-5 bg-gray-200 rounded w-28 animate-pulse mb-3"></div>
            <RecentlyReadSkeleton />
          </div>
        </main>

        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  return (
    <div className="container-mobile bg-cream min-h-screen relative">
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
      <main className="pt-1">
        {/* Weekly Calendar */}
        <div className="mb-6">
          <WeeklyCalendar userId={userId} />
        </div>

        {/* Today Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-heading text-gray-custom font-medium">
            {t("todaysFairyTales")}
          </h2>
          <p className="text-sm text-gray-500">{formatDate()}</p>
        </div>

        {/* Story Carousel */}
        <StorySwiper stories={stories} onReadStory={handleReadStory} />

        {/* Recently Read */}
        <RecentlyRead userId={userId} />
      </main>

      {/* Business Footer */}
      <BusinessFooter />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          // Refresh user data after successful login
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }}
      />
    </div>
  );
}
