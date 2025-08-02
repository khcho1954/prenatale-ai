/**
 * 🚀 Gemini API 병렬처리 시스템
 * 
 * 안전성과 성능을 위한 고급 병렬처리 구현
 * - 스토리와 이미지 동시 생성
 * - 큐 기반 요청 관리
 * - 타임아웃 및 오류 처리
 * - 리소스 제한 및 모니터링
 */

import { GoogleGenAI } from "@google/genai";

// 병렬처리 설정
const PARALLEL_CONFIG = {
  // 동시 요청 제한 (스토리와 이미지 동일하게 설정)
  MAX_STORY_CONCURRENT: 20,  // 스토리 20개 동시 처리
  MAX_IMAGE_CONCURRENT: 20,  // 이미지 20개 동시 처리 (병목현상 방지)
  
  // 타임아웃 설정 (밀리초) - 안정성을 위해 증가
  STORY_TIMEOUT: 150000, // 2.5분 (더 많은 요청 처리로 인한 여유)
  IMAGE_TIMEOUT: 200000, // 3.3분
  
  // 큐 크기 대폭 확장
  MAX_QUEUE_SIZE: 100,   // 20 → 100개로 확장
  
  // 재시도 설정 (안정성 유지)
  MAX_RETRIES: 3,        // 2 → 3회로 증가
  RETRY_DELAY: 2000,     // 1초 → 2초 (부하 분산)
};

// 요청 타입 정의
interface QueueItem {
  id: string;
  type: 'story' | 'image';
  params: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retryCount: number;
}

