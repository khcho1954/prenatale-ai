import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, ArrowLeft, User, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const formSchema = z.object({
  username: z.string().min(1, "Please enter your name"),
  babyName: z.string().min(1, "Please enter baby name"),
  dueDate: z.date({
    required_error: "Please select a due date",
  }),
  relationship: z.enum(["mom", "dad", "other"], {
    required_error: "Please select your relationship to baby",
  }),
  customRelationship: z.string().optional(),
  timezone: z.string().min(1, "Please select a timezone"),
  language: z.enum(["ko", "en"]).optional(),
}).refine((data) => {
  if (data.relationship === "other") {
    return data.customRelationship && data.customRelationship.length > 0;
  }
  return true;
}, {
  message: "Please specify your relationship",
  path: ["customRelationship"],
});

type FormValues = z.infer<typeof formSchema>;

function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return "UTC";
  }
}

function detectUserLanguage(): "ko" | "en" {
  try {
    const browserLanguage = navigator.language || navigator.languages[0];
    return browserLanguage.toLowerCase().includes('ko') ? 'ko' : 'en';
  } catch (error) {
    return 'en';
  }
}

export default function GoogleProfileCompletion() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCustomRelationship, setShowCustomRelationship] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  // Use browser language detection for Google profile completion
  const [detectedLanguage, setDetectedLanguage] = useState<"ko" | "en">("en");
  
  useEffect(() => {
    // Always use browser language detection for Google profile completion
    const browserLanguage = navigator.language || navigator.languages?.[0] || '';
    const detected = browserLanguage.toLowerCase().includes('ko') ? 'ko' : 'en';
    setDetectedLanguage(detected);
    console.log('Google profile completion - browser language detection:', browserLanguage, '-> detected:', detected);
  }, []);
  
  // Create translation function for this page
  const translations = {
    ko: {
      completeProfile: "프로필 완성",
      babyName: "아기 이름", 
      enterBabyName: "아기 이름을 입력하세요",
      dueDate: "출산 예정일",
      pickDate: "날짜를 선택하세요",
      yourRelationshipToBaby: "아기와의 관계",
      mom: "엄마",
      dad: "아빠", 
      other: "기타",
      timezone: "시간대",
      language: "언어",
      korean: "한국어",
      english: "영어",
      complete: "완성",
      loading: "로딩 중...",
      termsOfServiceAgreement: "서비스 이용약관 동의(필수)",
      privacyPolicyAgreement: "개인정보 수집·이용 동의(필수)",
      viewTermsOfService: "내용 확인",
      viewPrivacyPolicy: "내용 확인",
      agreeToTermsAndPrivacy: "이용약관 및 개인정보 수집·이용에 동의해야 회원가입이 가능합니다."
    },
    en: {
      completeProfile: "Complete Profile",
      babyName: "Baby Name",
      enterBabyName: "Enter baby name", 
      dueDate: "Due Date",
      pickDate: "Pick a date",
      yourRelationshipToBaby: "Your relationship to baby",
      mom: "Mom",
      dad: "Dad",
      other: "Other", 
      timezone: "Timezone",
      language: "Language",
      korean: "Korean",
      english: "English",
      complete: "Complete",
      loading: "Loading...",
      termsOfServiceAgreement: "Terms of Service Agreement (Required)",
      privacyPolicyAgreement: "Privacy Policy Agreement (Required)",
      viewTermsOfService: "View Details",
      viewPrivacyPolicy: "View Details",
      agreeToTermsAndPrivacy: "You must agree to the Terms of Service and Privacy Policy to create an account."
    }
  };
  
  const t = (key: string) => {
    return translations[detectedLanguage][key as keyof typeof translations[typeof detectedLanguage]] || key;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      babyName: "",
      relationship: undefined,
      customRelationship: "",
      timezone: detectUserTimezone(),
      language: detectUserLanguage(),
    },
  });
  
  // Update form language when detectedLanguage changes
  useEffect(() => {
    setValue('language', detectedLanguage);
  }, [detectedLanguage, setValue]);

  const watchedRelationship = watch("relationship");
  const watchedDueDate = watch("dueDate");

  useEffect(() => {
    // Check if user came from Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const isGoogleSignup = urlParams.get('google_signup') === 'true';
    const token = urlParams.get('token');
    
    if (isGoogleSignup && token) {
      // Store token and get user info
      localStorage.setItem('authToken', token);
      
      // Get user info from the token
      fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(user => {
        setUserInfo(user);
        // Pre-fill username if available
        if (user.username) {
          setValue('username', user.username);
        }
      })
      .catch(err => {
        console.error('Failed to get user info:', err);
        setLocation('/signup');
      });
    } else {
      // Redirect to signup if not from Google
      setLocation('/signup');
    }
  }, [setValue, setLocation]);

  useEffect(() => {
    if (watchedRelationship === "other") {
      setShowCustomRelationship(true);
    } else {
      setShowCustomRelationship(false);
      setValue("customRelationship", "");
    }
  }, [watchedRelationship, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        username: data.username,
        babyName: data.babyName,
        babyDueDate: data.dueDate.toISOString(),
        relationship: data.relationship === "other" ? data.customRelationship : data.relationship,
        timezone: data.timezone,
        language: data.language,
      };
      return apiRequest("POST", "/api/auth/complete-google-profile", payload);
    },
    onSuccess: async (response) => {
      const result = await response.json();
      
      // Update auth state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: detectedLanguage === 'ko' ? "프로필 설정 완료" : "Profile Setup Complete",
        description: detectedLanguage === 'ko' ? "환영합니다! 이제 모든 기능을 사용할 수 있습니다." : "Welcome! You can now access all features.",
      });
      
      // Navigate to home
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: detectedLanguage === 'ko' ? "프로필 설정 실패" : "Profile Setup Failed",
        description: error.message || (detectedLanguage === 'ko' ? "다시 시도해주세요" : "Please try again"),
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    mutation.mutate(data);
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/signup")}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-heading font-semibold text-gray-custom">
            {t("completeProfile")}
          </h1>
          <div className="w-9 h-9 rounded-full bg-lavender/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-lavender" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Google Account Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              {userInfo.profileImageUrl && (
                <img 
                  src={userInfo.profileImageUrl} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-custom">
                  {userInfo.username || userInfo.email}
                </p>
                <p className="text-sm text-gray-600">{userInfo.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 mb-2 block">
                {detectedLanguage === 'ko' ? '사용자 이름' : 'User Name'}
              </Label>
              <Input
                id="username"
                placeholder={detectedLanguage === 'ko' ? '사용자 이름을 입력하세요' : 'Enter your user name'}
                {...register("username")}
                className="w-full"
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Baby Name */}
            <div>
              <Label htmlFor="babyName" className="text-sm font-medium text-gray-700 mb-2 block">
                {t("babyName")}
              </Label>
              <Input
                id="babyName"
                placeholder={t("enterBabyName")}
                {...register("babyName")}
                className="w-full"
              />
              {errors.babyName && (
                <p className="text-sm text-red-500 mt-1">{errors.babyName.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700 mb-2 block">
                {t("dueDate")}
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedDueDate ? (
                      detectedLanguage === "ko" 
                        ? format(watchedDueDate, "yyyy.MM.dd", { locale: ko })
                        : format(watchedDueDate, "PPP")
                    ) : <span>{t("pickDate")}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchedDueDate}
                    onSelect={(date) => {
                      if (date) {
                        setValue("dueDate", date);
                        setCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={detectedLanguage === "ko" ? ko : undefined}
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>
              )}
            </div>

            {/* Relationship */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                {t("yourRelationshipToBaby")}
              </Label>
              <RadioGroup
                value={watchedRelationship}
                onValueChange={(value) => setValue("relationship", value as "mom" | "dad" | "other")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mom" id="mom" />
                  <Label htmlFor="mom" className="text-sm">{t("mom")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dad" id="dad" />
                  <Label htmlFor="dad" className="text-sm">{t("dad")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="text-sm">{t("other")}</Label>
                </div>
              </RadioGroup>
              {errors.relationship && (
                <p className="text-sm text-red-500 mt-1">{errors.relationship.message}</p>
              )}
            </div>

            {/* Custom Relationship */}
            {showCustomRelationship && (
              <div>
                <Label htmlFor="customRelationship" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t("specifyRelationship")}
                </Label>
                <Input
                  id="customRelationship"
                  placeholder={t("relationshipPlaceholder")}
                  {...register("customRelationship")}
                  className="w-full"
                />
                {errors.customRelationship && (
                  <p className="text-sm text-red-500 mt-1">{errors.customRelationship.message}</p>
                )}
              </div>
            )}

            {/* Timezone Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                {detectedLanguage === 'ko' ? '시간대' : 'Timezone'}
              </Label>
              <Select
                value={watch("timezone")}
                onValueChange={(value) => setValue("timezone", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={detectedLanguage === 'ko' ? '시간대를 선택하세요' : 'Select timezone'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Seoul">Asia/Seoul (GMT+9)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Asia/Shanghai (GMT+8)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (GMT-8)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (GMT+1)</SelectItem>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-sm text-red-500 mt-1">{errors.timezone.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t("timezoneExplanation")}
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                {t("preferredLanguage")}
              </Label>
              <Select
                value={watch("language")}
                onValueChange={(value) => setValue("language", value as "ko" | "en")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("preferredLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Terms and Privacy Agreement */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-1"
                />
                <div className="flex-1 flex justify-between items-start">
                  <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                    {t("termsOfServiceAgreement")}
                  </Label>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs text-lavender hover:text-lavender/80 ml-2"
                    onClick={() => window.open(window.location.origin + "/terms-of-service", "_blank")}
                  >
                    {t("viewTermsOfService")}
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                  className="mt-1"
                />
                <div className="flex-1 flex justify-between items-start">
                  <Label htmlFor="privacy" className="text-sm text-gray-700 cursor-pointer">
                    {t("privacyPolicyAgreement")}
                  </Label>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs text-lavender hover:text-lavender/80 ml-2"
                    onClick={() => window.open(window.location.origin + "/privacy-policy", "_blank")}
                  >
                    {t("viewPrivacyPolicy")}
                  </Button>
                </div>
              </div>

              {(!termsAccepted || !privacyAccepted) && (
                <p className="text-xs text-red-500">
                  {t("agreeToTermsAndPrivacy")}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={mutation.isPending || !termsAccepted || !privacyAccepted}
              className="w-full bg-lavender hover:bg-lavender/90 text-white py-3 rounded-xl font-medium transition-all"
            >
              {mutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {detectedLanguage === 'ko' ? '설정 중...' : 'Setting up...'}
                </div>
              ) : (
                detectedLanguage === 'ko' ? '프로필 완성' : 'Complete Profile'
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}