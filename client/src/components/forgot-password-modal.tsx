import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Mail, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

export default function ForgotPasswordModal({
  open,
  onClose,
  email,
}: ForgotPasswordModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"explanation" | "confirmation">("explanation");

  const handleSendReset = () => {
    setStep("confirmation");
  };

  const handleClose = () => {
    setStep("explanation");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[85%] max-w-xs mx-auto rounded-2xl bg-white shadow-lg border-0 p-5">
        {step === "explanation" ? (
          <>
            <DialogHeader className="text-center pb-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lavender/20 to-mint/20 flex items-center justify-center mx-auto mb-2">
                <Mail className="w-6 h-6 text-lavender" />
              </div>
              <DialogTitle className="text-base font-heading text-gray-custom font-semibold text-center">
                {t("forgotPasswordTitle")}
              </DialogTitle>
              <DialogDescription className="text-muted-custom text-xs leading-relaxed text-center mt-1">
                {t("forgotPasswordDescription")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3">
              {email && (
                <div className="p-3 bg-lavender/5 rounded-lg border border-lavender/20">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <AlertCircle className="h-3 w-3 text-lavender" />
                    <span>{t("emailAddress")}: <strong>{email}</strong></span>
                  </div>
                </div>
              )}
              
              
              
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-9 rounded-lg font-medium text-sm border-gray-200 hover:bg-gray-50 transition-all"
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleSendReset}
                  className="flex-1 h-9 bg-lavender hover:bg-lavender/90 text-white rounded-lg font-medium text-sm transition-all"
                >
                  {t("sendResetEmail")}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center pb-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mint/20 to-lavender/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6 text-mint" />
              </div>
              <DialogTitle className="text-base font-heading text-gray-custom font-semibold">
                {t("resetEmailSent")}
              </DialogTitle>
              <DialogDescription className="text-muted-custom text-xs leading-relaxed text-center mt-1">
                {t("checkYourEmail")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3">
              {email && (
                <div className="p-3 bg-mint/5 rounded-lg border border-mint/20">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="h-3 w-3 text-mint" />
                    <span>{t("sentTo")}: <strong>{email}</strong></span>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-600 space-y-1">
                <p>{t("emailSentInstructions")}</p>
                <p className="text-xs text-gray-500">{t("checkSpamFolder")}</p>
              </div>
              
              <Button
                onClick={handleClose}
                className="w-full h-9 bg-mint hover:bg-mint/90 text-white rounded-lg font-medium text-sm transition-all"
              >
                {t("understood")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}