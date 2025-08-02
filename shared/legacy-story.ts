import { Language } from "./language";

// Legacy story interface for backwards compatibility
export interface LegacyStory {
  id: number;
  storyUuid?: string; // NEW: UUID for secure story access
  title: string;
  content: string;
  summary: string;
  imageUrl: string | null;
  readingTime: number;
  tags: string[] | null;
  type: string;
  publishedDate: Date;
  createdAt: Date;
  createdBy: number | null;
  jisuAudioUrl: string | null;
  emmaAudioUrl: string | null;
  readAt?: Date | null; // 읽은 날짜 필드 추가
  firstReadAt?: Date | null; // 사용자가 처음 읽은 날짜 (TFT 날짜 표시용)
}

// New story interface matching Supabase structure
export interface SupabaseStory {
  id: number;
  storyUuid?: string; // NEW: UUID for secure story access
  uniqueId: string | null;
  titleKo: string | null;
  titleEn: string | null;
  contentKo: string | null;
  contentEn: string | null;
  excerptKo: string | null;
  excerptEn: string | null;
  tagsKo: string[] | null;
  tagsEn: string[] | null;
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
  readAt?: Date | null; // 읽은 날짜 필드 추가
  firstReadAt?: Date | null; // 사용자가 처음 읽은 날짜 (TFT 날짜 표시용)
}



// Convert Supabase story to legacy format for current UI
export function convertToLegacyStory(story: SupabaseStory, language: Language = 'ko'): LegacyStory {
  // Use database id (number) for all story operations (reading progress, favorites, etc.)
  const databaseId = typeof story.id === 'string' ? parseInt(story.id) : story.id;
  
  // Generate image URL from Supabase storage
  // Use database image_url if available, otherwise fallback to unique_id pattern
  const supabaseUrl = 'https://pcnfcirqviujhynufafr.supabase.co';
  let imageUrl = null;
  
  if (story.imageUrl) {
    // Database has stored image path, use it directly
    if (story.imageUrl.startsWith('https://')) {
      // Full URL already stored in database
      imageUrl = story.imageUrl;
    } else if (story.imageUrl.startsWith('images/')) {
      // Relative path stored in database, construct full URL
      imageUrl = `${supabaseUrl}/storage/v1/object/public/${story.imageUrl}`;
    } else {
      // Just unique_id stored, construct full image path
      imageUrl = `${supabaseUrl}/storage/v1/object/public/images/${story.imageUrl}`;
    }
  }
  
  // Generate audio URLs from database stored paths (use actual database audio_url fields)
  const jisuAudioUrl = story.jisuAudioUrl ? 
    `${supabaseUrl}/storage/v1/object/public/${story.jisuAudioUrl}` : 
    null;
  const emmaAudioUrl = story.emmaAudioUrl ? 
    `${supabaseUrl}/storage/v1/object/public/${story.emmaAudioUrl}` : 
    null;
  
  return {
    id: databaseId,  // Use database id as number for all operations
    storyUuid: story.storyUuid, // NEW: Include UUID for secure story access
    title: (language === 'ko' ? story.titleKo : story.titleEn) || story.titleKo || story.titleEn || '',
    content: (language === 'ko' ? story.contentKo : story.contentEn) || story.contentKo || story.contentEn || '',
    summary: (language === 'ko' ? story.excerptKo : story.excerptEn) || story.excerptKo || story.excerptEn || '',
    imageUrl,
    readingTime: story.readingTime || 5,
    tags: (() => {
      const tagsString = (language === 'ko' ? story.tagsKo : story.tagsEn) || story.tagsKo || story.tagsEn;
      if (!tagsString) return null;
      
      // If tags is already an array, return it
      if (Array.isArray(tagsString)) return tagsString;
      
      // If tags is a JSON string, parse it
      if (typeof tagsString === 'string') {
        try {
          const parsed = JSON.parse(tagsString);
          return Array.isArray(parsed) ? parsed : null;
        } catch (e) {
          // If parsing fails, treat as single tag
          return [tagsString];
        }
      }
      
      return null;
    })(),
    type: story.isCreated ? 'uct' : 'tft',
    publishedDate: story.createdAt,
    createdAt: story.createdAt,
    createdBy: story.creatorId ? parseInt(story.creatorId) : null,
    jisuAudioUrl,
    emmaAudioUrl,
    readAt: story.readAt || null, // 읽은 날짜 정보 포함
    firstReadAt: story.firstReadAt || null, // 처음 읽은 날짜 정보 포함
  };
}