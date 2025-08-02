// Gemini API 병렬처리 및 큐 관리 시스템
import { GoogleGenAI } from "@google/genai";

interface QueueItem {
  id: string;
  type: 'story' | 'image';
  params: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
  createdAt: Date;
}

class GeminiPool {
  private ai: GoogleGenAI;
  private storyQueue: QueueItem[] = [];
  private imageQueue: QueueItem[] = [];
  private activeStoryRequests = 0;
  private activeImageRequests = 0;
  
  // 동시 처리 제한 (Gemini API 제한 고려)
  private readonly MAX_STORY_CONCURRENT = 10;  // 동시 스토리 생성
  private readonly MAX_IMAGE_CONCURRENT = 5;   // 동시 이미지 생성
  private readonly STORY_TIMEOUT = 60000;      // 60초 타임아웃
  private readonly IMAGE_TIMEOUT = 180000;     // 3분 타임아웃

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    
    // 주기적으로 큐 처리
    setInterval(() => this.processQueues(), 1000);
    
    console.log(`🚀 Gemini Pool initialized - Story slots: ${this.MAX_STORY_CONCURRENT}, Image slots: ${this.MAX_IMAGE_CONCURRENT}`);
  }

  // 스토리 생성 요청 (병렬처리)
  async generateStory(params: any, priority: number = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem = {
        id: `story-${Date.now()}-${Math.random()}`,
        type: 'story',
        params,
        resolve,
        reject,
        priority,
        createdAt: new Date()
      };

      // 우선순위에 따라 정렬하여 삽입
      this.insertByPriority(this.storyQueue, queueItem);
      console.log(`📝 Story generation queued: ${queueItem.id} (priority: ${priority}, queue length: ${this.storyQueue.length})`);
    });
  }

  // 이미지 생성 요청 (병렬처리)
  async generateImage(params: any, priority: number = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem = {
        id: `image-${Date.now()}-${Math.random()}`,
        type: 'image',
        params,
        resolve,
        reject,
        priority,
        createdAt: new Date()
      };

      this.insertByPriority(this.imageQueue, queueItem);
      console.log(`🎨 Image generation queued: ${queueItem.id} (priority: ${priority}, queue length: ${this.imageQueue.length})`);
    });
  }

  // 스토리와 이미지 동시 생성 (완전 병렬처리)
  async generateStoryWithImage(storyParams: any, imageParams: any): Promise<{ story: any, image: any }> {
    console.log('🚀 Starting parallel story + image generation');
    
    const startTime = Date.now();
    
    // 동시에 두 작업 시작
    const [story, image] = await Promise.allSettled([
      this.generateStory(storyParams, 1), // 높은 우선순위
      this.generateImage(imageParams, 1)  // 높은 우선순위
    ]);

    const duration = Date.now() - startTime;
    console.log(`⚡ Parallel generation completed in ${duration}ms`);

    return {
      story: story.status === 'fulfilled' ? story.value : null,
      image: image.status === 'fulfilled' ? image.value : null
    };
  }

  // 우선순위에 따른 큐 삽입
  private insertByPriority(queue: QueueItem[], item: QueueItem) {
    const index = queue.findIndex(q => q.priority < item.priority);
    if (index === -1) {
      queue.push(item);
    } else {
      queue.splice(index, 0, item);
    }
  }

  // 큐 처리 메인 루프
  private async processQueues() {
    // 스토리 큐 처리
    while (this.storyQueue.length > 0 && this.activeStoryRequests < this.MAX_STORY_CONCURRENT) {
      const item = this.storyQueue.shift()!;
      this.processStoryItem(item);
    }

    // 이미지 큐 처리
    while (this.imageQueue.length > 0 && this.activeImageRequests < this.MAX_IMAGE_CONCURRENT) {
      const item = this.imageQueue.shift()!;
      this.processImageItem(item);
    }
  }

  // 개별 스토리 처리 (실제 generateStory 함수 사용)
  private async processStoryItem(item: QueueItem) {
    this.activeStoryRequests++;
    
    try {
      console.log(`📝 Processing story: ${item.id} (active: ${this.activeStoryRequests}/${this.MAX_STORY_CONCURRENT})`);
      
      // 실제 generateStory 함수 사용 (gemini.ts에서 import)
      const { generateStory } = await import("./gemini");
      
      // 타임아웃과 함께 처리
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Story generation timeout: ${item.id}`)), this.STORY_TIMEOUT);
      });

      const result = await Promise.race([
        generateStory(item.params),
        timeoutPromise
      ]);

      item.resolve(result);
      console.log(`✅ Story completed: ${item.id}`);
      
    } catch (error) {
      console.error(`❌ Story failed: ${item.id}`, error);
      item.reject(error);
    } finally {
      this.activeStoryRequests--;
    }
  }

  // 개별 이미지 처리 (실제 generateStoryIllustration 함수 사용)
  private async processImageItem(item: QueueItem) {
    this.activeImageRequests++;
    
    try {
      console.log(`🎨 Processing image: ${item.id} (active: ${this.activeImageRequests}/${this.MAX_IMAGE_CONCURRENT})`);
      
      // 실제 generateStoryIllustration 함수 사용
      const { generateStoryIllustration } = await import("./gemini");
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Image generation timeout: ${item.id}`)), this.IMAGE_TIMEOUT);
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
      console.log(`✅ Image completed: ${item.id}`);
      
    } catch (error) {
      console.error(`❌ Image failed: ${item.id}`, error);
      item.reject(error);
    } finally {
      this.activeImageRequests--;
    }
  }

  // 상태 조회
  getPoolStatus() {
    return {
      story: {
        active: this.activeStoryRequests,
        max: this.MAX_STORY_CONCURRENT,
        queued: this.storyQueue.length,
        available: this.MAX_STORY_CONCURRENT - this.activeStoryRequests
      },
      image: {
        active: this.activeImageRequests,
        max: this.MAX_IMAGE_CONCURRENT,
        queued: this.imageQueue.length,
        available: this.MAX_IMAGE_CONCURRENT - this.activeImageRequests
      },
      total: {
        activeRequests: this.activeStoryRequests + this.activeImageRequests,
        queuedRequests: this.storyQueue.length + this.imageQueue.length
      }
    };
  }

  // 큐 정리 (오래된 요청 제거)
  cleanupQueues() {
    const now = new Date();
    const maxAge = 10 * 60 * 1000; // 10분

    const cleanQueue = (queue: QueueItem[]) => {
      const oldLength = queue.length;
      for (let i = queue.length - 1; i >= 0; i--) {
        if (now.getTime() - queue[i].createdAt.getTime() > maxAge) {
          const item = queue.splice(i, 1)[0];
          item.reject(new Error('Request expired'));
        }
      }
      return oldLength - queue.length;
    };

    const storyCleanCount = cleanQueue(this.storyQueue);
    const imageCleanCount = cleanQueue(this.imageQueue);

    if (storyCleanCount > 0 || imageCleanCount > 0) {
      console.log(`🧹 Cleaned up expired requests - Stories: ${storyCleanCount}, Images: ${imageCleanCount}`);
    }
  }
}

// 글로벌 풀 인스턴스
export const geminiPool = new GeminiPool(process.env.GEMINI_API_KEY || "");

// 주기적으로 큐 정리 (5분마다)
setInterval(() => {
  geminiPool.cleanupQueues();
}, 5 * 60 * 1000);