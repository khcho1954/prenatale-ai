import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Bell, BookOpen, Clock, Heart, Edit3 } from "lucide-react";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ThemeSelector } from "@/components/theme-selector";
import { CharacterSelector } from "@/components/character-selector";
import { StoryLengthSelector, type StoryLength } from "@/components/story-length-selector";
import { LoginModal } from "@/components/login-modal";
import { PrenaPlanModal } from "@/components/prena-plan-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";

interface StoryTheme {
  name: string;
  description: string;
}

interface StoryCharacter {
  name: string;
  description: string;
}

export default function Create() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("create");
  const { user, isAuthenticated, isLoading, hasPrenaPlan } = useAuth();
  const { t } = useLanguage();

  const [selectedTheme, setSelectedTheme] = useState<StoryTheme | null>(null);
  const [selectedCharacter, setSelectedCharacter] =
    useState<StoryCharacter | null>({
      name: "Create according to story",
      description: "Let the story determine the perfect character",
    });
  // Set default story length to medium
  const [selectedLength, setSelectedLength] = useState<StoryLength | null>({
    id: "medium",
    name: "중간길이",
    description: "적절한 분량의 완성도 있는 이야기",
    estimatedTime: "4-5분",
    bytes: "5,000-6,000 byte",
    icon: BookOpen,
  });
  const [personalMessage, setPersonalMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [progressInterval, setProgressInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [hasJustCreated, setHasJustCreated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPrenaPlanModal, setShowPrenaPlanModal] = useState(false);

  // Constants for localStorage keys - moved outside component for better performance
  const GENERATION_STATE_KEY = useMemo(() => "storyGenerationState", []);
  const GENERATION_TIMEOUT = useMemo(() => 5 * 60 * 1000, []); // 5 minutes

  // Cleanup function
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState("");

  // Optimized queries - only fetch when needed
  const queryEnabled = useMemo(
    () => isAuthenticated && !isLoading,
    [isAuthenticated, isLoading],
  );

  // Check if user can create today
  const { data: canCreateStatus, isLoading: isLoadingCanCreate } = useQuery<{
    canCreate: boolean;
    hasCreatedToday: boolean;
  }>({
    queryKey: ["/api/stories/can-create-today"],
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get recent created stories - only fetch if user has created today
  const { data: recentCreations = [], isLoading: isLoadingCreations } =
    useQuery<any[]>({
      queryKey: ["/api/stories/created"],
      enabled: queryEnabled && canCreateStatus?.hasCreatedToday,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });

  // Memoized computed values
  const canCreateToday = useMemo(
    () => canCreateStatus?.canCreate === true,
    [canCreateStatus?.canCreate],
  );
  const hasCreatedToday = useMemo(
    () => canCreateStatus?.hasCreatedToday === true,
    [canCreateStatus?.hasCreatedToday],
  );
  const isDataLoading = useMemo(
    () => isLoading || isLoadingCanCreate || isLoadingCreations,
    [isLoading, isLoadingCanCreate, isLoadingCreations],
  );

  // Reset hasJustCreated when canCreateStatus changes (new day)
  useEffect(() => {
    if (canCreateStatus?.canCreate === true) {
      setHasJustCreated(false);
    }
  }, [canCreateStatus?.canCreate]);

  // Memoized localStorage functions to prevent re-creation on every render
  const saveGenerationState = useCallback(
    (state: {
      isGenerating: boolean;
      progress: number;
      status: string;
      startTime: number;
      theme?: StoryTheme;
      character?: StoryCharacter;
      length?: StoryLength;
      message?: string;
    }) => {
      try {
        localStorage.setItem(GENERATION_STATE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Error saving generation state:", error);
      }
    },
    [GENERATION_STATE_KEY],
  );

  const loadGenerationState = useCallback(() => {
    try {
      const stored = localStorage.getItem(GENERATION_STATE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        const now = Date.now();

        // Check if state is still valid (within 5 minutes)
        if (state.isGenerating && now - state.startTime < GENERATION_TIMEOUT) {
          return state;
        } else {
          // Clear expired state
          localStorage.removeItem(GENERATION_STATE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading generation state:", error);
      localStorage.removeItem(GENERATION_STATE_KEY);
    }
    return null;
  }, [GENERATION_STATE_KEY, GENERATION_TIMEOUT]);

  const clearGenerationState = useCallback(() => {
    try {
      localStorage.removeItem(GENERATION_STATE_KEY);
    } catch (error) {
      console.error("Error clearing generation state:", error);
    }
  }, [GENERATION_STATE_KEY]);

  // Load persisted state on component mount - memoized to prevent re-runs
  useEffect(() => {
    // Only load generation state if user hasn't created today's story
    if (!hasCreatedToday) {
      const savedState = loadGenerationState();
      if (savedState) {
        setIsGenerating(true);
        setGenerationProgress(savedState.progress);
        setGenerationStatus(savedState.status);
        setGenerationStartTime(savedState.startTime);

        // Restore form state if available
        if (savedState.theme) setSelectedTheme(savedState.theme);
        if (savedState.character) setSelectedCharacter(savedState.character);
        if (savedState.length) setSelectedLength(savedState.length);
        if (savedState.message) setPersonalMessage(savedState.message);

        // Resume progress simulation
        const elapsed = Date.now() - savedState.startTime;
        const remainingTime = GENERATION_TIMEOUT - elapsed;

        if (remainingTime > 0) {
          // Continue progress simulation from where it left off
          const interval = simulateProgressFromState(
            savedState.progress,
            remainingTime,
          );
          setProgressInterval(interval);
        } else {
          // Timeout reached, clear state
          clearGenerationState();
          setIsGenerating(false);
        }
      }
    } else {
      // If user has created today's story, clear any persisted generation state
      clearGenerationState();
      setIsGenerating(false);
    }
  }, [
    hasCreatedToday,
    loadGenerationState,
    clearGenerationState,
    GENERATION_TIMEOUT,
  ]);

  // Clear generation state when user has created today's story
  useEffect(() => {
    if (hasCreatedToday && isGenerating) {
      clearGenerationState();
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus("");
      setGenerationStartTime(null);
    }
  }, [hasCreatedToday, isGenerating, clearGenerationState]);

  // Track generation start time
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null,
  );

  // Optimized state saving with debounced effect
  useEffect(() => {
    if (isGenerating && generationStartTime) {
      const timeoutId = setTimeout(() => {
        saveGenerationState({
          isGenerating: true,
          progress: generationProgress,
          status: generationStatus,
          startTime: generationStartTime,
          theme: selectedTheme || undefined,
          character: selectedCharacter || undefined,
          message: personalMessage || undefined,
        });
      }, 100); // Debounce saves to avoid excessive localStorage writes

      return () => clearTimeout(timeoutId);
    }
  }, [
    isGenerating,
    generationProgress,
    generationStatus,
    selectedTheme,
    selectedCharacter,
    personalMessage,
    generationStartTime,
    saveGenerationState,
  ]);

  // Memoized today's created story calculation
  const todaysCreatedStory = useMemo(() => {
    if (!recentCreations.length) return null;
    const todayStr = new Date().toISOString().split("T")[0];
    return recentCreations.find((story: any) => {
      if (!story.createdAt) return false;
      const createdDateStr = new Date(story.createdAt)
        .toISOString()
        .split("T")[0];
      return createdDateStr === todayStr;
    });
  }, [recentCreations]);

  // Calculate time until midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilMidnight(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  // Progress simulation steps - realistic timing for actual story generation
  const simulateProgress = () => {
    const userLang = (user as any)?.language || "en";

    const steps =
      userLang === "ko"
        ? [
            { progress: 5, status: "테마와 캐릭터 분석 중..." },
            { progress: 15, status: "동화 개요 작성 중..." },
            { progress: 30, status: "동화 내용 생성 중..." },
            { progress: 50, status: "스토리 구조 개선 중..." },
            { progress: 65, status: "일러스트 프롬프트 생성 중..." },
            { progress: 75, status: "AI 일러스트 생성 중..." },
            { progress: 85, status: "이미지 업로드 중..." },
            { progress: 95, status: "동화 완성 중..." },
            { progress: 100, status: "동화가 성공적으로 생성되었습니다!" },
          ]
        : [
            { progress: 5, status: "Analyzing theme and character..." },
            { progress: 15, status: "Creating story outline..." },
            { progress: 30, status: "Writing fairy tale content..." },
            { progress: 50, status: "Refining story structure..." },
            { progress: 65, status: "Generating illustration prompt..." },
            { progress: 75, status: "Creating AI illustration..." },
            { progress: 85, status: "Uploading image..." },
            { progress: 95, status: "Finalizing your story..." },
            { progress: 100, status: "Story created successfully!" },
          ];

    // Realistic timing based on actual generation process (~50 seconds total)
    const timings = [
      3000, // 3s - Theme analysis (quick)
      4000, // 4s - Story outline
      16000, // 16s - Content generation (longest step)
      7000, // 7s - Structure improvement
      3000, // 3s - Illustration prompt
      12000, // 12s - AI illustration generation (second longest)
      3000, // 3s - Image upload
      2000, // 2s - Finalization
      1000, // 1s - Completion message
    ];

    let currentStep = 0;
    let totalDelay = 0;

    const scheduleNextStep = () => {
      if (currentStep < steps.length) {
        setTimeout(() => {
          setGenerationProgress(steps[currentStep].progress);
          setGenerationStatus(steps[currentStep].status);
          currentStep++;
          scheduleNextStep();
        }, timings[currentStep] || 10000);
      }
    };

    scheduleNextStep();

    // Return a timeout that can be cleared for cleanup
    const timeoutId = setTimeout(
      () => {
        // This timeout ensures cleanup after total expected time
      },
      timings.reduce((sum, time) => sum + time, 0),
    );

    setProgressInterval(timeoutId);
    return timeoutId;
  };

  // Resume progress simulation from a specific state
  const simulateProgressFromState = (
    currentProgress: number,
    remainingTime: number,
  ) => {
    const userLang = (user as any)?.language || "en";

    const steps =
      userLang === "ko"
        ? [
            { progress: 5, status: "테마와 캐릭터 분석 중..." },
            { progress: 15, status: "동화 개요 작성 중..." },
            { progress: 30, status: "동화 내용 생성 중..." },
            { progress: 50, status: "스토리 구조 개선 중..." },
            { progress: 65, status: "일러스트 프롬프트 생성 중..." },
            { progress: 75, status: "AI 일러스트 생성 중..." },
            { progress: 85, status: "이미지 업로드 중..." },
            { progress: 95, status: "동화 완성 중..." },
            { progress: 100, status: "동화가 성공적으로 생성되었습니다!" },
          ]
        : [
            { progress: 5, status: "Analyzing theme and character..." },
            { progress: 15, status: "Creating story outline..." },
            { progress: 30, status: "Writing fairy tale content..." },
            { progress: 50, status: "Refining story structure..." },
            { progress: 65, status: "Generating illustration prompt..." },
            { progress: 75, status: "Creating AI illustration..." },
            { progress: 85, status: "Uploading image..." },
            { progress: 95, status: "Finalizing your story..." },
            { progress: 100, status: "Story created successfully!" },
          ];

    // Find the current step based on progress
    let currentStep = steps.findIndex(
      (step) => step.progress > currentProgress,
    );
    if (currentStep === -1) currentStep = steps.length - 1;

    // Realistic timing for remaining steps (~50 seconds total)
    const timings = [3000, 4000, 16000, 7000, 3000, 12000, 3000, 2000, 1000];
    const remainingTimings = timings.slice(currentStep);
    const totalRemainingTime = remainingTimings.reduce(
      (sum, time) => sum + time,
      0,
    );

    // Scale timings based on actual remaining time
    const scaleFactor = Math.min(remainingTime / totalRemainingTime, 1);

    let stepIndex = currentStep;
    const scheduleNextStep = () => {
      if (stepIndex < steps.length) {
        setTimeout(
          () => {
            setGenerationProgress(steps[stepIndex].progress);
            setGenerationStatus(steps[stepIndex].status);
            stepIndex++;
            scheduleNextStep();
          },
          (timings[stepIndex] || 10000) * scaleFactor,
        );
      }
    };

    scheduleNextStep();

    // Return a timeout that can be cleared for cleanup
    const timeoutId = setTimeout(() => {
      // Cleanup after scaled time
    }, totalRemainingTime * scaleFactor);

    return timeoutId;
  };

  const generateStoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTheme || !selectedCharacter) {
        throw new Error("Please select a theme and character");
      }

      if (!canCreateToday) {
        throw new Error(
          "You've already created a story today. Try again tomorrow!",
        );
      }

      setIsGenerating(true);
      setGenerationProgress(0);
      const userLang = (user as any)?.language || "en";
      setGenerationStatus(
        userLang === "ko"
          ? "동화 생성을 시작합니다..."
          : "Starting story creation...",
      );

      // Set start time for persistence
      const startTime = Date.now();
      setGenerationStartTime(startTime);

      // Start progress simulation
      const interval = simulateProgress();

      // 실제 생성 시간 측정 시작
      const actualStartTime = Date.now();
      console.log("🕒 Story generation started at:", new Date().toISOString());

      try {
        const response = await apiRequest("POST", "/api/stories/generate", {
          theme: selectedTheme,
          character: selectedCharacter,
          length: selectedLength,
          message: personalMessage.trim() || undefined,
        });

        // 실제 생성 시간 측정 완료
        const actualEndTime = Date.now();
        const actualDuration = actualEndTime - actualStartTime;
        const actualDurationSeconds = Math.round(actualDuration / 1000);
        console.log(`📊 Story generation completed in ${actualDurationSeconds} seconds (${actualDuration}ms)`);
        console.log("✅ Story generation finished at:", new Date().toISOString());

        clearInterval(interval);
        setGenerationProgress(100);
        const userLang = (user as any)?.language || "en";
        setGenerationStatus(
          userLang === "ko"
            ? "동화가 성공적으로 생성되었습니다!"
            : "Story created successfully!",
        );

        // Show completion message briefly before refresh
        setTimeout(() => {
          window.location.reload();
        }, 2000); // 2초 후 새로고침

        return response;
      } catch (error) {
        clearInterval(interval);
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStatus("");
        throw error;
      }
    },
    onSuccess: (data: any) => {
      const storyTitle = data.title || "Your new story";

      // Clear interval
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }

      // Toast notification removed for cleaner UX

      // Reset form
      setSelectedTheme(null);
      setSelectedCharacter({
        name: t("createAccordingToStory"),
        description: "Let the story determine the perfect character",
      });
      setSelectedLength(null);
      setPersonalMessage("");
      setHasJustCreated(true); // Mark that we just created a story

      // Clear persisted state immediately
      clearGenerationState();

      // Ensure generation state is completely reset
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus("");
      setGenerationStartTime(null);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stories/created"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/stories/can-create-today"],
      });

      // Show a loading transition before refresh
      setTimeout(() => {
        // Clear any remaining generation state before reload
        try {
          localStorage.removeItem(`story-generation-${(user as any)?.id}`);
          localStorage.removeItem("story-generation-state");
          // Clear any other potential keys
          Object.keys(localStorage).forEach((key) => {
            if (key.includes("story-generation")) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.error("Error clearing localStorage:", e);
        }
        
        // Show loading indicator briefly before refresh
        const userLang = (user as any)?.language || "en";
        setGenerationStatus(
          userLang === "ko"
            ? "새로운 동화를 불러오는 중..."
            : "Loading your new story..."
        );
        
        // Refresh after brief delay to show the message
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }, 1200);
    },
    onError: (error: any) => {
      console.error("Error generating story:", error);

      // Clear interval on error
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }

      toast({
        title: t("storyCreationFailed"),
        description: error.message || t("storyCreationError"),
        variant: "destructive",
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus("");
      setGenerationStartTime(null);

      // Clear persisted state on error
      clearGenerationState();
    },
  });

  // Memoized handlers to prevent unnecessary re-renders
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      const routes = {
        today: "/",
        library: "/library",
        create: "/create",
        mypage: "/mypage",
      };
      const route = routes[tab as keyof typeof routes];
      if (route) navigate(route);
    },
    [navigate],
  );

  const handleGenerate = useCallback(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Check if user has Prena plan access for Create feature
    if (!hasPrenaPlan) {
      setShowPrenaPlanModal(true);
      return;
    }

    generateStoryMutation.mutate();
  }, [generateStoryMutation, isAuthenticated, hasPrenaPlan]);

  return (
    <div className="container-mobile bg-cream min-h-screen">
      {/* Header */}
      <header className="py-3 bg-cream sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-heading text-lavender font-semibold">
            prena tale
          </h1>
          <Button variant="ghost" size="sm" className="p-2 rounded-full">
            <Bell className="w-5 h-5 text-gray-custom" />
          </Button>
        </div>
      </header>
      {/* Main Content */}
      <main className="pb-24 pt-4">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-lg font-heading text-gray-custom font-medium">
            {t("createYourStory")}
          </h2>
        </div>

        {/* Loading State */}
        {isDataLoading && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-40 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!isDataLoading && (
          <div>
            {/* Creation Limit Notice - Show when creating story OR when already created */}
            {(hasCreatedToday || isGenerating) && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-600" />
                    <h3 className="font-medium text-amber-800">
                      {isGenerating
                        ? t("creatingDailyStory")
                        : t("youveCreatedToday")}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-amber-700 mb-2">
                  {isGenerating
                    ? t("yourStoryBeingCreated") + ` ${t("createAnotherStoryIn").replace("{time}", timeUntilMidnight)}`
                    : t("createAnotherStoryIn").replace("{time}", timeUntilMidnight)}
                </p>
              </div>
            )}

            {/* Removed - Progress is now shown in Today's Created Story section */}

            {/* Today's Created Story Card - Show during generation or when story exists */}
            {(isGenerating || (hasCreatedToday && todaysCreatedStory)) && (
              <div className="mb-6">
                <h3 className="font-heading text-gray-custom font-medium mb-4 text-lg">
                  {(user as any)?.language === "ko"
                    ? "오늘의 생성된 동화"
                    : "Today's Created Story"}
                </h3>
                {isGenerating ? (
                  <div className="story-card w-full rounded-2xl overflow-hidden shadow-md bg-white border border-lavender/20">
                    {/* Image Area - Same size as regular story card */}
                    <div className="h-56 bg-gradient-to-br from-lavender/3 to-mint/3 relative overflow-hidden flex items-center justify-center">
                      <div className="text-center space-y-6">
                        {/* Elegant spinning animation */}
                        <div className="relative w-16 h-16 mx-auto">
                          <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                          <div className="absolute inset-0 rounded-full border-t-2 border-lavender animate-spin"></div>
                          <div className="absolute inset-1 rounded-full border border-gray-300"></div>
                          <div
                            className="absolute inset-1 rounded-full border-t border-mint animate-spin"
                            style={{
                              animationDirection: "reverse",
                              animationDuration: "1.5s",
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-lavender/80" />
                          </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-lavender">
                            {t("yourStoryBeingCreated")}
                          </h3>
                          <p className="text-lavender/60 text-sm">
                            {t("pleaseWaitMoment")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content Area - Same structure as regular story card */}
                    <div className="p-6 space-y-6">
                      {/* Progress Section */}
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-lavender/70 font-medium">
                              {generationStatus}
                            </span>
                            <span className="text-sm text-lavender font-semibold">
                              {Math.round(generationProgress)}%
                            </span>
                          </div>
                          <Progress
                            value={generationProgress}
                            className="h-2"
                          />
                        </div>

                        {/* Estimated time */}
                        <div className="text-center">
                          <p className="text-lavender/50 text-xs">
                            {(user as any)?.language === "ko"
                              ? "동화 생성에는 약 60-90초가 소요됩니다"
                              : "Takes about 60-90 seconds to create a story"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="story-card w-full rounded-2xl overflow-hidden shadow-md bg-white cursor-pointer"
                    onClick={() => {
                      navigate(`/story/${todaysCreatedStory.storyUuid}?from=create`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <div className="h-56 bg-gray-200 relative overflow-hidden">
                      {todaysCreatedStory.imageUrl ? (
                        <img
                          src={todaysCreatedStory.imageUrl}
                          alt={todaysCreatedStory.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-lavender bg-gray-200">
                          <BookOpen className="w-16 h-16" />
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-heading font-semibold text-lg leading-tight flex-1 pr-3 line-clamp-2 text-gray-custom min-h-[3.5rem]">
                          {todaysCreatedStory.title}
                        </h3>
                        <span className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {todaysCreatedStory.readingTime} min
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed flex-1">
                        {todaysCreatedStory.content
                          ? todaysCreatedStory.content.substring(0, 150) + "..."
                          : "Your personalized story awaits..."}
                      </p>

                      <div className="flex gap-2 mb-6 overflow-hidden">
                        {todaysCreatedStory.tags
                          ?.slice(0, 4)
                          .map((tag: string, tagIndex: number) => (
                            <span
                              key={`${tag}-${tagIndex}`}
                              className="text-xs text-lavender px-3 py-1 rounded-full font-medium whitespace-nowrap"
                              style={{ backgroundColor: "#9680c21a" }}
                            >
                              #{tag}
                            </span>
                          ))}
                      </div>

                      <div className="mt-auto">
                        <Button
                          className="w-full py-3 bg-lavender text-white rounded-xl font-medium hover:bg-lavender/90 transition-all active:scale-95 mb-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/story/${todaysCreatedStory.storyUuid}?from=create`,
                            );
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {t("readStory")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Creation Card - Only show if user hasn't created today and not generating and hasn't just created */}
            {!hasCreatedToday && !isGenerating && !hasJustCreated && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                {/* Intro Text */}
                <div className="mb-6">
                  <h3 className="font-heading text-gray-custom font-medium mb-2">
                    {t("chooseThemeDescription")}
                  </h3>
                  <p className="text-sm text-gray-600">{t("oneStoryPerDay")}</p>
                </div>

                {/* Theme Selection */}
                <div className="mb-6">
                  <ThemeSelector
                    selectedTheme={selectedTheme}
                    onThemeSelect={setSelectedTheme}
                    disabled={isGenerating}
                  />
                </div>

                {/* Character Selection */}
                <div className="mb-6">
                  <CharacterSelector
                    selectedCharacter={selectedCharacter}
                    onCharacterSelect={setSelectedCharacter}
                    disabled={isGenerating}
                  />
                </div>

                {/* Story Length Selection */}
                <div className="mb-6">
                  <StoryLengthSelector
                    selectedLength={selectedLength}
                    onLengthSelect={setSelectedLength}
                    disabled={isGenerating}
                    language={(user as any)?.language || "en"}
                  />
                </div>

                {/* Personal Message */}
                <div className="mb-6">
                  <label
                    className="text-gray-custom font-medium mb-3 block text-[14px]"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {t("addSpecialMessage")}
                  </label>
                  <Textarea
                    placeholder={t("enterSpecialMessage")}
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    className="min-h-[100px] resize-none border-gray-200 focus:border-lavender focus:ring-lavender"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {personalMessage.length}/200 characters
                  </p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={
                    !selectedTheme || !selectedCharacter || isGenerating
                  }
                  className="w-full py-4 bg-lavender hover:bg-lavender/90 text-white rounded-xl font-medium text-base flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  {isGenerating
                    ? (user as any)?.language === "ko"
                      ? "동화 생성 중..."
                      : "Creating Story..."
                    : t("createMyStory")}
                </Button>
              </div>
            )}

            {/* Recently Created Stories - Show previous stories excluding today's */}
            <div className="mb-6">
              <h3 className="font-heading text-gray-custom mb-3 text-[18px] font-medium">
                {t("recentlyCreated")}
              </h3>
              {(() => {
                const previousStories = recentCreations.filter((story: any) => {
                  if (!hasCreatedToday || !todaysCreatedStory) return true;
                  return story.id !== todaysCreatedStory.id;
                });

                return previousStories.length > 0 ? (
                  <div className="space-y-3">
                    {previousStories.slice(0, 10).map((story: any) => (
                      <div
                        key={story.id}
                        className="flex gap-3 bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          navigate(`/story/${story.storyUuid}?from=create`);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <div
                          className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0 relative overflow-hidden"
                          style={{
                            backgroundImage: story.imageUrl
                              ? `url(${story.imageUrl})`
                              : "none",
                            backgroundColor: story.imageUrl
                              ? "transparent"
                              : "#f3f4f6",
                          }}
                        >
                          {!story.imageUrl && (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-lavender" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-medium text-sm text-gray-custom mb-1">
                            {story.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {story.content
                              ? story.content.substring(0, 100) + "..."
                              : "Your personalized story..."}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {story.readingTime} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(story.createdAt).toLocaleDateString(
                                "ko-KR",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Heart className="w-4 h-4 text-lavender" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-lavender/20 rounded-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-lavender" />
                    </div>
                    <h4 className="font-heading font-medium text-gray-custom mb-2">
                      {t("noStoriesCreatedYet")}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t("createFirstFairyTale")}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          // Refresh user data after successful login
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          setShowLoginModal(false);
        }}
      />

      {/* Prena Plan Modal */}
      <PrenaPlanModal
        isOpen={showPrenaPlanModal}
        onClose={() => setShowPrenaPlanModal(false)}
        feature="create"
      />
    </div>
  );
}
