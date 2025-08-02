import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Book } from "lucide-react";
import type { LegacyStory } from "@shared/legacy-story";
import { useLanguage } from "@/hooks/useLanguage";

interface StorySwiperProps {
  stories: LegacyStory[];
  onReadStory: (storyUuid: string) => void;
}

interface StoryCardWrapperProps {
  story: LegacyStory;
  index: number;
  currentIndex: number;
  totalStories: number;
  onReadStory: (storyUuid: string) => void;
  onIndicatorClick: (index: number) => void;
}

export function StorySwiper({ stories, onReadStory }: StorySwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState<number | null>(null);

  const safeStories = Array.isArray(stories) ? stories : [];
  


  const prevStory = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const nextStory = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    if (currentIndex < safeStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX !== null) {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          nextStory();
        } else {
          prevStory();
        }
      }
      
      setStartX(null);
    }
  };

  if (!safeStories || safeStories.length === 0) {
    return (
      <div className="h-[520px] flex items-center justify-center bg-white rounded-2xl shadow-md">
        <div className="text-center px-4">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="swipe-container relative h-[580px] mb-4"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="swiper-wrapper w-full h-full overflow-hidden">
        <div 
          className="flex transition-transform duration-600 ease-out h-full"
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {safeStories.map((story, index) => {
            if (!story || !story.id) return null;
            return (
              <div key={story.id} className="flex-shrink-0 w-full">
                <StoryCardWithIndicators
                  story={story}
                  index={index}
                  currentIndex={currentIndex}
                  totalStories={safeStories.length}
                  onReadStory={onReadStory}
                  onIndicatorClick={setCurrentIndex}
                />
              </div>
            );
          })}
        </div>
      </div>
      

      
      {/* Navigation buttons */}
      {currentIndex > 0 ? (
        <Button
          onClick={(e) => prevStory(e)}
          className="absolute left-2 top-[280px] w-8 h-8 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-20 p-0 min-w-0 hover:bg-white/60 transition-all"
          variant="ghost"
          size="icon"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </Button>
      ) : (
        <div className="absolute left-2 top-[280px] w-8 h-8 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-20 p-0 min-w-0 opacity-50 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </div>
      )}
      
      {currentIndex < safeStories.length - 1 ? (
        <Button
          onClick={(e) => nextStory(e)}
          className="absolute right-2 top-[280px] w-8 h-8 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-20 p-0 min-w-0 hover:bg-white/60 transition-all"
          variant="ghost"
          size="icon"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </Button>
      ) : (
        <div className="absolute right-2 top-[280px] w-8 h-8 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-20 p-0 min-w-0 opacity-50 cursor-not-allowed">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}

function StoryCardWithIndicators({ story, index, currentIndex, totalStories, onReadStory, onIndicatorClick }: StoryCardWrapperProps) {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  
  const handleReadStory = () => {
    // Always use UUID for story navigation
    if (story.storyUuid) {
      onReadStory(story.storyUuid);
    } else {
      console.error('Story UUID is missing:', story);
    }
  };

  return (
    <div
      className={`story-card w-full rounded-2xl overflow-hidden shadow-md bg-white cursor-pointer`}
      onClick={handleReadStory}
    >
      <div className="h-56 bg-gray-200 relative overflow-hidden">
        {story.imageUrl ? (
          <img 
            src={story.imageUrl} 
            alt={story.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image and show fallback
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gradient-to-br from-cream to-gray-100"
          style={{ display: story.imageUrl ? 'none' : 'flex' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-lavender/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-lavender">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H19V9Z" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">Image Loading...</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 flex flex-col h-full">
        {/* Title and reading time section - fixed height for 2 lines */}
        <div className="flex justify-between items-start mb-2 min-h-[3.5rem]">
          <h3 className="font-heading font-semibold text-lg leading-tight flex-1 pr-3 line-clamp-2 text-gray-custom">
            {story.title}
          </h3>
          <span className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
            <Clock className="w-3 h-3 mr-1" />
            {story.readingTime} min
          </span>
        </div>

        {/* Excerpt section - directly below title */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
          {story.summary}
        </p>

        {/* Fixed bottom section with tags, button, and indicators */}
        <div className="mt-auto">
          <div className="flex gap-2 mb-6 overflow-hidden">
            {Array.isArray(story.tags) && story.tags.slice(0, 4).map((tag, tagIndex) => (
              <span
                key={`${tag}-${tagIndex}`}
                className="text-xs text-lavender px-3 py-1 rounded-full font-medium whitespace-nowrap"
                style={{ backgroundColor: '#9680c21a' }}
              >
                #{tag}
              </span>
            ))}
          </div>

          <Button
            className="w-full py-3 bg-lavender text-white rounded-xl font-medium hover:bg-lavender/90 transition-all active:scale-95 mb-4"
            onClick={(e) => {
              e.stopPropagation();
              handleReadStory();
            }}
          >
            {t("readStory")}
          </Button>
          
          {/* Swipe indicators inside the card */}
          <div className="flex justify-center gap-2 pb-2">
            {Array.from({ length: totalStories }, (_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onIndicatorClick(idx);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-lavender" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}