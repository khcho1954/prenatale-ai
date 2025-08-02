export type Language = 'ko' | 'en';

export const DEFAULT_LANGUAGE: Language = 'en';

export interface LocalizedContent {
  ko: string;
  en: string;
}

export interface LocalizedStory {
  id: number;
  title: LocalizedContent;
  content: LocalizedContent;
  excerpt: LocalizedContent;
  tags: LocalizedContent;
  imageUrl: string | null;
  readingTime: number;
  isDaily: boolean;
  isCreated: boolean;
  status: string;
  createdAt: Date;
  creatorId: string | null;
  jisuAudioUrl: string | null;
  eunwooAudioUrl: string | null;
  emmaAudioUrl: string | null;
  noahAudioUrl: string | null;
}

export function getLocalizedText(content: LocalizedContent, language: Language): string {
  return content[language] || content.ko || content.en || '';
}

export function getLocalizedTags(tags: LocalizedContent, language: Language): string[] {
  const tagString = tags[language] || tags.ko || tags.en || '';
  try {
    return Array.isArray(tagString) ? tagString : JSON.parse(tagString || '[]');
  } catch {
    return [];
  }
}