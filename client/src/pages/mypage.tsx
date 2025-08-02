import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "@/components/ui/theme-provider";
import ReadingStats from "@/components/stats/ReadingStats";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserStatsView } from "@shared/schema";
import { Bell, User, LogIn, Sun, Moon, ChevronRight, Eye, EyeOff } from "lucide-react";
import { BottomNavigation } from "@/components/bottom-navigation";
import ForgotPasswordModal from "@/components/forgot-password-modal";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const MyPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t, language } = useLanguage();

  const [editingBaby, setEditingBaby] = useState(false);
  const [babyName, setBabyName] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleTabChange = (tab: string) => {
    if (tab === "today") {
      setLocation("/");
    } else if (tab === "library") {
      setLocation("/library");
    } else if (tab === "create") {
      setLocation("/create");
    } else if (tab === "mypage") {
      // Already on mypage, no action needed
    }
  };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      // Clear authentication token
      localStorage.removeItem('authToken');
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error) => {
      // Even if logout fails, clear token and redirect
      localStorage.removeItem('authToken');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
  });
  
  // Use the auth hook
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // State to force refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get additional user data only if authenticated
  const { data: user } = useQuery({
    queryKey: ["/api/users/me", refreshTrigger], // Add refresh trigger to force fresh queries
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // No cache
    enabled: isAuthenticated,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  
  const { data: userStats, isLoading } = useQuery<UserStatsView>({
    queryKey: ["/api/user/stats"],
    staleTime: 1000 * 60 * 5, // 5 minutes (stats change more frequently)
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    enabled: isAuthenticated,
  });

  // Refresh user data when page becomes visible or focused (for username updates)
  useEffect(() => {
    const handleRefresh = () => {
      if (isAuthenticated) {
        // Force refresh trigger and invalidate caches
        setRefreshTrigger(prev => prev + 1);
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
        
        // Also force refetch
        queryClient.refetchQueries({ queryKey: ["/api/users/me"] });
        queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleRefresh();
      }
    };

    const handleFocus = () => {
      handleRefresh();
    };

    // Add multiple event listeners for better coverage
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, queryClient]);

  // Force refresh when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        queryClient.refetchQueries({ queryKey: ["/api/users/me"] });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, queryClient]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };



  // Save baby information with comprehensive cache invalidation
  const updateBabyMutation = useMutation({
    mutationFn: async (data: { babyName: string; babyDueDate: string | null }) => {
      return await apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      // Invalidate all user-related queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      // Force refetch to update UI immediately
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      queryClient.refetchQueries({ queryKey: ["/api/users/me"] });
      
      // Trigger refresh to ensure latest data is loaded
      setRefreshTrigger(prev => prev + 1);
      
      setEditingBaby(false);
    },
    onError: (error) => {
      console.error("Failed to update baby info:", error);
      toast({
        title: t("updateFailed"),
        description: t("updateBabyInfoFailed"),
        variant: "destructive",
      });
    }
  });

  const saveBabyInfo = () => {
    const updateData = {
      babyName,
      babyDueDate: dueDate?.toISOString() || null // Use babyDueDate to match API
    };
    
    console.log("Saving baby info:", updateData);
    updateBabyMutation.mutate(updateData);
  };

  // Get baby name from the most up-to-date source
  const displayBabyName = (user as any)?.babyName || (currentUser as any)?.babyName || "Baby";
  
  // Get due date from the most up-to-date source - prioritize user data over currentUser
  const displayDueDate = (user as any)?.babyDueDate || (currentUser as any)?.babyDueDate;
  
  // Initialize baby name and due date when dialog opens
  useEffect(() => {
    if (editingBaby) {
      console.log("Dialog opened - user data:", user);
      console.log("Dialog opened - currentUser data:", currentUser);
      
      // Use the most up-to-date user data
      const userData = user || currentUser;
      const babyNameValue = userData?.babyName || "";
      const dueDateValue = userData?.babyDueDate ? new Date(userData.babyDueDate) : undefined;
      
      console.log("Setting baby name:", babyNameValue);
      console.log("Setting due date:", dueDateValue);
      
      setBabyName(babyNameValue);
      setDueDate(dueDateValue);
    }
  }, [editingBaby, user, currentUser]);

  // Show loading state
  if (isAuthLoading) {
    return (
      <div className="page-transition px-4 py-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Login Form Component for non-authenticated users
  const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { t } = useLanguage();

    const {
      register,
      handleSubmit,
      getValues,
      formState: { errors },
    } = useForm<LoginFormValues>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    });

    const loginMutation = useMutation({
      mutationFn: async (data: LoginFormValues) => {
        return apiRequest("POST", "/api/auth/login", data);
      },
      onSuccess: async (response) => {
        const result = await response.json();
        
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect to Today tab after login
        setTimeout(() => {
          setLocation("/");
        }, 500);
      },
      onError: (error: Error) => {
        toast({
          title: t("loginFailed"),
          description: error.message || t("invalidCredentials"),
          variant: "destructive",
        });
      },
    });

    function onSubmit(data: LoginFormValues) {
      loginMutation.mutate(data);
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-custom font-medium">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("enterEmailAddress")}
            {...register("email")}
            className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-custom font-medium">
            {t("password")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("enterPassword")}
              {...register("password")}
              className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-custom" />
              ) : (
                <Eye className="w-4 h-4 text-gray-custom" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="link"
            className="text-lavender hover:text-lavender/80 p-0 h-auto text-sm"
            onClick={() => setShowForgotPassword(true)}
          >
            {t("forgotPassword")}
          </Button>
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-lavender hover:bg-lavender/90 text-white rounded-xl font-medium transition focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t("loading")}
            </div>
          ) : (
            t("signIn")
          )}
        </Button>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-custom">or</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => window.location.href = '/api/auth/google'}
            variant="outline"
            className="w-full h-10 mt-3 rounded-xl border-border hover:border-lavender hover:bg-lavender/5 transition"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("signInWithGoogle")}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-custom">
            {t("dontHaveAccount")}{" "}
            <Button
              variant="link"
              className="text-lavender hover:text-lavender/80 p-0 h-auto text-sm font-medium"
              onClick={() => setLocation("/signup-choice")}
            >
              {t("createNewAccount")}
            </Button>
          </p>
        </div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          open={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          email={getValues("email")}
        />
      </form>
    );
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container-mobile bg-cream min-h-screen">
        {/* Header */}
        <header className="py-3 bg-cream sticky top-0 z-10 border-b border-gray-200">
          <div className="flex items-center justify-between px-4">
            <h1 className="text-xl font-heading text-lavender font-semibold">
              prena tale
            </h1>
            <Button variant="ghost" size="sm" className="p-2 rounded-full">
              <Bell className="w-5 h-5 text-gray-custom" />
            </Button>
          </div>
        </header>
        {/* Main Content */}
        <div className="px-4 py-4 pb-24">
          <div className="mb-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-[#9680c21a]">
                <User className="w-8 h-8 text-lavender" />
              </div>
              <h2 className="font-heading text-gray-custom font-semibold mb-2 text-[20px]">{t("welcomeToPrenatale")}</h2>
              <p className="text-muted-custom">{t("signInToContinue")}</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <LoginForm />
          </div>
        </div>
        {/* Bottom Navigation */}
        <BottomNavigation activeTab="mypage" onTabChange={handleTabChange} />
      </div>
    );
  }

  return (
    <div className="container-mobile bg-cream min-h-screen relative">
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
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4 bg-[#9680c21a]">
            {user?.profileImageUrl && user.profileImageUrl !== "none" ? (
              <span className="text-3xl">
                {user.profileImageUrl === "princess" ? "👸" :
                 user.profileImageUrl === "prince" ? "🤴" :
                 user.profileImageUrl === "fairy" ? "🧚" :
                 user.profileImageUrl === "wizard" ? "🧙" :
                 user.profileImageUrl === "unicorn" ? "🦄" :
                 user.profileImageUrl === "dragon" ? "🐉" :
                 user.profileImageUrl === "bear" ? "🐻" :
                 user.profileImageUrl === "fox" ? "🦊" :
                 user.profileImageUrl === "owl" ? "🦉" :
                 user.profileImageUrl === "rabbit" ? "🐰" :
                 user.profileImageUrl === "cat" ? "🐱" :
                 user.profileImageUrl === "bird" ? "🐦" :
                 "👤"}
              </span>
            ) : (
              <User className="w-8 h-8 text-lavender" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl text-gray-custom">
                  {(user?.username || currentUser?.username) || (user?.email || currentUser?.email)?.split('@')[0] || "User"}
                </h2>
                {(currentUser?.subscriptionPlan || user?.subscriptionPlan) === "prena" ? (
                  <p className="text-sm text-gray-600">
                    {language === 'ko' ? '구독: ~ ' : 'Subscription: ~ '}
                    {(currentUser?.subscriptionEndDate || user?.subscriptionEndDate) ? (
                      language === 'ko' ? 
                        format(new Date(currentUser?.subscriptionEndDate || user?.subscriptionEndDate), "yyyy년 MM월 dd일") : 
                        format(new Date(currentUser?.subscriptionEndDate || user?.subscriptionEndDate), "PPP")
                    ) : '---'}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {language === 'ko' ? '무료 플랜' : 'Free plan'}
                  </p>
                )}
              </div>
              <div className="flex items-center">
                {(currentUser?.subscriptionPlan || user?.subscriptionPlan) === "prena" ? (
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Prena Plan
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setLocation("/settings/subscription")}
                    className="text-xs px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-sm"
                  >
                    Upgrade to Prena Plan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-heading text-lg mb-4 text-gray-custom">{t("myBaby")}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-custom">{displayBabyName}</p>
                  <p className="text-xs text-gray-600">
                    {t("dueDate")}: {displayDueDate ? (
                      language === 'ko' ? 
                        format(new Date(displayDueDate), "yyyy년 MM월 dd일") : 
                        format(new Date(displayDueDate), "PPP")
                    ) : t("notSet")}
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => {
                    console.log("Edit button clicked - current user data:", user);
                    console.log("Edit button clicked - currentUser data:", currentUser);
                    setEditingBaby(true);
                  }}
                  className="bg-[#e8e6e1] hover:bg-[#7A6AAD] text-[#544a4a] hover:text-white border-none rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-colors"
                >
{t("edit")}
                </Button>
              </div>
            </div>
            
            <Dialog open={editingBaby} onOpenChange={setEditingBaby}>
              <DialogContent className="sm:max-w-md bg-white shadow-lg border z-50">
                <DialogHeader>
                  <DialogTitle className="text-[#4A4A4A]">
                    {language === 'ko' ? '아기 정보 수정' : 'Edit Baby Information'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    {language === 'ko' 
                      ? '더 개인화된 경험을 위해 아기의 이름과 출산예정일을 업데이트하세요.' 
                      : 'Update your baby\'s name and due date for a more personalized experience.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="babyName" className="text-[#4A4A4A]">
                      {language === 'ko' ? '아기 이름' : 'Baby Name'}
                    </Label>
                    <Input 
                      id="babyName" 
                      value={babyName} 
                      onChange={(e) => setBabyName(e.target.value)}
                      placeholder={language === 'ko' ? '아기 이름을 입력하세요' : 'Enter baby name'}
                      className="border-[#E8E6E1] focus:border-[#8E7CC3]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#4A4A4A]">
                      {language === 'ko' ? '출산예정일' : 'Due Date'}
                    </Label>
                    
                    {/* Selected date display */}
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                      {language === 'ko' ? '현재 선택된 일자: ' : 'Currently selected date: '}
                      {dueDate ? (
                        language === 'ko' ? 
                          format(dueDate, "yyyy년 MM월 dd일") : 
                          format(dueDate, "MMMM dd, yyyy")
                      ) : (
                        language === 'ko' ? '선택되지 않음' : 'Not selected'
                      )}
                    </div>
                    
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      className="rounded-md border border-[#E8E6E1] p-3"
                      classNames={{
                        day_selected: "bg-[#8E7CC3] text-white hover:bg-[#7A6AAD] hover:text-white focus:bg-[#7A6AAD] focus:text-white",
                        day_today: "bg-[#E8E6E1] text-[#4A4A4A] font-bold",
                        day_outside: "text-gray-400",
                        day_disabled: "text-gray-300",
                        day_range_middle: "bg-[#E8E6E1]",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingBaby(false)}
                    className="border-[#E8E6E1] text-[#4A4A4A] hover:bg-[#E8E6E1]"
                  >
                    {language === 'ko' ? '취소' : 'Cancel'}
                  </Button>
                  <Button 
                    onClick={saveBabyInfo}
                    className="bg-[#8E7CC3] hover:bg-[#7A6AAD] text-white"
                  >
                    {language === 'ko' ? '저장' : 'Save'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ReadingStats 
          babyName={displayBabyName}
          userId={currentUser?.id || 1}
        />

        <div className="bg-white rounded-2xl p-5 shadow-sm mt-6">
          <h3 className="font-heading text-lg mb-4 text-gray-custom">{t("settings")}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-custom">{t("notifications")}</p>
                <p className="text-xs text-gray-600">{t("dailyStoryUpdates")}</p>
              </div>
              <Switch 
                id="notifications" 
                defaultChecked 
              />
            </div>
            
            {/* Theme toggle hidden per user request */}
            {/* <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-custom">{t("theme")}</p>
                <p className="text-xs text-gray-600">{t("lightDarkMode")}</p>
              </div>
              <button 
                className="text-gray-custom hover:text-lavender" 
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div> */}
            

            <div 
              className="flex items-center justify-between pb-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2"
              onClick={() => setLocation("/settings/subscription")}
            >
              <div>
                <p className="font-medium text-gray-custom">{t("subscription")}</p>
                <p className="text-xs text-gray-600">{t("planManagement")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-custom" />
            </div>
            
            <div 
              className="flex items-center justify-between pb-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2"
              onClick={() => setLocation("/settings/account")}
            >
              <div>
                <p className="font-medium text-gray-custom">{t("account")}</p>
                <p className="text-xs text-gray-600">{t("profileSettings")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-custom" />
            </div>
            
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2"
              onClick={() => setLocation("/settings/help")}
            >
              <div>
                <p className="font-medium text-gray-custom">{t("helpSupport")}</p>
                <p className="text-xs text-gray-600">{t("faqContact")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-custom" />
            </div>
          </div>
          
          {/* Log Out button at bottom */}
          <div className="mt-6 text-center">
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-xs hover:text-red-700 disabled:opacity-50 text-lavender"
            >
              {logoutMutation.isPending ? t("loggingOut") : t("logout")}
            </button>
          </div>
        </div>
      </main>
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="mypage" onTabChange={handleTabChange} />
    </div>
  );
};

export default MyPage;