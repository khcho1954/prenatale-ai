import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function TermsOfService() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const koreanTerms = `(주)셀머 'prena tale(프레나 태교동화)' 서비스 이용약관

제1조 (목적)
본 약관은 (주)셀머(이하 "회사")가 운영하는 'prena tale(프레나 태교동화)' 온라인 태교 동화 구독 서비스(이하 "서비스")를 이용함에 있어, 회사와 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
본 약관에서 사용하는 용어의 정의는 다음과 같습니다.

"서비스": 회사가 웹사이트 및 모바일 애플리케이션을 통해 제공하는 'prena tale(프레나 태교동화)' 콘텐츠(오디오, 텍스트, 관련 정보) 및 제반 서비스를 의미합니다.

"회원": 회사의 약관에 동의하고 개인정보를 제공하여 회원으로 등록한 자로서, 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를 의미합니다.

"콘텐츠": 회사가 서비스에서 제공하는 모든 오디오, 텍스트, 이미지, 영상 등 디지털 형태의 내용을 의미합니다.

"구독": 회원이 일정 금액을 정기적으로 결제하고, 해당 기간 동안 서비스를 이용할 수 있는 권리를 부여받는 것을 의미합니다.

제3조 (약관의 효력 및 변경)
본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력이 발생합니다.

회사는 관계 법령을 위반하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.

회사가 약관을 개정할 경우, 개정된 약관은 적용일자 및 개정 사유를 명시하여 서비스 웹사이트 및 애플리케이션에 적용일 7일 전부터 공지합니다. 회원이 개정 약관에 동의하지 않는 경우 회원 탈퇴를 요청할 수 있습니다.

제4조 (회원가입)
회원가입은 회원이 약관 내용에 동의한 후 회사가 정한 가입 양식에 따라 회원정보를 기입하고 "가입" 버튼을 누르는 방법으로 이루어집니다.

회사는 제1항에 따라 회원가입 신청이 있는 경우 이를 승낙하는 것을 원칙으로 합니다. 단, 다음 각 호에 해당하는 신청에 대해서는 승낙하지 않거나, 사후에 이용 계약을 해지할 수 있습니다.

가입 신청 시 타인의 명의를 도용하거나 허위 정보를 기재한 경우

회원의 귀책 사유로 인해 승인이 불가능한 경우

제5조 (개인정보보호)
회사는 「개인정보보호법」 등 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.

제6조 (구독 및 결제)
서비스의 구독은 회사가 정한 요금제를 선택하고 결제 수단을 등록함으로써 시작됩니다.

회사는 회원이 정한 결제 수단을 통해 매월 또는 매년 자동 결제를 진행하며, 결제일은 최초 결제일과 동일한 날짜로 자동 갱신됩니다.

결제 금액 및 결제 방식의 변경은 서비스 내 '마이페이지'에서 할 수 있습니다.

제7조 (청약철회 및 환불)
회원은 구독 시작일로부터 7일 이내에 서비스를 전혀 이용하지 않은 경우에 한하여 청약철회 및 환불을 요청할 수 있습니다.

구독 시작일로부터 7일이 경과한 경우에는 환불이 불가합니다.

회원이 서비스 이용약관을 위반하거나 불법적인 방법으로 서비스를 이용한 경우, 회사는 즉시 해당 회원의 서비스 이용을 제한할 수 있으며, 이 경우 환불은 불가합니다.

제8조 (콘텐츠 저작권 및 이용)
서비스에서 제공하는 모든 콘텐츠에 대한 저작권 및 기타 지식재산권은 회사 또는 콘텐츠 제공자에게 귀속됩니다.

회원은 서비스를 개인적, 비상업적인 목적으로만 이용할 수 있으며, 회사의 사전 동의 없이 콘텐츠를 복제, 전송, 출판, 배포, 방송하는 등의 행위를 할 수 없습니다.

위반 시 회사는 관계 법령에 따라 민/형사상의 책임을 물을 수 있습니다.

제9조 (이용자의 의무)
회원은 관계 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 회사가 공지하거나 통지하는 사항 등을 준수하여야 합니다.

회원은 다음 각 호에 해당하는 행위를 해서는 안 됩니다.

다른 회원의 개인정보를 도용하거나 타인의 명의를 사용하는 행위

서비스 내에서 불법적인 콘텐츠를 유포하거나 게시하는 행위

회사의 지식재산권을 침해하는 행위

제10조 (면책 조항)
회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.

회사는 'prena tale(프레나 태교동화)' 서비스에서 제공하는 콘텐츠가 어떠한 의학적 효능이나 치료 목적을 가지지 않으며, 특정 효과를 보장하는 것도 아님을 명시합니다. 모든 콘텐츠는 임산부와 태아의 정서적 교감 및 교육, 안정감을 증진하기 위한 보조적 목적으로 제공됩니다. 따라서 회원은 서비스 이용으로 발생하는 개인의 모든 문제에 대하여 회사가 제공한 정보만을 의존해서는 안 됩니다.

제11조 (분쟁 해결)
본 약관은 대한민국 법률에 따라 규율되고 해석됩니다.

서비스 이용과 관련하여 회사와 회원 간에 분쟁이 발생할 경우, 소송은 민사소송법상 회사의 본점 소재지 관할 법원을 전속 관할로 합니다.

부칙
(시행일) 본 약관은 2025년 7월 14일부터 시행합니다.`;

  const englishTerms = `Sellma Co., Ltd. 'prena tale' Service Terms of Service

Article 1 (Purpose)
These Terms of Service (hereinafter referred to as "Terms") govern the rights, obligations, and responsibilities of the company and its members when using the online prenatal story subscription service (hereinafter referred to as "Service") operated by Sellma Co., Ltd. (hereinafter referred to as "the Company").

Article 2 (Definitions)
The terms used in these Terms are defined as follows:

"Service": Refers to all digital content and related services provided by the Company through its website and mobile application, including 'prena tale' (prenatal story) content (audio, text, related information).

"Member": Refers to an individual who agrees to the Company's Terms and registers as a member by providing personal information, and who can continuously use the Service.

"Content": Refers to all digital forms of content, including audio, text, images, and videos, provided by the Company through the Service.

"Subscription": Refers to the right granted to a member to use the Service for a specified period in exchange for a regular payment.

Article 3 (Effectiveness and Amendment of the Terms)
These Terms become effective for all members who wish to use the Service.

The Company may amend these Terms within the scope of relevant laws.

If the Company amends the Terms, it will post the effective date and reason for the amendment on the Service's website and application at least 7 days before the effective date. If a member does not agree to the amended Terms, they may request to withdraw from membership.

Article 4 (Membership Registration)
Membership registration is completed when a member agrees to the Terms, fills out the registration form provided by the Company, and clicks the "Sign Up" button.

The Company will, in principle, accept membership applications submitted in accordance with Paragraph 1. However, the Company may refuse to accept or terminate the membership agreement after acceptance in the following cases:

If the application uses another person's name or provides false information.

If the member is unable to be approved due to a reason attributable to them.

Article 5 (Protection of Personal Information)
The Company endeavors to protect members' personal information in accordance with relevant laws, including the Personal Information Protection Act. The protection and use of personal information are governed by the relevant laws and the Company's Privacy Policy.

Article 6 (Subscription and Payment)
A Service subscription begins upon the member selecting a pricing plan and registering a payment method.

The Company will process automatic payments monthly or annually through the payment method designated by the member, and the payment date will be automatically renewed to the same date as the initial payment.

Changes to the payment amount and method can be made on the 'My Page' section of the Service.

Article 7 (Subscription Withdrawal and Refund)
A member may request a subscription withdrawal and refund only within 7 days of the subscription start date and if the Service has not been used at all.

No refunds are possible after 7 days from the subscription start date.

If a member violates these Terms or uses the Service in an illegal manner, the Company may immediately restrict the member's use of the Service, and in such cases, no refund will be provided.

Article 8 (Content Copyright and Use)
The copyrights and other intellectual property rights to all content provided in the Service belong to the Company or the content provider.

A member may only use the Service for personal, non-commercial purposes and may not copy, transmit, publish, distribute, or broadcast the content without the Company's prior consent.

In case of violation, the Company may seek civil and criminal liability in accordance with relevant laws.

Article 9 (Member's Obligations)
Members must comply with relevant laws, the provisions of these Terms, usage guidelines, and any notices or announcements from the Company related to the Service.

Members must not engage in any of the following acts:

Stealing or using another member's personal information or name.

Spreading or posting illegal content within the Service.

Infringing on the Company's intellectual property rights.

Article 10 (Disclaimer)
The Company shall not be held responsible for the failure to provide the Service in the event of a natural disaster or other force majeure events.

The Company explicitly states that the content provided by the 'prena tale' (prenatal story) Service does not have any medical efficacy or therapeutic purpose and does not guarantee any specific effects. All content is provided solely for the supplementary purpose of promoting emotional connection, education, and stability for the expectant mother and fetus. Therefore, members should not rely solely on the information provided by the Company for any personal issues that may arise from using the Service.

Article 11 (Dispute Resolution)
These Terms shall be governed by and interpreted in accordance with the laws of the Republic of Korea.

Any dispute arising between the Company and a member in connection with the use of the Service shall be subject to the exclusive jurisdiction of the court having jurisdiction over the location of the Company's head office, as determined by the Civil Procedure Act.

Addendum
(Effective Date) These Terms shall take effect on July 14, 2025.`;

  return (
    <div className="min-h-screen bg-cream">
      <div className="px-4 py-4 max-w-full">
        {/* Header */}
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/help-support")}
            className="p-2 hover:bg-gray-100 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h1 className="text-xl font-bold text-gray-custom">
            {language === 'ko' ? '서비스 이용약관' : 'Terms of Service'}
          </h1>
        </div>

        {/* Terms Content Card */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-custom">
              <FileText className="h-5 w-5 text-mint" />
              {language === 'ko' ? 'prena tale 서비스 이용약관 전문' : 'prena tale Service Terms of Service'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 leading-relaxed">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {language === 'ko' ? koreanTerms : englishTerms}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="pb-4">
          <Button
            onClick={() => setLocation("/help-support")}
            className="w-full bg-lavender hover:bg-lavender/90 text-white py-3"
          >
            {language === 'ko' ? '도움말 및 지원으로 돌아가기' : 'Back to Help & Support'}
          </Button>
        </div>
      </div>
    </div>
  );
}