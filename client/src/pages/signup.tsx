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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GoogleLoginButton from "@/components/google-login-button";
import { Bell, ArrowLeft, User, Eye, EyeOff, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const formSchema = z
  .object({
    username: z
      .string()
      .min(2, "Username must be at least 2 characters")
      .max(20, "Username must be less than 20 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    babyName: z.string().min(1, "Please enter baby name"),
    dueDate: z.date({
      required_error: "Please select a due date",
    }),
    relationship: z.enum(["mom", "dad", "other"], {
      required_error: "Please select your relationship to baby",
    }),
    customRelationship: z.string().optional(),
    timezone: z.string().optional(),
    language: z.enum(["ko", "en"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.relationship === "other") {
        return data.customRelationship && data.customRelationship.length > 0;
      }
      return true;
    },
    {
      message: "Please specify your relationship",
      path: ["customRelationship"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return "UTC";
  }
}

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCustomRelationship, setShowCustomRelationship] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

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
      email: "",
      password: "",
      confirmPassword: "",
      babyName: "",
      relationship: undefined,
      customRelationship: "",
      timezone: detectUserTimezone(),
      language: language, // This will be 'ko' for Korean browsers, 'en' for others
    },
  });

  const dueDate = watch("dueDate");
  const relationship = watch("relationship");

  // Synchronize language selection with browser language detection
  useEffect(() => {
    setValue("language", language);
  }, [language, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { confirmPassword, ...signupData } = data;
      return apiRequest("POST", "/api/auth/signup", {
        username: signupData.username,
        email: signupData.email,
        password: signupData.password,
        babyName: signupData.babyName,
        babyDueDate: signupData.dueDate,
        relationship:
          signupData.relationship === "other"
            ? signupData.customRelationship
            : signupData.relationship,
        timezone: signupData.timezone,
        language: signupData.language || "en",
      });
    },
    onSuccess: (response: any) => {
      setEmailError(null); // Clear any email error

      // Store token in localStorage for authentication
      if (response.token) {
        localStorage.setItem("authToken", response.token);

        // Set authorization header for future requests
        const event = new CustomEvent("authTokenChanged", {
          detail: response.token,
        });
        window.dispatchEvent(event);

        // Invalidate auth queries to refresh user state
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }

      toast({
        title: "Account created successfully!",
        description: "Welcome to prena tale! Enjoy your fairy tales...",
      });

      // Small delay to ensure auth state is updated before navigation
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: Error) => {
      // Check if it's a duplicate email error
      if (
        error.message.includes("User already exists") ||
        error.message.includes("already exists")
      ) {
        setEmailError(t("emailAlreadyExists"));
      } else {
        // For other errors, show toast
        toast({
          title: t("accountCreationFailed"),
          description: error.message || t("accountCreationError"),
          variant: "destructive",
        });
      }
    },
  });

  function onSubmit(data: FormValues) {
    // Clear email error before attempting signup
    setEmailError(null);
    mutation.mutate(data);
  }

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

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
      <div className="px-4 py-4 pb-20">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/signup-choice")}
            className="flex items-center gap-2 p-0 text-gray-custom hover:text-lavender mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-[#9680c21a]">
              <User className="w-8 h-8 text-lavender" />
            </div>
            <h2 className="text-2xl font-heading text-gray-custom font-semibold mb-2">
              {t("createAccount")}
            </h2>
            <p className="text-muted-custom">{t("embarkOnAdventure")}</p>
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-gray-custom font-medium"
              >
                {t("username")}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t("enterUsername")}
                {...register("username")}
                className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender"
              />
              {errors.username && (
                <p className="text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-custom font-medium">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("enterEmailAddress")}
                {...register("email", {
                  onChange: () => setEmailError(null), // Clear email error when user types
                })}
                className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-custom font-medium"
              >
                {t("password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("createPassword")}
                  {...register("password")}
                  className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
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
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-gray-custom font-medium"
              >
                {t("confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("confirmYourPassword")}
                  {...register("confirmPassword")}
                  className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-custom" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-custom" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="babyName"
                className="text-gray-custom font-medium"
              >
                {t("babyName")}
              </Label>
              <Input
                id="babyName"
                placeholder={t("enterBabyName")}
                {...register("babyName")}
                className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender"
              />
              {errors.babyName && (
                <p className="text-sm text-red-500">
                  {errors.babyName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-custom font-medium">
                {t("dueDate")}
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 justify-start text-left font-normal rounded-xl border-border",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      language === "ko" 
                        ? format(dueDate, "yyyy.MM.dd")
                        : format(dueDate, "PPP")
                    ) : t("pickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white shadow-lg border border-gray-200"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      if (date) {
                        setValue("dueDate", date);
                        setCalendarOpen(false); // Close the calendar when a date is selected
                      }
                    }}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    className="bg-white"
                    locale={language === "ko" ? ko : undefined}
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-gray-custom font-medium">
                {t("yourRelationshipToBaby")}
              </Label>
              <RadioGroup
                value={relationship}
                onValueChange={(value) => {
                  setValue("relationship", value as "mom" | "dad" | "other");
                  setShowCustomRelationship(value === "other");
                }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mom" id="mom" />
                  <Label htmlFor="mom" className="text-gray-custom">
                    {t("mom")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dad" id="dad" />
                  <Label htmlFor="dad" className="text-gray-custom">
                    {t("dad")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="text-gray-custom">
                    {t("other")}
                  </Label>
                </div>
              </RadioGroup>
              {errors.relationship && (
                <p className="text-sm text-red-500">
                  {errors.relationship.message}
                </p>
              )}
            </div>

            {showCustomRelationship && (
              <div className="space-y-2">
                <Label
                  htmlFor="customRelationship"
                  className="text-gray-custom font-medium"
                >
                  {t("specifyRelationship")}
                </Label>
                <Input
                  id="customRelationship"
                  placeholder={t("relationshipPlaceholder")}
                  {...register("customRelationship")}
                  className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender"
                />
                {errors.customRelationship && (
                  <p className="text-sm text-red-500">
                    {errors.customRelationship.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-custom font-medium">
                {t("preferredLanguage")}
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("language", value as "ko" | "en")
                }
                value={watch("language")}
              >
                <SelectTrigger className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender">
                  <SelectValue placeholder={t("selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-sm text-red-500">
                  {errors.language.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-custom font-medium">
                {t("timezone")}
              </Label>
              <Select
                onValueChange={(value) => setValue("timezone", value)}
                value={watch("timezone")}
              >
                <SelectTrigger className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="America/New_York">
                    🇺🇸 Eastern Time (UTC-5)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    🇺🇸 Central Time (UTC-6)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    🇺🇸 Mountain Time (UTC-7)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    🇺🇸 Pacific Time (UTC-8)
                  </SelectItem>
                  <SelectItem value="Europe/London">
                    🇬🇧 London (UTC+0)
                  </SelectItem>
                  <SelectItem value="Europe/Paris">🇫🇷 Paris (UTC+1)</SelectItem>
                  <SelectItem value="Europe/Berlin">
                    🇩🇪 Berlin (UTC+1)
                  </SelectItem>
                  <SelectItem value="Europe/Moscow">
                    🇷🇺 Moscow (UTC+3)
                  </SelectItem>
                  <SelectItem value="Asia/Tokyo">🇯🇵 Tokyo (UTC+9)</SelectItem>
                  <SelectItem value="Asia/Seoul">🇰🇷 Seoul (UTC+9)</SelectItem>
                  <SelectItem value="Asia/Shanghai">
                    🇨🇳 Shanghai (UTC+8)
                  </SelectItem>
                  <SelectItem value="Asia/Hong_Kong">
                    🇭🇰 Hong Kong (UTC+8)
                  </SelectItem>
                  <SelectItem value="Asia/Singapore">
                    🇸🇬 Singapore (UTC+8)
                  </SelectItem>
                  <SelectItem value="Asia/Bangkok">
                    🇹🇭 Bangkok (UTC+7)
                  </SelectItem>
                  <SelectItem value="Asia/Dubai">🇦🇪 Dubai (UTC+4)</SelectItem>
                  <SelectItem value="Asia/Kolkata">
                    🇮🇳 India (UTC+5:30)
                  </SelectItem>
                  <SelectItem value="Australia/Sydney">
                    🇦🇺 Sydney (UTC+11)
                  </SelectItem>
                  <SelectItem value="Australia/Melbourne">
                    🇦🇺 Melbourne (UTC+11)
                  </SelectItem>
                  <SelectItem value="Pacific/Auckland">
                    🇳🇿 Auckland (UTC+13)
                  </SelectItem>
                  <SelectItem value="UTC">🌍 UTC (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-sm text-red-500">
                  {errors.timezone.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t("timezoneExplanation")}
              </p>
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
                  <Label htmlFor="terms" className="text-sm text-gray-custom cursor-pointer">
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
                  <Label htmlFor="privacy" className="text-sm text-gray-custom cursor-pointer">
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

            <Button
              type="submit"
              className="w-full h-10 bg-lavender hover:bg-lavender/90 text-white rounded-xl font-medium transition focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={mutation.isPending || !termsAccepted || !privacyAccepted}
            >
              {mutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t("loading")}
                </div>
              ) : (
                t("createAccount")
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t("orSignUpWith")}
                </span>
              </div>
            </div>

            {/* Google Signup Button */}
            <GoogleLoginButton
              onGoogleLogin={handleGoogleSignup}
              isLoading={mutation.isPending}
              isSignup={true}
            />
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-custom">
              {t("alreadyHaveAccount")}{" "}
              <Button
                variant="link"
                className="text-lavender hover:text-lavender/80 p-0 h-auto text-sm font-medium"
                onClick={() => setLocation("/login")}
              >
                {t("signIn")}
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
