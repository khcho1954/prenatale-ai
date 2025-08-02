import { BookOpen, Plus, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { t } = useLanguage();
  
  const tabs = [
    { id: "today", label: t("today"), icon: BookOpen },
    { id: "create", label: t("create"), icon: Plus },
    { id: "library", label: t("library"), icon: Library },
    { id: "mypage", label: t("myPage"), icon: User },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors min-w-0",
              activeTab === tab.id 
                ? "text-lavender" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
