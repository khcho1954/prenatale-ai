import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { BookOpen, Volume2 } from "lucide-react";

interface PrenaPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'tts' | 'create';
}

export function PrenaPlanModal({ isOpen, onClose, feature }: PrenaPlanModalProps) {
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  const messages = {
    ko: {
      tts: {
        title: "프레나 플랜 필요",
        description: "TTS 음성 기능은 프레나 플랜 전용입니다.\n프레나 플랜으로 업그레이드하시겠습니까?",
      },
      create: {
        title: "프레나 플랜 필요", 
        description: "동화 생성 기능은 프레나 플랜 전용 기능입니다.\n프레나 플랜으로 업그레이드하시겠습니까?",
      },
      cancel: "돌아가기",
      subscribe: "업그레이드"
    },
    en: {
      tts: {
        title: "Prena Plan Required",
        description: "Audio playback is a Prena Plan exclusive feature.\nWould you like to upgrade to Prena Plan?",
      },
      create: {
        title: "Prena Plan Required",
        description: "Story creation is a Prena Plan exclusive feature.\nWould you like to upgrade to Prena Plan?",
      },
      cancel: "Go Back", 
      subscribe: "Upgrade"
    }
  };

  const text = messages[language] || messages.en;
  const featureText = text[feature];

  const handleSubscribe = () => {
    onClose();
    navigate('/subscription');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[85%] max-w-xs mx-auto rounded-2xl bg-white shadow-lg border-0 p-5">
        <DialogHeader className="text-center pb-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lavender/20 to-mint/20 flex items-center justify-center mx-auto mb-2">
            {feature === 'tts' ? (
              <Volume2 className="w-6 h-6 text-lavender" />
            ) : (
              <BookOpen className="w-6 h-6 text-lavender" />
            )}
          </div>
          <DialogTitle className="text-base font-heading text-gray-custom font-semibold text-center">
            {featureText.title}
          </DialogTitle>
          <DialogDescription className="text-muted-custom text-xs leading-relaxed whitespace-pre-line text-center">
            {featureText.description}
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
            onClick={handleSubscribe}
            className="flex-1 h-9 bg-lavender hover:bg-lavender/90 text-white rounded-lg font-medium text-sm transition-all"
          >
            {text.subscribe}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}