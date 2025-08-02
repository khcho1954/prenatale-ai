import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Heart, HeartOff } from "lucide-react";
import type { LegacyStory } from "@shared/legacy-story";

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const userId = user?.id || 1;
  
  const { data: story, isLoading } = useQuery<LegacyStory>({
    queryKey: ["/api/stories", id],
    enabled: !!id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!id || !userId) throw new Error("Missing story ID or user ID");
      
      return apiRequest("POST", "/api/reading-progress", {
        userId,
        storyId: parseInt(id.replace(/\D/g, '')), // Extract numeric ID
        isRead: true,
        isFavorite: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "recently-read"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "weekly-reading"] });
    },
    onError: (error) => {
      console.error("Failed to mark story as read:", error);
    },
  });

  // Auto-mark as read when page loads and story data is available
  useEffect(() => {
    if (story && id && userId) {
      markAsReadMutation.mutate();
    }
  }, [story, id, userId]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!id || !userId) throw new Error("Missing story ID or user ID");
      
      return apiRequest("POST", "/api/reading-progress/toggle-favorite", {
        userId,
        storyId: parseInt(id.replace(/\D/g, '')), // Extract numeric ID
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "recently-read"] });
      toast({
        title: t("favorite"),
        description: t("favoriteUpdated"),
      });
    },
    onError: (error) => {
      console.error("Failed to toggle favorite:", error);
      toast({
        title: t("error"),
        description: t("favoriteUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = () => {
    markAsReadMutation.mutate();
  };

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate();
  };

  const handleGoBack = () => {
    setLocation("/");
  };

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

  if (!story) {
    return (
      <div className="container-mobile bg-cream min-h-screen">
        <div className="px-6 py-4">
          <div className="text-center">
            <h2 className="text-xl font-heading mb-2">Story not found</h2>
            <p className="text-gray-600 mb-4">The story you're looking for doesn't exist.</p>
            <Button onClick={handleGoBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-mobile bg-cream min-h-screen">
      {/* Header */}
      <header className="py-3 bg-cream sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToggleFavorite}>
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 pt-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Story Image */}
          {story.imageUrl && (
            <div className="h-48 bg-gray-200 rounded-xl overflow-hidden mb-4">
              <img 
                src={story.imageUrl} 
                alt={story.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Story Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-heading font-semibold text-gray-custom mb-2">
              {story.title}
            </h1>
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <Clock className="w-4 h-4 mr-1" />
              {story.readingTime} min read
            </div>
          </div>

          {/* Story Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {story.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs text-lavender px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: '#9680c21a' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Story Content */}
          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleMarkAsRead}
              disabled={markAsReadMutation.isPending}
              className="flex-1 bg-lavender text-white hover:bg-lavender/90"
            >
              {markAsReadMutation.isPending ? "Marking..." : "Mark as Read"}
            </Button>
            <Button
              onClick={handleToggleFavorite}
              variant="outline"
              disabled={toggleFavoriteMutation.isPending}
              className="px-4"
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}