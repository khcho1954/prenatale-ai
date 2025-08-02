/**
 * Timezone detection utilities for non-authenticated users
 */

export function detectUserTimezone(): string {
  try {
    // Intl.DateTimeFormat으로 가장 신뢰할 수 있는 탐지
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (detectedTimezone && detectedTimezone.includes('/')) {
      console.log('Auto-detected timezone:', detectedTimezone);
      return detectedTimezone;
    }
  } catch (error) {
    console.error('Timezone detection failed:', error);
  }
  
  // 기본값으로 Asia/Seoul 사용
  console.log('Using fallback timezone: Asia/Seoul');
  return 'Asia/Seoul';
}

export function getTodayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    // 특정 timezone의 현재 날짜 가져오기
    const localDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    return localDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('Invalid timezone:', timezone, error);
    // 유효하지 않은 timezone일 경우 Asia/Seoul로 fallback
    const fallbackDate = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    return fallbackDate.toISOString().split('T')[0];
  }
}

// 공통 timezone 목록
export const COMMON_TIMEZONES = [
  { value: "Asia/Seoul", label: "Seoul (KST, GMT+9)" },
  { value: "America/New_York", label: "New York (EST/EDT, GMT-5/-4)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT, GMT-8/-7)" },
  { value: "Europe/London", label: "London (GMT/BST, GMT+0/+1)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST, GMT+1/+2)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST, GMT+9)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST, GMT+8)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT, GMT+10/+11)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT, GMT-6/-5)" },
  { value: "America/Denver", label: "Denver (MST/MDT, GMT-7/-6)" },
];