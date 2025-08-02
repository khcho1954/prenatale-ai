
import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, ArrowLeft, User } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function SignupChoice() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

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
            onClick={() => setLocation("/mypage")}
            className="flex items-center gap-2 p-0 text-gray-custom hover:text-lavender mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Button>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-[#9680c21a]">
              <User className="w-8 h-8 text-lavender" />
            </div>
            <h2 className="font-heading text-gray-custom font-semibold mb-2 text-[20px]">
              {t("embarkOnFairyTaleJourney")}
            </h2>
            <p className="text-muted-custom">
              {t("oneMinuteSetup")}
            </p>
          </div>
        </div>

        {/* Sign Up Options */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <Button 
              onClick={() => window.location.href = '/api/auth/google'}
              variant="outline"
              className="w-full py-3 rounded-xl font-medium border border-gray-300 transition bg-white text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t("signUpWithGoogle")}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-cream text-muted-custom">{t("or")}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <Button 
              onClick={() => setLocation("/signup")}
              className="w-full py-3 bg-[#967ec4] text-white rounded-xl font-medium transition focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <User className="w-4 h-4 mr-2" />
              {t("signUpWithEmail")}
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
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
  );
}
