import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface StoryCharacter {
  name: string;
  description: string;
}

interface CharacterSelectorProps {
  selectedCharacter: StoryCharacter | null;
  onCharacterSelect: (character: StoryCharacter) => void;
  disabled?: boolean;
}

const characters: StoryCharacter[] = [
  {
    name: "Create according to story",
    description: "Let the story determine the perfect character"
  },
  {
    name: "Bunny",
    description: "A gentle and curious little rabbit"
  },
  {
    name: "Bear",
    description: "A kind and strong bear cub"
  },
  {
    name: "Fox",
    description: "A clever and friendly fox"
  },
  {
    name: "Bird",
    description: "A cheerful and free-spirited little bird"
  },
  {
    name: "Elephant",
    description: "A wise and caring young elephant"
  }
];

const getCharacterDisplayName = (characterName: string, language: string) => {
  if (language === 'ko') {
    switch (characterName) {
      case "Create according to story":
        return "동화에 맞는 주인공 생성";
      case "Bunny":
        return "토끼";
      case "Bear":
        return "곰";
      case "Fox":
        return "여우";
      case "Bird":
        return "새";
      case "Elephant":
        return "코끼리";
      default:
        return characterName;
    }
  }
  return characterName;
};

const getCharacterDescription = (characterName: string, language: string) => {
  if (language === 'ko') {
    switch (characterName) {
      case "Create according to story":
        return "동화에 맞는 완벽한 주인공을 생성합니다";
      case "Bunny":
        return "순하고 호기심 많은 작은 토끼";
      case "Bear":
        return "친절하고 힘센 아기 곰";
      case "Fox":
        return "영리하고 친근한 여우";
      case "Bird":
        return "활기차고 자유로운 작은 새";
      case "Elephant":
        return "지혜롭고 배려심 깊은 어린 코끼리";
      default:
        return "A wonderful character";
    }
  }
  
  // Return original English descriptions
  const character = characters.find(c => c.name === characterName);
  return character ? character.description : "A wonderful character";
};

export function CharacterSelector({ selectedCharacter, onCharacterSelect, disabled = false }: CharacterSelectorProps) {
  const [useBabyAsCharacter, setUseBabyAsCharacter] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  // Set default character to "Create according to story" if no character is selected
  useEffect(() => {
    if (!selectedCharacter && !useBabyAsCharacter) {
      onCharacterSelect(characters[0]); // Default to "Create according to story"
    }
  }, [selectedCharacter, useBabyAsCharacter, onCharacterSelect]);
  
  const babyName = (user as any)?.babyName || "Baby";

  // Create a character with the baby's name
  const babyCharacter: StoryCharacter = {
    name: babyName,
    description: language === 'ko' ? `사랑스러운 아기 ${babyName}` : `The wonderful baby ${babyName}`
  };

  useEffect(() => {
    // If using baby as character, select the baby character
    if (useBabyAsCharacter) {
      onCharacterSelect(babyCharacter);
    }
    // If not using baby as character and currently selected character is the baby, reset to default
    else if (selectedCharacter?.name === babyName) {
      onCharacterSelect(characters[0]); // Default to "Create according to story"
    }
  }, [useBabyAsCharacter, babyName]);

  const handleChange = (value: string) => {
    // If using baby as character, ignore select changes
    if (useBabyAsCharacter) return;
    
    const character = characters.find(c => c.name === value);
    if (character) {
      onCharacterSelect(character);
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setUseBabyAsCharacter(checked);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-custom">{t("mainCharacter")}:</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-custom">{babyName}</span>
          <Switch 
            checked={useBabyAsCharacter} 
            onCheckedChange={handleToggleChange}
            disabled={disabled}
          />
        </div>
      </div>

      {!useBabyAsCharacter ? (
        <div className="relative">
          <Select onValueChange={handleChange} value={selectedCharacter?.name} disabled={disabled}>
            <SelectTrigger className="w-full p-3 rounded-xl border border-gray-300 font-medium focus:outline-none focus:ring-1 focus:ring-lavender focus:border-lavender">
              <SelectValue placeholder={language === 'ko' ? "주인공을 선택하세요" : "Select a character"} />
            </SelectTrigger>
            <SelectContent>
              {characters.map((character) => (
                <SelectItem key={character.name} value={character.name}>
                  {getCharacterDisplayName(character.name, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="bg-lavender/10 p-3 rounded-xl border border-lavender/20">
          <p className="font-medium text-lavender">{babyName}</p>
          <p className="text-sm text-gray-600 opacity-75">
            {language === 'ko' ? `${babyName}이(가) 주인공으로 등장하는 동화가 만들어집니다` : `The story will feature ${babyName} as the main character`}
          </p>
        </div>
      )}
    </div>
  );
}