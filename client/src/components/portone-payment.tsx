import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PortonePaymentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PortonePayment({ onSuccess, onCancel }: PortonePaymentProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (planType: 'monthly' | 'annual') => {
    if (!user) {
      toast({
        title: language === "ko" ? "로그인 필요" : "Login Required",
        description: language === "ko" ? "결제를 위해 로그인해주세요" : "Please login to proceed with payment",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 포트원 결제 요청 생성
      const response = await apiRequest("POST", "/api/payment/portone/create", {
        planType,
        userId: (user as any).id,
        userEmail: (user as any).email,
        userName: (user as any).username
      });

      const responseData = await response.json();
      const { paymentId, merchantUid, amount, orderName } = responseData;

      // 포트원 SDK 동적 로드
      const PortOneModule = await import("@portone/browser-sdk/v2");
      const PortOne = (PortOneModule as any).PortOne;

      // 결제 요청
      const paymentResponse = await PortOne.requestPayment({
        storeId: import.meta.env.VITE_PORTONE_STORE_ID!,
        channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName,
        totalAmount: amount,
        currency: "KRW",
        payMethod: "CARD",
        customer: {
          customerId: (user as any).id.toString(),
          fullName: (user as any).username,
          email: (user as any).email,
        },
        redirectUrl: `${window.location.origin}/payment/complete`,
        locale: language === "ko" ? "KO" : "EN",
      });

      if (paymentResponse?.code) {
        // 결제 실패
        console.error("Payment failed:", paymentResponse);
        toast({
          title: language === "ko" ? "결제 실패" : "Payment Failed",
          description: paymentResponse.message || (language === "ko" ? "결제 처리에 실패했습니다" : "Payment processing failed"),
          variant: "destructive",
        });
      } else {
        // 결제 성공 - 서버에서 검증
        const verifyResponse = await apiRequest("POST", "/api/payment/portone/verify", {
          paymentId,
          merchantUid,
          userId: (user as any).id
        });

        const verifyData = await verifyResponse.json();
        if (verifyData.success) {
          toast({
            title: language === "ko" ? "결제 완료" : "Payment Complete",
            description: language === "ko" ? "프레나 플랜 구독이 완료되었습니다!" : "Prena Plan subscription completed!",
          });
          onSuccess?.();
        } else {
          toast({
            title: language === "ko" ? "결제 검증 실패" : "Payment Verification Failed",
            description: language === "ko" ? "결제 검증에 실패했습니다" : "Payment verification failed",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: language === "ko" ? "결제 오류" : "Payment Error",
        description: language === "ko" ? "결제 중 오류가 발생했습니다" : "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Monthly Plan */}
      <Card className="border-2 border-lavender/20 hover:border-lavender/40 transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-custom flex items-center gap-2">
              <Crown className="h-5 w-5 text-golden" />
              {language === "ko" ? "월간 플랜" : "Monthly Plan"}
            </CardTitle>
            <Badge variant="outline" className="bg-lavender/10 text-lavender border-lavender/20">
              {language === "ko" ? "인기" : "Popular"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-custom">
              ₩2,500
              <span className="text-base font-normal text-gray-600">
                /{language === "ko" ? "월" : "month"}
              </span>
            </div>
          </div>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-lavender" />
              <span>{language === "ko" ? "무제한 TTS 음성 재생" : "Unlimited TTS audio playback"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-lavender" />
              <span>{language === "ko" ? "무제한 동화 생성" : "Unlimited story creation"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-lavender" />
              <span>{language === "ko" ? "프리미엄 테마 및 캐릭터" : "Premium themes & characters"}</span>
            </li>
          </ul>

          <Button
            onClick={() => handlePayment('monthly')}
            disabled={isProcessing}
            className="w-full bg-lavender hover:bg-lavender/90 text-white"
          >
            {isProcessing ? 
              (language === "ko" ? "처리 중..." : "Processing...") : 
              (language === "ko" ? "월간 플랜 시작하기" : "Start Monthly Plan")
            }
          </Button>
        </CardContent>
      </Card>

      {/* Annual Plan */}
      <Card className="border-2 border-golden/20 hover:border-golden/40 transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-custom flex items-center gap-2">
              <Crown className="h-5 w-5 text-golden" />
              {language === "ko" ? "연간 플랜" : "Annual Plan"}
            </CardTitle>
            <Badge variant="outline" className="bg-golden/10 text-golden border-golden/20">
              {language === "ko" ? "20% 할인" : "20% Off"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-custom">
              ₩24,000
              <span className="text-base font-normal text-gray-600">
                /{language === "ko" ? "년" : "year"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {language === "ko" ? "월 ₩2,000 (₩6,000 절약)" : "₩2,000/month (Save ₩6,000)"}
            </p>
          </div>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-golden" />
              <span>{language === "ko" ? "월간 플랜의 모든 기능" : "All monthly plan features"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-golden" />
              <span>{language === "ko" ? "20% 할인 혜택" : "20% discount"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-golden" />
              <span>{language === "ko" ? "우선 고객 지원" : "Priority customer support"}</span>
            </li>
          </ul>

          <Button
            onClick={() => handlePayment('annual')}
            disabled={isProcessing}
            className="w-full bg-golden hover:bg-golden/90 text-white"
          >
            {isProcessing ? 
              (language === "ko" ? "처리 중..." : "Processing...") : 
              (language === "ko" ? "연간 플랜 시작하기" : "Start Annual Plan")
            }
          </Button>
        </CardContent>
      </Card>

      {onCancel && (
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          {language === "ko" ? "취소" : "Cancel"}
        </Button>
      )}
    </div>
  );
}