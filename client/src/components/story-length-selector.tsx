import { useState } from "react";
import { Clock, BookOpen, Layers } from "lucide-react";

export interface StoryLength {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  bytes: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StoryLengthSelectorProps {
  selectedLength: StoryLength | null;
  onLengthSelect: (length: StoryLength) => void;
  disabled?: boolean;
  language?: string;
}

export const storyLengths: Record<string, StoryLength[]> = {
  ko: [
    {
      id: "short",
      name: "간결한",
      description: "빠르게 읽을 수 있는 짧은 이야기",
      estimatedTime: "2-3분",
      bytes: "3,000-4,000 byte",
      icon: Clock,
    },
    {
      id: "medium",
      name: "중간길이",
      description: "적절한 분량의 완성도 있는 이야기",
      estimatedTime: "4-5분",
      bytes: "5,000-6,000 byte",
      icon: BookOpen,
    },
    {
      id: "long",
      name: "긴 동화",
      description: "깊이 있고 풍성한 내용의 이야기",
      estimatedTime: "7-8분",
      bytes: "6,000-8,000 byte",
      icon: Layers,
    },
  ],
  en: [
    {
      id: "short",
      name: "Short",
      description: "Quick and engaging short tale",
      estimatedTime: "2-3 min",
      bytes: "3,000-4,000 bytes",
      icon: Clock,
    },
    {
      id: "medium",
      name: "Medium",
      description: "Well-balanced complete story",
      estimatedTime: "4-5 min",
      bytes: "5,000-6,000 bytes",
      icon: BookOpen,
    },
    {
      id: "long",
      name: "Long",
      description: "Rich and detailed narrative",
      estimatedTime: "7-8 min",
      bytes: "6,000-8,000 bytes",
      icon: Layers,
    },
  ],
};

export function StoryLengthSelector({
  selectedLength,
  onLengthSelect,
  disabled = false,
  language = "en",
}: StoryLengthSelectorProps) {
  const lengths = storyLengths[language] || storyLengths.en;

  return (
    <div className="space-y-3">
      <label
        className="text-gray-custom font-medium mb-3 block text-[14px]"
        style={{ fontFamily: "'Open Sans', sans-serif" }}
      >
        {language === "ko" ? "동화 길이:" : "Story Length:"}
      </label>
      
      {/* Timeline-style selector */}
      <div className="relative bg-gray-50 rounded-lg p-4 border border-gray-100">
        {/* Continuous timeline line */}
        <div className="relative mx-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 -translate-y-1/2"></div>
          
          {/* Points container with margin */}
          <div className="flex justify-between items-center relative">
            {lengths.map((length, index) => {
              const isSelected = selectedLength?.id === length.id;
              
              return (
                <button
                  key={length.id}
                  onClick={() => !disabled && onLengthSelect(length)}
                  disabled={disabled}
                  className={`
                    relative w-4 h-4 rounded-full border-2 transition-all duration-200 z-10
                    ${isSelected
                      ? "border-lavender bg-lavender scale-125"
                      : "border-gray-400 bg-white hover:border-lavender hover:bg-lavender/10"
                    }
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Time indicators below points with margin */}
        <div className="flex justify-between text-xs text-gray-400 mt-2 mx-4">
          <span>{language === "ko" ? "2-3분" : "2-3 min"}</span>
          <span>{language === "ko" ? "4-5분" : "4-5 min"}</span>
          <span>{language === "ko" ? "7-8분" : "7-8 min"}</span>
        </div>
      </div>
    </div>
  );
}