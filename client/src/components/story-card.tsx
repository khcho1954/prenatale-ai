import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import type { Story } from "@shared/schema";
import { useLanguage } from "@/hooks/useLanguage";

interface StoryCardProps {
  story: Story;
  index: number;
  currentIndex: number;
  onReadStory: (storyId: number) => void;
}

export function StoryCard({ story, index, currentIndex, onReadStory }: StoryCardProps) {
  const { t } = useLanguage();
  const handleReadStory = () => {
    onReadStory(story.id);
  };

  const isActive = index === currentIndex;
  const offset = (index - currentIndex) * 100;

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
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-sm">No image</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading font-semibold text-lg leading-tight flex-1 pr-3 line-clamp-2 text-gray-custom min-h-[3.5rem]">
            {story.title}
          </h3>
          <span className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
            <Clock className="w-3 h-3 mr-1" />
            {story.readingTime} min
          </span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed flex-1">
          {story.summary}
        </p>

        <div className="flex gap-2 mb-6 overflow-hidden">
          {story.tags?.slice(0, 4).map((tag, tagIndex) => (
            <span
              key={`${tag}-${tagIndex}`}
              className="text-xs text-lavender px-3 py-1 rounded-full font-medium whitespace-nowrap"
              style={{ backgroundColor: '#9680c21a' }}
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto">
          <Button
            className="w-full py-3 bg-lavender text-white rounded-xl font-medium hover:bg-lavender/90 transition-all active:scale-95 mb-4"
            onClick={(e) => {
              e.stopPropagation();
              handleReadStory();
            }}
          >
            {t("readStory")}
          </Button>
        </div>
      </div>
    </div>
  );
}
