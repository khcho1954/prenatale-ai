import React from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const handleLogin = () => {
    onClose();
    setLocation("/login");
  };

  const messages = {
    ko: {
      title: "로그인 필요",
      description: "오늘의 동화를 읽기 위해서는 로그인이 필요합니다.\n로그인 하시겠습니까?",
      cancel: "돌아가기",
      login: "로그인"
    },
    en: {
      title: "Login Required",
      description: "You need to log in to read today's fairy tales.\nWould you like to log in?",
      cancel: "Go Back",
      login: "Login"
    }
  };

  const text = messages[language] || messages.en;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[85%] max-w-xs mx-auto rounded-2xl bg-white shadow-lg border-0 p-5">
        <DialogHeader className="text-center pb-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lavender/20 to-mint/20 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-6 h-6 text-lavender" />
          </div>
          <DialogTitle className="text-base font-heading text-gray-custom font-semibold text-center">
            {text.title}
          </DialogTitle>
          <DialogDescription className="text-muted-custom text-xs leading-relaxed whitespace-pre-line text-center">
            {text.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mt-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-9 rounded-lg font-medium text-sm border-gray-200 hover:bg-gray-50 transition-all"
          >
            {text.cancel}
          </Button>
          <Button
            onClick={handleLogin}
            className="flex-1 h-9 bg-lavender hover:bg-lavender/90 text-white rounded-lg font-medium text-sm transition-all"
          >
            {text.login}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}