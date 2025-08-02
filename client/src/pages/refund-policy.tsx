import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function RefundPolicy() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/help-support")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'ko' ? '뒤로' : 'Back'}
          </Button>
        </div>

        {/* Refund Policy Content */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-custom">
              <DollarSign className="h-5 w-5 text-mint" />
              {language === 'ko' ? 'prena tale 환불 정책' : 'prena tale Refund Policy'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 leading-relaxed">
              {language === 'ko' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-custom mb-3 text-base">'prena tale' 서비스 환불 정책</h3>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">1. 환불 정책의 기본 원칙</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      본 환불 정책은 <strong>'prena tale'</strong> 서비스의 월간 및 연간 구독 요금제에 적용됩니다. 회사는 공정하고 투명한 환불 절차를 제공하여 고객의 권익을 보호하고자 합니다.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">2. 환불 규정</h4>
                    <ul className="text-sm text-gray-600 space-y-2 ml-4 mb-4">
                      <li>1. <strong>구독 시작일로부터 7일 이내에 서비스를 전혀 사용하지 않은 경우에 한하여</strong> 환불이 가능합니다.</li>
                      <li>2. 구독 기간 중 한 번이라도 콘텐츠를 재생하거나 다운로드하는 등 서비스를 사용한 이력이 있을 경우, 7일 이내라도 환불이 불가능합니다.</li>
                      <li>3. <strong>구독 시작일로부터 7일이 경과한 경우에는</strong> 사용 여부와 관계없이 환불이 불가합니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">3. 구독 해지</h4>
                    <ul className="text-sm text-gray-600 space-y-2 ml-4 mb-4">
                      <li>• <strong>월간 구독 요금제 ($1.99/월):</strong> 언제든지 해지할 수 있으며, 해지 즉시 다음 결제일부터 요금이 청구되지 않습니다. 이미 결제된 현재 월의 구독료는 환불되지 않습니다.</li>
                      <li>• <strong>연간 구독 요금제 ($9.99/년):</strong> 언제든지 해지할 수 있으며, 해지 즉시 다음 결제일(1년 후)에 요금이 청구되지 않습니다. 연간 요금제는 <strong>위 2조의 규정에 따라 7일 이후에는 환불이 불가합니다.</strong></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">4. 환불 불가 사유</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      다음의 경우에는 환불이 불가합니다.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4 mb-4">
                      <li>• 서비스 이용약관을 위반하여 서비스 이용이 제한되거나 계약이 해지된 경우</li>
                      <li>• 부정 또는 불법적인 방법으로 서비스를 이용한 경우</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">5. 환불 절차</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• 구독 취소 및 환불 요청은 서비스 내 '마이페이지'에서 직접 진행할 수 있습니다.</li>
                      <li>• 환불은 요청 접수일로부터 영업일 기준 3~5일 이내에 처리됩니다.</li>
                      <li>• 결제 수단에 따라 환불 처리 기간에 차이가 있을 수 있습니다.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-custom mb-3 text-base">'prena tale' Service Refund Policy</h3>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">1. Basic Principles of the Refund Policy</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      This refund policy applies to both the monthly and annual subscription plans for the <strong>'prena tale'</strong> service. The company aims to provide a fair and transparent refund process to protect its customers' rights.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">2. Refund Regulations</h4>
                    <ul className="text-sm text-gray-600 space-y-2 ml-4 mb-4">
                      <li>1. A refund is only possible if you request it <strong>within 7 days of the subscription start date and have not used the service at all.</strong></li>
                      <li>2. If you have a history of using the service, such as playing or downloading content, a refund is not possible, even within the first 7 days.</li>
                      <li>3. <strong>After 7 days from the subscription start date, no refunds are possible</strong>, regardless of usage.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">3. Subscription Cancellation</h4>
                    <ul className="text-sm text-gray-600 space-y-2 ml-4 mb-4">
                      <li>• <strong>Monthly Subscription Plan ($1.99/month):</strong> You can cancel at any time, and you will not be charged from the next billing date. The fee for the current month that has already been paid is non-refundable.</li>
                      <li>• <strong>Annual Subscription Plan ($9.99/year):</strong> You can cancel at any time, and you will not be charged on the next billing date (one year later). According to <strong>Section 2 of these regulations, no refunds are possible after 7 days for the annual plan.</strong></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">4. Non-Refundable Cases</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      A refund is not possible in the following cases:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4 mb-4">
                      <li>• If your service use is restricted or your contract is terminated due to a violation of the Terms of Service.</li>
                      <li>• If the service has been used in a fraudulent or illegal manner.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">5. Refund Procedure</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• You can request a subscription cancellation and refund directly from the 'My Page' section of the service.</li>
                      <li>• Refunds will be processed within 3-5 business days from the date the request is received.</li>
                      <li>• The time it takes for the refund to be processed may vary depending on the payment method.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}