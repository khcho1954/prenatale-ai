import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CalendarIcon, User, Mail, Baby, Heart, Globe, Bell } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";


const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(1, "Username is required"),
  profileImageUrl: z.string().optional().nullable(),
  babyName: z.string().min(1, "Baby name is required"),
  relationship: z.enum(["mom", "dad", "other"]),
  dueDate: z.date(),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.enum(["ko", "en"]),
});

type FormValues = z.infer<typeof formSchema>;

interface User {
  id: number;
  email: string;
  username: string;
  profileImageUrl?: string;
  babyName: string;
  relationship: string;
  customRelationship?: string;
  babyDueDate: string;
  timezone: string;
  language: string;
}

// Fairy tale character avatar options
const avatarOptions = [
  { id: "princess", name: "Princess", emoji: "👸" },
  { id: "prince", name: "Prince", emoji: "🤴" },
  { id: "fairy", name: "Fairy", emoji: "🧚" },
  { id: "wizard", name: "Wizard", emoji: "🧙" },
  { id: "unicorn", name: "Unicorn", emoji: "🦄" },
  { id: "dragon", name: "Dragon", emoji: "🐉" },
  { id: "bear", name: "Bear", emoji: "🐻" },
  { id: "fox", name: "Fox", emoji: "🦊" },
  { id: "owl", name: "Owl", emoji: "🦉" },
  { id: "rabbit", name: "Rabbit", emoji: "🐰" },
  { id: "cat", name: "Cat", emoji: "🐱" },
  { id: "none", name: "No Avatar", emoji: "👤" },
];

