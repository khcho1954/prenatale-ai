
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleLoginButton from "@/components/google-login-button";
import { Bell, ArrowLeft, User, Eye, EyeOff } from "lucide-react";
import ForgotPasswordModal from "@/components/forgot-password-modal";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const queryClient = useQueryClient();
  
  useScrollToTop();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: async (response) => {
      // Clear any previous errors
      setEmailError(null);
      setPasswordError(null);
      
      // Parse the response to get the token
      const result = await response.json();
      console.log("Login response:", result);
      
      // Store the token in localStorage
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        console.log("Token stored:", result.token);
        
        // Dispatch custom event to notify other parts of the app
        const event = new CustomEvent('authTokenChanged', { detail: result.token });
        window.dispatchEvent(event);
      }
      
      // Invalidate auth query to trigger re-fetch of user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Small delay to ensure auth state is updated before navigation
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      
      // Clear previous errors
      setEmailError(null);
      setPasswordError(null);
      
      // Set specific error messages based on error content
      const errorMessage = error.message || "";
      
      if (errorMessage.includes("Email not found")) {
        setEmailError(t("emailNotFound"));
      } else if (errorMessage.includes("Invalid password")) {
        setPasswordError(t("invalidPassword"));
      } else if (errorMessage.includes("Please login with Google")) {
        setEmailError(t("loginWithGoogle"));
      } else {
        // Default to password error for other cases
        setPasswordError(errorMessage || t("invalidCredentials"));
      }
    },
  });

  function onSubmit(data: FormValues) {
    mutation.mutate(data);
  }

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
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
            onClick={() => window.history.back()}
            className="flex items-center gap-2 p-0 text-gray-custom hover:text-lavender mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Button>
          
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
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
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
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
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
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("loading")}
                </div>
              ) : (
                t("signIn")
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t("orLoginWith")}
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <GoogleLoginButton
              onGoogleLogin={handleGoogleLogin}
              isLoading={mutation.isPending}
            />
          </form>



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
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        email={getValues("email")}
      />
    </div>
  );
}
