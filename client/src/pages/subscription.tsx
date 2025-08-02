import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Crown, Check, Gift, Sparkles, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { PortonePaymentSimple } from "@/components/portone-payment-simple";

export default function Subscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAgreement, setCancelAgreement] = useState(false);
  
  // 포트원 결제 시스템 활성화 여부 확인
  const isPortoneEnabled = !!(
    import.meta.env.VITE_PORTONE_STORE_ID &&
    import.meta.env.VITE_PORTONE_CHANNEL_KEY
  );

  const upgradeMutation = useMutation({
    mutationFn: async (planType: "monthly" | "yearly") => {
      return await apiRequest("POST", "/api/subscription/create", { planType });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: t("subscriptionSuccess"),
      });
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || t("subscriptionError"),
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscription/cancel");
    },
    onSuccess: () => {
      setShowCancelModal(false);
      setCancelAgreement(false);
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: t("subscriptionError"),
        variant: "destructive",
      });
    },
  });

  const couponMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest("POST", "/api/coupons/apply", { couponCode: code });
    },
    onSuccess: (data) => {
      setCouponCode("");
      setCouponError("");
      
      // Show success message immediately
      toast({
        title: language === "ko" ? "쿠폰 적용 완료" : "Coupon Applied",
        description: language === "ko" ? "프레나 플랜이 활성화되었습니다!" : "Prena Plan has been activated!",
        className: "bg-soft-green text-white border-soft-green",
      });
      
      // Refresh user data to show updated subscription
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Wait for cache refresh and then refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
        // Dispatch auth token changed event to update all components
        window.dispatchEvent(new CustomEvent('authTokenChanged'));
      }, 500);
    },
    onError: (error: any) => {
      // Map specific error messages to appropriate translations
      let errorMessage = t("couponFailed");
      const errorText = error.message || "";
      
      if (errorText.includes("Invalid coupon") || errorText.includes("not found") || errorText.includes("유효하지 않은 쿠폰 코드")) {
        errorMessage = t("couponInvalid");
      } else if (errorText.includes("expired") || errorText.includes("만료된 쿠폰")) {
        errorMessage = t("couponExpired");
      } else if (errorText.includes("usage limit") || errorText.includes("Coupon usage limit reached") || errorText.includes("already been fully used") || errorText.includes("사용 한도가 초과된 쿠폰")) {
        errorMessage = t("couponUsageLimitReached");
      } else if (errorText.includes("이미 사용한 쿠폰") || errorText.includes("already used this coupon")) {
        errorMessage = t("couponAlreadyUsed");
      } else if (errorText.includes("not active") || errorText.includes("비활성 쿠폰")) {
        errorMessage = t("couponNotActive");
      } else if (errorText.includes("already has an active subscription")) {
        errorMessage = t("alreadyHasSubscription");
      }
      
      setCouponError(errorMessage);
    },
  });

  const handleUpgrade = (planType: "monthly" | "yearly") => {
    setIsProcessing(true);
    upgradeMutation.mutate(planType);
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (cancelAgreement) {
      cancelMutation.mutate();
    }
  };

  const handleCouponApply = () => {
    if (!couponCode.trim()) {
      setCouponError(t("fillAllFields"));
      return;
    }
    setCouponError("");
    couponMutation.mutate(couponCode.trim());
  };

  const formatDate = (date: string) => {
    if (language === "ko") {
      const d = new Date(date);
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    }
    return new Date(date).toLocaleDateString("en-US");
  };

  const freeFeatures = [
    t("freeFeature1"),
    t("freeFeature2"),
    t("freeFeature3"),
    t("freeFeature4"),
  ];

  const prenaFeatures = [
    ...freeFeatures,
    t("prenaFeature1"),
    t("prenaFeature2"),
    t("prenaFeature3"),
    t("prenaFeature4"),
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/mypage")}
            className="rounded-full hover:bg-lavender/10"
          >
            <ArrowLeft className="h-5 w-5 text-gray-custom" />
          </Button>
          <h1 className="text-xl font-bold text-gray-custom">
            {t("subscriptionManagement")}
          </h1>
        </div>

        {/* Current Plan */}
        <Card className="mb-6 bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-custom">
                {t("currentPlan")}
              </CardTitle>
              <Badge 
                variant="secondary" 
                className="bg-lavender/10 text-lavender border-lavender/20"
              >
                {user?.subscriptionPlan === "prena" ? t("prenaPlan") : t("freePlan")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {user?.subscriptionPlan === "prena" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-golden" />
                  <span className="font-medium text-gray-custom">
                    {t("prenaPlan")}
                  </span>
                </div>
                {user?.subscriptionEndDate && (
                  <p className="text-sm text-gray-600">
                    {language === "ko" ? "구독기간" : "Expires"}: {formatDate(user.subscriptionEndDate)}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {t("upgradePlanMessage")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Free Plan Features */}
        <Card className="mb-4 bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-custom">
              {t("freePlan")}
              <Badge variant="secondary" className="bg-mint/10 text-mint border-mint/20">
                $0
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-soft-green" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Prena Plan Features */}
        <Card className="rounded-lg border text-card-foreground mb-6 from-lavender/5 to-coral/5 border-lavender/20 shadow-sm bg-[#ffffff]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-custom">
              <Sparkles className="h-5 w-5 text-lavender" />
              {t("prenaPlan")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              {prenaFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-soft-green" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            {user?.subscriptionPlan !== "prena" && (
              <div className="space-y-4">
                {isPortoneEnabled ? (
                  // 포트원 결제 시스템 사용
                  <PortonePaymentSimple 
                    onSuccess={() => {
                      setIsProcessing(false);
                      // Refresh user data
                      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
                    }}
                    onCancel={() => setIsProcessing(false)}
                  />
                ) : (
                  // 기존 결제 시스템 (개발/테스트용)
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleUpgrade("monthly")}
                      disabled={isProcessing || upgradeMutation.isPending}
                      variant="outline"
                      className="flex flex-col h-auto p-4 border-lavender/30 hover:bg-lavender/5 bg-transparent"
                    >
                      <span className="font-bold text-lavender">$1.99</span>
                      <span className="text-xs text-lavender/80">
                        {t("monthly")}
                      </span>
                    </Button>
                    <Button
                      onClick={() => handleUpgrade("yearly")}
                      disabled={isProcessing || upgradeMutation.isPending}
                      className="flex flex-col h-auto p-4 bg-lavender hover:bg-lavender/90"
                    >
                      <span className="font-bold text-white">$9.99</span>
                      <span className="text-xs text-white/80">
                        {t("yearlyDiscount")}
                      </span>
                    </Button>
                  </div>
                )}
                
                {/* 포트원 연동 상태 표시 */}
                {!isPortoneEnabled && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      {language === "ko" ? "포트원 결제 시스템 연동 준비 중" : "PortOne payment system setup in progress"}
                    </p>
                  </div>
                )}
                
                
                {/* Coupon Section */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="h-4 w-4 text-coral" />
                    <h4 className="font-medium text-sm text-gray-custom">
                      {t("haveCoupon")}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={t("enterCouponCode")}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 border-gray-300 focus:border-lavender focus:ring-lavender"
                      />
                      <Button
                        onClick={handleCouponApply}
                        disabled={couponMutation.isPending || !couponCode.trim()}
                        size="sm"
                        variant="outline"
                        className="border-lavender/30 text-lavender hover:bg-lavender/5"
                      >
                        {couponMutation.isPending ? t("applying") : t("applyCoupon")}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-500 mt-1">
                        {couponError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Cancellation - moved to bottom */}
        {user?.subscriptionPlan === "prena" && (
          <div className="mt-8 text-center">
            <button
              onClick={handleCancel}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {language === "ko" ? "구독 취소" : "Cancel Subscription"}
            </button>
          </div>
        )}

        {/* Cancellation Modal */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="max-w-md mx-auto bg-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <DialogTitle className="text-lg text-gray-custom">
                  {language === "ko" ? "구독 취소 확인" : "Confirm Subscription Cancellation"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-gray-600 text-left space-y-3">
                <p>
                  {language === "ko" 
                    ? "구독을 취소하시면 다음 결제일부터 결제가 이루어지지 않습니다."
                    : "When you cancel your subscription, you will not be charged from the next billing date."
                  }
                </p>
                <p>
                  {language === "ko"
                    ? "구독을 취소하더라도 현재 연간/월간 결제된 일자까지는 계속 이용이 가능합니다."
                    : "Even after cancellation, you can continue using the service until your current billing period ends."
                  }
                </p>
                <p>
                  {language === "ko"
                    ? "현재 연간/월간 결제된 내역에 대해서는 환불이 불가능합니다."
                    : "Refunds are not available for the current billing period."
                  }
                </p>
                <p className="font-medium text-red-600">
                  {language === "ko"
                    ? "구독 취소 후에는 되돌리기가 불가능합니다."
                    : "Subscription cancellation cannot be undone."
                  }
                </p>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center space-x-2 my-4">
              <Checkbox 
                id="cancel-agreement"
                checked={cancelAgreement}
                onCheckedChange={(checked) => setCancelAgreement(checked === true)}
              />
              <label 
                htmlFor="cancel-agreement" 
                className="text-sm text-gray-600 cursor-pointer"
              >
                {language === "ko"
                  ? "위 내용을 이해했으며 구독 취소에 동의합니다"
                  : "I understand the above terms and agree to cancel my subscription"
                }
              </label>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelAgreement(false);
                }}
                className="flex-1"
              >
                {language === "ko" ? "취소" : "Keep Subscription"}
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={!cancelAgreement || cancelMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                {cancelMutation.isPending 
                  ? (language === "ko" ? "처리 중..." : "Processing...") 
                  : (language === "ko" ? "구독 취소" : "Cancel Subscription")
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}