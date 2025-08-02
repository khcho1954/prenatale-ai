import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface PortonePaymentSimpleProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PortonePaymentSimple({ onSuccess, onCancel }: PortonePaymentSimpleProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (planType: 'monthly' | 'annual') => {
    if (!user || !(user as any).id || !(user as any).email || !(user as any).username) {
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
    <div className="grid grid-cols-2 gap-3">
      <Button
        onClick={() => handlePayment('monthly')}
        disabled={isProcessing}
        variant="outline"
        className="flex flex-col h-auto p-4 border-lavender/30 hover:bg-lavender/5 bg-transparent"
      >
        <span className="font-bold text-lavender">₩2,500</span>
        <span className="text-xs text-lavender/80">
          {language === "ko" ? "월간" : "Monthly"}
        </span>
      </Button>
      <Button
        onClick={() => handlePayment('annual')}
        disabled={isProcessing}
        className="flex flex-col h-auto p-4 bg-lavender hover:bg-lavender/90"
      >
        <span className="font-bold text-white">₩24,000</span>
        <span className="text-xs text-white/80">
          {language === "ko" ? "연간 (20% 할인)" : "Annual (20% Off)"}
        </span>
      </Button>
    </div>
  );
}