// 병렬처리 관리자 클래스
class GeminiParallelProcessor {
  private ai: GoogleGenAI;
  private storyQueue: QueueItem[] = [];
  private imageQueue: QueueItem[] = [];
  private activeStoryRequests = 0;
  private activeImageRequests = 0;
  private isProcessing = false;
  
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("🚀 Gemini 병렬처리 시스템 초기화 완료");
  }
  
  /**
   * 스토리 생성 요청 추가
   */
  async generateStory(params: any): Promise<any> {
    return this.addToQueue('story', params);
  }
  
  /**
   * 이미지 생성 요청 추가
   */
  async generateImage(params: any): Promise<any> {
    return this.addToQueue('image', params);
  }
  
  /**
   * 큐에 요청 추가
   */
  private async addToQueue(type: 'story' | 'image', params: any): Promise<any> {
    // 큐 크기 확인
    const currentQueue = type === 'story' ? this.storyQueue : this.imageQueue;
    if (currentQueue.length >= PARALLEL_CONFIG.MAX_QUEUE_SIZE) {
      throw new Error(`${type} queue is full (${PARALLEL_CONFIG.MAX_QUEUE_SIZE} items)`);
    }
    
    return new Promise((resolve, reject) => {
      const item: QueueItem = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        params,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0
      };
      
      if (type === 'story') {
        this.storyQueue.push(item);
      } else {
        this.imageQueue.push(item);
      }
      
      console.log(`📝 ${type} 요청 큐에 추가: ${item.id} (큐 크기: ${currentQueue.length + 1})`);
      
      // 처리 시작
      this.processQueue();
    });
  }
  
  /**
   * 큐 처리 메인 로직
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    try {
      // 스토리 처리
      while (
        this.storyQueue.length > 0 && 
        this.activeStoryRequests < PARALLEL_CONFIG.MAX_STORY_CONCURRENT
      ) {
        const item = this.storyQueue.shift()!;
        this.processStoryItem(item);
      }
      
      // 이미지 처리
      while (
        this.imageQueue.length > 0 && 
        this.activeImageRequests < PARALLEL_CONFIG.MAX_IMAGE_CONCURRENT
      ) {
        const item = this.imageQueue.shift()!;
        this.processImageItem(item);
      }
      
    } finally {
      this.isProcessing = false;
      
      // 큐에 남은 작업이 있으면 다시 처리
      if (this.storyQueue.length > 0 || this.imageQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }
  
  /**
   * 개별 스토리 처리
   */
  private async processStoryItem(item: QueueItem) {
    this.activeStoryRequests++;
    
    try {
      console.log(`📝 스토리 처리 시작: ${item.id} (활성: ${this.activeStoryRequests}/${PARALLEL_CONFIG.MAX_STORY_CONCURRENT})`);
      
      // 실제 generateStory 함수 import
      const { generateStory } = await import("./gemini");
      
      // 타임아웃 처리
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Story generation timeout: ${item.id}`)), PARALLEL_CONFIG.STORY_TIMEOUT);
      });
      
      const result = await Promise.race([
        generateStory(item.params),
        timeoutPromise
      ]);
      
      item.resolve(result);
      console.log(`✅ 스토리 완료: ${item.id} (소요 시간: ${Date.now() - item.timestamp}ms)`);
      
    } catch (error) {
      console.error(`❌ 스토리 실패: ${item.id}`, error);
      
      // 재시도 로직
      if (item.retryCount < PARALLEL_CONFIG.MAX_RETRIES) {
        item.retryCount++;
        console.log(`🔄 스토리 재시도 ${item.retryCount}/${PARALLEL_CONFIG.MAX_RETRIES}: ${item.id}`);
        
        setTimeout(() => {
          this.storyQueue.unshift(item); // 큐 앞쪽에 다시 추가
          this.processQueue();
        }, PARALLEL_CONFIG.RETRY_DELAY * item.retryCount);
      } else {
        item.reject(error);
      }
    } finally {
      this.activeStoryRequests--;
    }
  }
  
  /**
   * 개별 이미지 처리
   */
  private async processImageItem(item: QueueItem) {
    this.activeImageRequests++;
    
    try {
      console.log(`🎨 이미지 처리 시작: ${item.id} (활성: ${this.activeImageRequests}/${PARALLEL_CONFIG.MAX_IMAGE_CONCURRENT})`);
      console.log(`📝 사용할 이미지 프롬프트: ${item.params.imagePrompt}`);
      
      // 실제 generateStoryIllustration 함수 import
      const { generateStoryIllustration } = await import("./gemini");
      
      // 타임아웃 처리
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Image generation timeout: ${item.id}`)), PARALLEL_CONFIG.IMAGE_TIMEOUT);
      });
      
      const result = await Promise.race([
        generateStoryIllustration(
          item.params.title,
          item.params.content,
          item.params.theme,
          item.params.imagePrompt
        ),
        timeoutPromise
      ]);
      
      item.resolve(result);
      console.log(`✅ 이미지 완료: ${item.id} (소요 시간: ${Date.now() - item.timestamp}ms)`);
      
    } catch (error) {
      console.error(`❌ 이미지 실패: ${item.id}`, error);
      
      // 재시도 로직
      if (item.retryCount < PARALLEL_CONFIG.MAX_RETRIES) {
        item.retryCount++;
        console.log(`🔄 이미지 재시도 ${item.retryCount}/${PARALLEL_CONFIG.MAX_RETRIES}: ${item.id}`);
        
        setTimeout(() => {
          this.imageQueue.unshift(item); // 큐 앞쪽에 다시 추가
          this.processQueue();
        }, PARALLEL_CONFIG.RETRY_DELAY * item.retryCount);
      } else {
        // 이미지 실패는 치명적이지 않음 - null 반환
        console.log(`🎨 이미지 생성 실패, 스토리만 생성: ${item.id}`);
        item.resolve(null);
      }
    } finally {
      this.activeImageRequests--;
    }
  }
  
  /**
   * 시스템 상태 조회
   */
  getStatus() {
    return {
      storyQueue: this.storyQueue.length,
      imageQueue: this.imageQueue.length,
      activeStoryRequests: this.activeStoryRequests,
      activeImageRequests: this.activeImageRequests,
      isProcessing: this.isProcessing,
      maxConcurrent: {
        story: PARALLEL_CONFIG.MAX_STORY_CONCURRENT,
        image: PARALLEL_CONFIG.MAX_IMAGE_CONCURRENT
      }
    };
  }
  
  /**
   * 동시 스토리+이미지 생성 (고급 기능)
   */
  async generateStoryWithImage(storyParams: any, imageParams: any): Promise<{story: any, image: any}> {
    console.log("🚀 동시 스토리+이미지 생성 시작");
    
    try {
      // 두 작업을 동시에 시작
      const [storyResult, imageResult] = await Promise.allSettled([
        this.generateStory(storyParams),
        
        // 이미지는 스토리 생성 후 업데이트된 정보로 다시 생성 가능하도록 지연
        (async () => {
          // 2초 지연 후 이미지 생성 (스토리가 어느정도 진행되길 기다림)
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.generateImage(imageParams);
        })()
      ]);
      
      // 결과 처리
      const story = storyResult.status === 'fulfilled' ? storyResult.value : null;
      const image = imageResult.status === 'fulfilled' ? imageResult.value : null;
      
      if (!story) {
        throw new Error("Story generation failed");
      }
      
      console.log("✅ 동시 생성 완료", {
        storySuccess: !!story,
        imageSuccess: !!image
      });
      
      return { story, image };
      
    } catch (error) {
      console.error("❌ 동시 생성 실패:", error);
      throw error;
    }
  }
  
  /**
   * 리소스 정리
   */
  cleanup() {
    this.storyQueue = [];
    this.imageQueue = [];
    this.activeStoryRequests = 0;
    this.activeImageRequests = 0;
    this.isProcessing = false;
    console.log("🧹 Gemini 병렬처리 시스템 정리 완료");
  }
}

// 전역 인스턴스 (싱글톤)
let globalProcessor: GeminiParallelProcessor | null = null;

/**
 * 병렬처리 인스턴스 가져오기
 */
export function getParallelProcessor(): GeminiParallelProcessor {
  if (!globalProcessor) {
    globalProcessor = new GeminiParallelProcessor();
  }
  return globalProcessor;
}

/**
 * 병렬처리 시스템 초기화 (서버 시작시 호출)
 */
export function initializeParallelProcessor() {
  console.log("🔧 Gemini 병렬처리 시스템 초기화 중...");
  getParallelProcessor();
  console.log("✅ Gemini 병렬처리 시스템 준비 완료");
}

/**
 * 시스템 상태 확인 (모니터링용)
 */
export function getParallelProcessorStatus() {
  return globalProcessor ? globalProcessor.getStatus() : null;
}

export { PARALLEL_CONFIG };