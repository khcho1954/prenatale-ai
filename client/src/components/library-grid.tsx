import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryGridProps {
  stories: Array<{
    id: number;
    storyUuid?: string;
    title: string;
    imageUrl: string;
    createdAt: string;
    readAt?: string;
    isFavorite: boolean;
    type?: string;
  }>;
  onFavoriteToggle: (storyId: number, isFavorite: boolean) => void;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export function LibraryGrid({ stories, onFavoriteToggle }: LibraryGridProps) {
  const [, navigate] = useLocation();

  // Debug logging (remove in production)
  // console.log('LibraryGrid received stories:', stories.map(s => ({ id: s.id, title: s.title, isFavorite: s.isFavorite })));

  const handleNavigate = (story: { id: number; storyUuid?: string }) => {
    if (story.storyUuid) {
      navigate(`/story/${story.storyUuid}?from=library`);
    } else {
      console.error('Story UUID is missing:', story);
    }
  };

  const handleToggleFavorite = (
    e: React.MouseEvent,
    storyId: number,
    isFavorite: boolean
  ) => {
    e.stopPropagation();
    // console.log('Heart clicked - Story ID:', storyId, 'Current isFavorite:', isFavorite);
    onFavoriteToggle(storyId, !isFavorite);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {stories.filter(story => story && story.id).map((story) => (
        <div
          key={story?.id || Math.random()}
          className="bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => handleNavigate({ id: story?.id || 0, storyUuid: story?.storyUuid })}
        >
          <div
            className="h-32 bg-cover bg-center"
            style={{ 
              backgroundImage: story?.imageUrl ? `url(${story.imageUrl})` : 'none',
              backgroundColor: story?.imageUrl ? 'transparent' : '#f3f4f6'
            }}
          >
            {!story?.imageUrl && (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                📚
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-heading text-sm font-medium text-gray-custom line-clamp-2">
              {story?.title || 'Untitled Story'}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600">
                {story?.type === 'uct' 
                  ? formatDate(new Date(story?.createdAt || Date.now()))
                  : (story as any)?.firstReadAt 
                    ? formatDate(new Date((story as any)?.firstReadAt))
                    : story?.readAt 
                      ? formatDate(new Date(story?.readAt))
                      : formatDate(new Date(story?.createdAt || Date.now()))
                }
              </span>
              <Button
                onClick={(e) => handleToggleFavorite(e, story?.id || 0, story?.isFavorite || false)}
                className="p-0 h-auto hover:bg-transparent"
                variant="ghost"
                size="sm"
              >
                <Heart 
                  className={cn(
                    "w-4 h-4",
                    story?.isFavorite ? "heart-filled" : "heart-empty"
                  )}
                />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}