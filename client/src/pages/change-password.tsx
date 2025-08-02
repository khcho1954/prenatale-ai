import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ChangePassword() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const { user: userData } = useAuth();
  const { toast } = useToast();
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response;
    },
    onSuccess: () => {
      form.reset();
      setLocation("/settings/account");
    },
    onError: (error: Error) => {
      if (error.message.includes("Current password is incorrect")) {
        form.setError("currentPassword", { 
          message: t("incorrectCurrentPassword") 
        });
      } else {
        toast({
          title: t("passwordChangeFailed"),
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  // Redirect Google users back to account settings
  if (userData && (userData as any).googleId) {
    setLocation("/settings/account");
    return null;
  }

  return (
    <div className="container-mobile bg-cream min-h-screen">
      {/* Header */}
      <header className="py-3 bg-cream sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 text-gray-custom hover:text-lavender"
              onClick={() => setLocation("/settings/account")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-heading font-semibold text-[#4a4a4a]">
              {t("changePassword")}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4 pb-20">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-6 w-6 text-lavender" />
              <h2 className="text-lg font-heading text-gray-custom font-semibold">
                {t("changePassword")}
              </h2>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-custom font-medium">
                {t("currentPassword")}
              </Label>
              <div className="relative">
                <Input
                  {...form.register("currentPassword")}
                  type={showCurrentPassword ? "text" : "password"}
                  className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender pr-10"
                  placeholder={t("currentPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-custom" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-custom" />
                  )}
                </Button>
              </div>
              {form.formState.errors.currentPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-custom font-medium">
                {t("newPassword")}
              </Label>
              <div className="relative">
                <Input
                  {...form.register("newPassword")}
                  type={showNewPassword ? "text" : "password"}
                  className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender pr-10"
                  placeholder={t("newPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-custom" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-custom" />
                  )}
                </Button>
              </div>
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-custom font-medium">
                {t("confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  {...form.register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  className="h-10 rounded-xl border-border focus:border-lavender focus:ring-lavender pr-10"
                  placeholder={t("confirmPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-custom" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-custom" />
                  )}
                </Button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full bg-lavender hover:bg-lavender/90 text-white h-10 rounded-xl font-medium"
              >
                {changePasswordMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("saving")}...
                  </div>
                ) : (
                  t("changePassword")
                )}
              </Button>
            </div>
          </form>

          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {language === "ko" ? "비밀번호 변경 안내" : "Password Change Guidelines"}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• {language === "ko" ? "비밀번호는 최소 8자 이상이어야 합니다" : "Password must be at least 8 characters"}</li>
              <li>• {language === "ko" ? "현재 비밀번호를 정확히 입력해주세요" : "Enter your current password correctly"}</li>
              <li>• {language === "ko" ? "새 비밀번호를 확인란에 다시 입력해주세요" : "Confirm your new password in the confirmation field"}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}