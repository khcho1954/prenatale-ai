import { BookOpen, Calendar, Heart, Edit3 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";

interface LibraryEmptyStateProps {
  filter: "all" | "today" | "favorites" | "created";
  isAuthenticated: boolean;
}

export function LibraryEmptyState({ filter, isAuthenticated }: LibraryEmptyStateProps) {
  const { t } = useLanguage();
  const { isAuthenticated: authState } = useAuth();

  // Non-authenticated users always see the general empty state
  if (!isAuthenticated || !authState) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-sm w-full text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-medium text-gray-custom mb-2">
            {t("noStoriesYet")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("fillLibraryMessage")}
          </p>
        </div>
      </div>
    );
  }

  // Authenticated users see filter-specific empty states
  const getEmptyStateContent = () => {
    switch (filter) {
      case "all":
        return {
          icon: <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />,
          title: t("noStoriesYet"),
          description: t("fillLibraryMessage"),
        };
      case "today":
        return {
          icon: <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />,
          title: t("noTodayStories"),
          description: t("readTodayStories"),
        };
      case "favorites":
        return {
          icon: <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />,
          title: t("noFavoriteStories"),
          description: t("addFavoriteStories"),
        };
      case "created":
        return {
          icon: <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />,
          title: t("noCreatedStories"),
          description: t("createYourStory"),
        };
      default:
        return {
          icon: <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />,
          title: t("noStoriesYet"),
          description: t("fillLibraryMessage"),
        };
    }
  };

  const { icon, title, description } = getEmptyStateContent();

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-sm w-full text-center">
        {icon}
        <h3 className="text-lg font-heading font-medium text-gray-custom mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {description}
        </p>
      </div>
    </div>
  );
}