// Popular timezone options
const timezoneOptions = [
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
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT, GMT+8)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, GMT+8)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST, GMT+1/+2)" },
  { value: "America/Toronto", label: "Toronto (EST/EDT, GMT-5/-4)" },
  { value: "America/Vancouver", label: "Vancouver (PST/PDT, GMT-8/-7)" },
];

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  


  const { data: userData } = useQuery<User>({
    queryKey: ["/api/users/me"],
    enabled: !!user,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      profileImageUrl: "",
      babyName: "",
      relationship: "mom",
      dueDate: new Date(),
      timezone: "Asia/Seoul",
      language: "en",
    },
  });



  // Update form values when user data is loaded
  useEffect(() => {
    if (userData) {
      form.reset({
        email: userData.email || "",
        username: userData.username || "",
        profileImageUrl: userData.profileImageUrl || "",
        babyName: userData.babyName || "",
        relationship: (userData.relationship as "mom" | "dad" | "other") || "mom",
        dueDate: userData.babyDueDate ? new Date(userData.babyDueDate) : new Date(),
        timezone: userData.timezone || "Asia/Seoul",
        language: (userData.language as "ko" | "en") || "en",
      });
    }
  }, [userData, form]);

  const updateAccountMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("PUT", "/api/users/profile", {
        ...data,
        babyDueDate: data.dueDate.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: t("changesSaved"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Navigate to My Page after successful update
      setTimeout(() => {
        setLocation("/mypage");
      }, 1000); // Wait 1 second for toast to show
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: t("changesSaveFailed"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    updateAccountMutation.mutate(data);
  };



  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container-mobile bg-cream min-h-screen">
      {/* Header */}
      <header className="py-3 bg-cream sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/mypage")}
              className="p-0 text-gray-custom hover:text-lavender"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-heading font-semibold text-[#4a4a4a]">
              {t("accountSettings")}
            </h1>
          </div>
          <Button variant="ghost" size="sm" className="p-2 rounded-full">
            <Bell className="w-5 h-5 text-gray-custom" />
          </Button>
        </div>
      </header>
      {/* Main Content */}
      <div className="px-4 py-4 pb-20">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-heading text-gray-custom font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-lavender" />
              {t("profileInformation")}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-custom font-medium">
                  <Mail className="h-4 w-4" />
                  {t("email")}
                </Label>
                <Input 
                  {...form.register("email")} 
                  type="email" 
                  disabled 
                  className="bg-gray-100 opacity-75 h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender" 
                />
                <p className="text-xs text-gray-500">
                  {t("emailCannotBeChanged")}
                </p>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-custom font-medium">
                  <User className="h-4 w-4" />
                  {t("username")}
                </Label>
                <Input 
                  {...form.register("username")} 
                  className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender" 
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-custom font-medium">
                  {t("profileAvatar")}
                </Label>
                <div className="grid grid-cols-6 gap-3">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => form.setValue("profileImageUrl", avatar.id === "none" ? null : avatar.id)}
                      className={`p-3 text-2xl border-2 rounded-lg transition-colors flex items-center justify-center ${
                        (form.watch("profileImageUrl") === avatar.id) || (avatar.id === "none" && !form.watch("profileImageUrl"))
                          ? "border-lavender bg-lavender/10"
                          : "border-gray-200 hover:border-lavender/50"
                      }`}
                    >
                      {avatar.id === "none" ? (
                        <User className="w-6 h-6 text-gray-500" />
                      ) : (
                        avatar.emoji
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {t("chooseAvatarDescription")}
                </p>
                {form.formState.errors.profileImageUrl && (
                  <p className="text-sm text-red-500">{form.formState.errors.profileImageUrl.message}</p>
                )}
              </div>
            </div>
          </div>



          {/* Baby Information */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-heading text-gray-custom font-semibold mb-4 flex items-center gap-2">
              <Baby className="h-5 w-5 text-lavender" />
              {t("babyInformation")}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-custom font-medium">
                  <Heart className="h-4 w-4" />
                  {t("babyName")}
                </Label>
                <Input 
                  {...form.register("babyName")} 
                  className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender" 
                />
                {form.formState.errors.babyName && (
                  <p className="text-sm text-red-500">{form.formState.errors.babyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-custom font-medium">
                  {t("relationship")}
                </Label>
                <RadioGroup
                  onValueChange={(value) => form.setValue("relationship", value as "mom" | "dad" | "other")}
                  value={form.watch("relationship")}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mom" id="mom" />
                    <Label htmlFor="mom">{t("mom")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dad" id="dad" />
                    <Label htmlFor="dad">{t("dad")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">{t("other")}</Label>
                  </div>
                </RadioGroup>
                {form.formState.errors.relationship && (
                  <p className="text-sm text-red-500">{form.formState.errors.relationship.message}</p>
                )}
                
                {/* Custom relationship input field */}
                {form.watch("relationship") === "other" && (
                  <div className="space-y-2 ml-6">
                    <Label className="text-gray-custom font-medium text-sm">
                      {t("specifyRelationship")}
                    </Label>
                    <Input 
                      {...form.register("customRelationship")} 
                      placeholder={t("relationshipPlaceholder")}
                      className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender" 
                    />
                    {form.formState.errors.customRelationship && (
                      <p className="text-sm text-red-500">{form.formState.errors.customRelationship.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-custom font-medium">
                  {t("dueDate")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender pl-3 text-left font-normal w-full ${
                        !form.watch("dueDate") && "text-muted-foreground"
                      }`}
                    >
                      {form.watch("dueDate") ? (
                        format(form.watch("dueDate"), language === "ko" ? "yyyy년 MM월 dd일" : "PPP")
                      ) : (
                        <span>{t("pickDate")}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("dueDate")}
                      onSelect={(date) => form.setValue("dueDate", date || new Date())}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-heading text-gray-custom font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-lavender" />
              {t("preferences")}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-custom font-medium">
                  {t("timezone")}
                </Label>
                <Select onValueChange={(value) => form.setValue("timezone", value)} value={form.watch("timezone")}>
                  <SelectTrigger className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.timezone && (
                  <p className="text-sm text-red-500">{form.formState.errors.timezone.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-custom font-medium">
                  {t("language")}
                </Label>
                <Select onValueChange={(value) => form.setValue("language", value as "ko" | "en")} value={form.watch("language")}>
                  <SelectTrigger className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ko">한국어 (Korean)</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.language && (
                  <p className="text-sm text-red-500">{form.formState.errors.language.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <Button
            type="submit"
            className="w-full h-10 bg-lavender hover:bg-lavender/90 text-white rounded-xl font-medium transition"
            disabled={updateAccountMutation.isPending}
          >
            {updateAccountMutation.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t("saving")}...
              </div>
            ) : (
              t("saveChanges")
            )}
          </Button>
        </form>

        {/* Password Change Link */}
        {userData && !userData.googleId && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setLocation("/settings/change-password")}
              className="text-sm text-lavender hover:text-lavender/80 hover:underline"
            >
              {t("changePassword")}
            </button>
          </div>
        )}

        {/* Delete Account Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setLocation("/settings/delete-account")}
            className="text-sm text-red-600 hover:text-red-700 hover:underline"
          >
            {t("deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}