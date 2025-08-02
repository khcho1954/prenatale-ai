import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface ReadingStatsProps {
  babyName: string;
  userId: number;
}

export default function ReadingStats({ babyName, userId }: ReadingStatsProps) {
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch user stats from API
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch all reading dates for monthly calendar
  const { data: allReadingData, isLoading: readingLoading } = useQuery({
    queryKey: ["/api/users", userId, "all-reading-dates"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const stats = statsData || {
    storiesRead: 0,
    storiesCreated: 0,
    themes: []
  };

  const themes = stats.themes || [];

  // Convert readDays strings to Date objects
  const readDates = allReadingData ? allReadingData.map((day: string) => new Date(day)) : [];

  // Get the days in the current month using date-fns
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of the week (0-6) for the first day of the month
  const startDay = getDay(monthStart);
  
  // Function to check if a day has been read
  const isDayRead = (day: Date) => {
    return readDates.some(readDay => isSameDay(readDay, day));
  };
  
  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Generate blank days for the start of the calendar
  const blankDays = Array(startDay).fill(null).map((_, index) => (
    <div key={`blank-${index}`} className="h-8 w-8"></div>
  ));
  
  // Generate the day cells
  const dayCells = monthDays.map(day => {
    const isRead = isDayRead(day);
    const isToday = isSameDay(day, new Date());
    
    return (
      <div
        key={day.toString()}
        className={cn(
          "h-8 w-8 flex items-center justify-center rounded-full text-sm",
          isToday && "bg-[#8E7CC3] text-white",
          isRead && !isToday && "bg-[#9680c259] text-gray-700", // Light purple for read days
          !isRead && !isToday && "text-gray-700 bg-gray-200/25"
        )}
      >
        {format(day, "d")}
      </div>
    );
  });
  
  // Combine blank days and day cells
  const allCells = [...blankDays, ...dayCells];

  return (
    <div className="space-y-6">
      {/* Reading Statistics */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-heading text-lg mb-4 text-[#4A4A4A]">{babyName}{t("readingStatistics")}</h3>
        
        {/* Stories Read and Created */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg p-4 text-center bg-[#e8e6e194]">
            <div className="text-3xl font-bold text-[#8E7CC3] mb-1">
              {statsLoading ? "..." : stats.storiesRead}
            </div>
            <div className="text-sm text-[#4A4A4A]">{t("storiesRead")}</div>
          </div>
          
          <div className="rounded-lg p-4 text-center bg-[#e8e6e194]">
            <div className="text-3xl font-bold text-[#5CBDB9] mb-1">
              {statsLoading ? "..." : stats.storiesCreated}
            </div>
            <div className="text-sm text-[#4A4A4A]">{t("storiesCreated")}</div>
          </div>
        </div>

        {/* Themes */}
        <div className="mb-6">
          <h4 className="font-medium text-[#4A4A4A] mb-3">{t("themes")}</h4>
          <div className="space-y-3">
            {statsLoading ? (
              <div className="text-sm text-gray-500">Loading themes...</div>
            ) : themes.length > 0 ? (
              themes.map((theme, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#4A4A4A] font-medium">#{theme.name}</span>
                    <span className="text-sm text-[#4A4A4A]">({theme.percentage}%)</span>
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
              ))
            ) : (
              <div className="text-sm text-gray-500">No themes available yet</div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Button 
            variant="ghost" 
            className="text-[#8E7CC3] hover:text-[#8E7CC3] hover:bg-[#E8E6E1]"
            onClick={() => window.location.href = '/theme-details'}
          >
            {t("viewDetails")}
          </Button>
        </div>
      </div>
      {/* Reading Calendar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-heading text-lg mb-4 text-[#4A4A4A]">{babyName}{t("readingCalendar")}</h3>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h4 className="text-lg font-medium text-[#4A4A4A]">
            {format(currentMonth, "MMMM yyyy")}
          </h4>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {/* Week day headers */}
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
            <div key={day} className="text-center text-xs text-gray-500 font-medium p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {allCells}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-[#9680c259]"></div>
            <span>{language === 'ko' ? '독서일' : 'Read story'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-[#8E7CC3]"></div>
            <span>{language === 'ko' ? '오늘' : 'Today'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}