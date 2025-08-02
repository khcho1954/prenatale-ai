import { Heart, Leaf, Smile, Sparkles, Sun, Star } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface StoryTheme {
  name: string;
  description: string;
  icon: string;
}

interface ThemeSelectorProps {
  selectedTheme: StoryTheme | null;
  onThemeSelect: (theme: StoryTheme) => void;
  disabled?: boolean;
}

const themes: StoryTheme[] = [
  {
    name: "Love & Care",
    icon: "heart",
    description: "Love, consideration, care, friendship, and warm feelings",
  },
  {
    name: "Nature",
    icon: "leaf",
    description:
      "Connection, friendship, harmony, love, adventure, and mystical experiences with nature, animals, and plants",
  },
  {
    name: "Emotions",
    icon: "smile",
    description:
      "Various emotions that benefit a young child's emotional well-being and are important for them to learn",
  },
  {
    name: "Imagination",
    icon: "sparkles",
    description:
      "Imaginative settings, characters, events, and experiences that captivate both children and adults alike. These encompass exciting adventures, new discoveries, mysterious narratives, and beyond",
  },
  {
    name: "Growth",
    icon: "sun",
    description:
      "Stories about personal growth, self-discovery, building confidence, and learning important life lessons through challenges and achievements",
  },
  {
    name: "Rec'd",
    icon: "star",
    description:
      "Create a story that inspires a young child's imagination and imparts important life values. Carefully select a message, develop appropriate characters and structure, and use engaging storytelling methods to ensure the story is both immersive and well-crafted.",
  },
];

const getThemeIcon = (iconName: string) => {
  switch (iconName) {
    case "heart":
      return Heart;
    case "leaf":
      return Leaf;
    case "smile":
      return Smile;
    case "sparkles":
      return Sparkles;
    case "sun":
      return Sun;
    case "star":
      return Star;
    default:
      return Heart;
  }
};

const getThemeDisplayName = (themeName: string, language: string) => {
  if (language === "ko") {
    switch (themeName) {
      case "Love & Care":
        return "사랑과 배려";
      case "Nature":
        return "자연";
      case "Emotions":
        return "감정과 교감";
      case "Imagination":
        return "상상과 모험";
      case "Growth":
        return "성장";
      case "Rec'd":
        return "추천";
      default:
        return themeName;
    }
  }
  return themeName;
};

const getThemeColor = (themeName: string) => {
  switch (themeName) {
    case "Love & Care":
      return "text-[#FFB6A3]"; // coral
    case "Nature":
      return "text-[#7CC39F]"; // soft green
    case "Emotions":
      return "text-[#E6C074]"; // golden yellow
    case "Imagination":
      return "text-[#8E7CC3]"; // lavender
    case "Growth":
      return "text-[#5CBDB9]"; // mint
    case "Rec'd":
      return "text-[#8E7CC3]"; // lavender
    default:
      return "text-lavender";
  }
};

export function ThemeSelector({
  selectedTheme,
  onThemeSelect,
  disabled = false,
}: ThemeSelectorProps) {
  const { language } = useLanguage();

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map((theme) => {
        const IconComponent = getThemeIcon(theme.icon);
        const isSelected = selectedTheme?.name === theme.name;
        const displayName = getThemeDisplayName(theme.name, language);

        return (
          <button
            key={theme.name}
            type="button"
            onClick={() => onThemeSelect(theme)}
            disabled={disabled}
            className={`p-3 rounded-xl border-2 transition text-center h-24 flex flex-col items-center justify-center ${
              isSelected
                ? "border-lavender bg-lavender/5"
                : "border-gray-200 hover:border-lavender/50"
            } ${disabled && "opacity-50 cursor-not-allowed"}`}
          >
            <IconComponent
              className={`w-6 h-6 mb-1 ${isSelected ? "text-lavender" : getThemeColor(theme.name)}`}
            />
            <p className="text-xs text-gray-custom font-medium">
              {displayName}
            </p>
          </button>
        );
      })}
    </div>
  );
}
