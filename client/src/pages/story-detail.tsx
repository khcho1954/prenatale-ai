import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, Clock, Heart, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
// Type definition for story data structure
interface LegacyStory {
  id: number;
  storyUuid: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  readingTime?: number;
  readingTimeMinutes?: number;
  language: string;
  isDaily?: boolean;
  isFavorite?: boolean;
  readAt?: string | null;
  createdAt: string;
}
import TTSPlayer from "@/components/tts-player";

export default function StoryDetail() {
  const { uuid } = useParams(); // Changed from id to uuid
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  // URL 매개변수에서 from 값 추출
  const urlParams = new URLSearchParams(window.location.search);
  const fromPage = urlParams.get('from');
  
  const userId = (user as any)?.id;
  
  // NEW: UUID-based story fetching
  const { data: story, isLoading, error } = useQuery<LegacyStory>({
    queryKey: [`/api/stories/uuid/${uuid}`],
    enabled: !!uuid,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (storyId: number) => {
      console.log(`Marking story ${storyId} as read for user ${userId}`);
      return apiRequest("POST", `/api/reading-progress`, {
        userId,
        storyId,
        isRead: true,
      });
    },
    onSuccess: (data: any) => {
      // Update cache directly instead of invalidating to prevent refetch
      queryClient.setQueryData([`/api/stories/uuid/${uuid}`], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            readAt: new Date().toISOString(),
            isFavorite: data.isFavorite
          };
        }
        return oldData;
      });
      
      // Invalidate recently read cache to show updated order
      queryClient.invalidateQueries({ 
        queryKey: ["/api/users", userId, "recently-read"]
      });
    },
  });

  // Always mark as read when story loads to update readAt timestamp for Recently read ordering
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  
  // Reset hasMarkedAsRead when story ID changes
  useEffect(() => {
    setHasMarkedAsRead(false);
  }, [story?.id]);
  
  useEffect(() => {
    if (story && story.id && userId && !markAsReadMutation.isPending && !hasMarkedAsRead) {
      console.log(`Updating readAt for story ${story.id} (previous readAt: ${(story as any).readAt})`);
      markAsReadMutation.mutate(story.id);
      setHasMarkedAsRead(true);
    }
  }, [story?.id, userId, hasMarkedAsRead, markAsReadMutation.isPending]); // Include hasMarkedAsRead to prevent infinite calls

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (storyId: number) => {
      return apiRequest("POST", `/api/reading-progress/favorite`, { storyId });
    },
    onMutate: async (storyId: number) => {
      // OPTIMISTIC UPDATE: Update UI immediately before server response
      await queryClient.cancelQueries({ queryKey: [`/api/stories/uuid/${uuid}`] });
      
      const previousStory = queryClient.getQueryData([`/api/stories/uuid/${uuid}`]);
      
      queryClient.setQueryData([`/api/stories/uuid/${uuid}`], (old: any) => {
        if (old) {
          return {
            ...old,
            isFavorite: !old.isFavorite
          };
        }
        return old;
      });
      
      return { previousStory };
    },
    onError: (err, storyId, context) => {
      // Revert optimistic update on error
      if (context?.previousStory) {
        queryClient.setQueryData([`/api/stories/uuid/${uuid}`], context.previousStory);
      }
    },
    onSuccess: () => {
      // Minimal cache invalidation - only library queries need refresh
      queryClient.invalidateQueries({ queryKey: [`/api/stories/library`] });
    },
  });

  if (isLoading) {
    return (
      <div className="container-mobile bg-cream min-h-screen">
        <div className="px-6 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="container-mobile bg-cream min-h-screen">
        <div className="px-6 py-8 text-center">
          <h2 className="font-heading text-xl mb-2 text-gray-custom">Story Not Found</h2>
          <p className="mb-6 text-gray-600">We couldn't find the story you're looking for.</p>
          <Button 
            onClick={() => navigate("/")} 
            className="bg-lavender hover:bg-lavender/90 text-white"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-mobile bg-cream min-h-screen">
      {/* Header */}
      <header className="py-3 bg-cream sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-heading text-lavender font-semibold">
            prena tale
          </h1>
        </div>
      </header>
      {/* Main Content */}
      <main className="pb-8 pt-4">
        {/* Page Title */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Force clear cache before navigation
              queryClient.removeQueries({ 
                queryKey: ["/api/users", userId, "recently-read"]
              });
              
              // from 파라미터에 따라 적절한 페이지로 이동
              if (fromPage === 'library') {
                navigate("/library");
              } else if (fromPage === 'create') {
                navigate("/create");
              } else {
                navigate("/");
              }
            }}
            className="p-2 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-custom" />
          </Button>
          <h2 className="text-lg font-heading text-gray-custom font-medium line-clamp-2 leading-tight">
            {story.title}
          </h2>
        </div>
        {/* Hero Image */}
        <div
          className="w-full h-64 bg-cover bg-center rounded-xl mb-4"
          style={{ 
            backgroundImage: story.imageUrl ? `url(${story.imageUrl})` : 'none',
            backgroundColor: story.imageUrl ? 'transparent' : '#f3f4f6'
          }}
        >
          {!story.imageUrl && (
            <div className="w-full h-full flex items-center justify-center text-lavender">
              <BookOpen className="w-16 h-16" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 flex-wrap">
                {story.tags?.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="text-xs text-lavender px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: '#9680c21a' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                <Clock className="w-3 h-3 mr-1" />
                {story.readingTime} min
              </span>
            </div>

            {/* TTS Player - positioned between tags and content */}
            <TTSPlayer
              audioUrl={(language === 'ko' ? story.jisuAudioUrl : story.emmaAudioUrl) || ""}
              title={story.title}
              isUCT={story.type === 'uct'}
            />

            <div className="prose prose-sm max-w-none mb-6">
              {story.content.split(/\n\s*\n/).filter((p: string) => p.trim()).map((paragraph: string, idx: number) => (
                <p 
                  key={idx} 
                  className="mb-4 leading-relaxed text-gray-600"
                >
                  {paragraph.trim()}
                </p>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {story.type === 'uct' 
                  ? story.createdAt ? new Date(story.createdAt).toLocaleDateString('ko-KR') : ''
                  : (story as any).firstReadAt 
                    ? new Date((story as any).firstReadAt).toLocaleDateString('ko-KR')
                    : (story as any).readAt 
                      ? new Date((story as any).readAt).toLocaleDateString('ko-KR')
                      : story.createdAt ? new Date(story.createdAt).toLocaleDateString('ko-KR') : ''
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavoriteMutation.mutate(story.id)}
                className={cn(
                  "p-2 hover:text-lavender rounded-full",
                  (story as any).isFavorite ? "text-lavender" : "text-gray-600"
                )}
                disabled={toggleFavoriteMutation.isPending}
              >
                <Heart 
                  className={cn(
                    "w-5 h-5",
                    toggleFavoriteMutation.isPending && "animate-pulse",
                    (story as any).isFavorite ? "heart-filled" : "heart-empty"
                  )}
                />
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={() => {
              // Always mark as read and navigate back
              if (!(story as any).readAt) {
                markAsReadMutation.mutate(story.id);
              }
              
              // Force clear cache before navigation
              queryClient.removeQueries({ 
                queryKey: ["/api/users", userId, "recently-read"]
              });
              
              // from 파라미터에 따라 적절한 페이지로 이동
              if (fromPage === 'library') {
                navigate("/library");
              } else if (fromPage === 'create') {
                navigate("/create");
              } else {
                navigate("/");
              }
              // 페이지 이동 후 맨 위로 스크롤
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }}
            className="bg-lavender hover:bg-lavender/90 text-white px-8 py-3 rounded-xl font-medium"
          >{t("readMoreStories")}</Button>
        </div>
      </main>
    </div>
  );
}