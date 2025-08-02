import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp, BookOpen, Heart, Calendar, Trophy, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function ThemeDetails() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [visibleThemes, setVisibleThemes] = useState(10);

  // Fetch all user themes from API with aggressive caching
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/themes"],
    staleTime: 1000 * 60 * 30, // 30 minutes - themes don't change frequently
    gcTime: 1000 * 60 * 60, // 1 hour cache
    refetchOnWindowFocus: false, // Don't refetch on focus
  });

  // Fetch weekly reading data for streak calculation
  const { data: weeklyReadingData } = useQuery({
    queryKey: ["/api/users", user?.id, "weekly-reading"],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const stats = statsData || {
    storiesRead: 0,
    storiesCreated: 0,
    themes: []
  };

  const themes = stats.themes || [];
  const displayedThemes = themes.slice(0, visibleThemes);
  const hasMoreThemes = themes.length > visibleThemes;

  // Calculate reading streak
  const calculateReadingStreak = () => {
    if (!weeklyReadingData || weeklyReadingData.length === 0) return 0;
    
    const readDates = weeklyReadingData.map(date => new Date(date).toDateString());
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    let streak = 0;
    if (readDates.includes(today) || readDates.includes(yesterday)) {
      streak = 1;
      // Simple streak calculation - could be enhanced
      const uniqueDates = [...new Set(readDates)].sort();
      streak = Math.min(uniqueDates.length, 7); // Max 7 days shown
    }
    
    return streak;
  };

  const readingStreak = calculateReadingStreak();

  const handleShowMore = () => {
    setVisibleThemes(prev => prev + 10);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4] p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/mypage")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-[#4A4A4A]">Reading Statistics</h1>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="w-5 h-5 text-[#8E7CC3]" />
              <span className="text-sm text-[#4A4A4A] font-medium">Stories Read</span>
            </div>
            <div className="text-2xl font-bold text-[#8E7CC3]">{stats.storiesRead}</div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#5CBDB9]" />
              <span className="text-sm text-[#4A4A4A] font-medium">Reading Streak</span>
            </div>
            <div className="text-2xl font-bold text-[#5CBDB9]">{readingStreak} days</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="w-5 h-5 text-[#7CC39F]" />
              <span className="text-sm text-[#4A4A4A] font-medium">Created Tales</span>
            </div>
            <div className="text-2xl font-bold text-[#7CC39F]">{stats.storiesCreated}</div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <Heart className="w-5 h-5 text-[#FFB6A3]" />
              <span className="text-sm text-[#4A4A4A] font-medium">Themes Collected</span>
            </div>
            <div className="text-2xl font-bold text-[#FFB6A3]">{themes.length}</div>
          </div>
        </div>

        {/* Theme Rankings */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-heading text-lg mb-4 text-[#4A4A4A] flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-[#E6C074]" />
            Theme Rankings
          </h2>
          
          <div className="space-y-4">
            {statsLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-[#4A4A4A]">Loading theme statistics...</div>
              </div>
            ) : displayedThemes.length > 0 ? (
              <>
                {displayedThemes.map((theme, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8E6E1] flex items-center justify-center">
                          <span className="text-sm font-bold text-[#4A4A4A]">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-[#4A4A4A]">#{theme.name}</div>
                          <div className="text-sm text-gray-500">{theme.count} stories</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#4A4A4A]">{theme.percentage}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-[#E8E6E1] rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${theme.percentage}%`,
                          backgroundColor: theme.color
                        }}
                      />
                    </div>
                  </div>
                ))}
                
                {hasMoreThemes && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="ghost" 
                      onClick={handleShowMore}
                      className="text-[#8E7CC3] hover:text-[#8E7CC3] hover:bg-[#E8E6E1]"
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show More ({themes.length - visibleThemes} remaining)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">No themes available yet</div>
                <div className="text-xs text-gray-400 mt-1">Start reading stories to see theme analysis</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}