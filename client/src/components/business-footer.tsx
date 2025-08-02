import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function BusinessFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();

  const businessInfo = {
    ko: {
      company: "셀머 사업자 정보",
      ceo: "대표이사: 조은상",
      businessNumber: "사업자등록번호: 266-62-00613",
      telecomNumber: "통신판매업신고번호: 2023-서울성북-0852호",
      address: "주소: 서울시 성북구 성북로4길 52, 206-504",
      serviceInquiry: "서비스 이용 문의: contact@prenatale.ai",
      privacyInquiry: "개인정보보호 관련 문의: privacy@prenatale.ai",
      phone: "문의 전화: 010-3048-6442",
      hosting: "호스팅 제공자: Vercel",
      website: "웹사이트: https://prenatale.ai",
      email: "이메일: contact@prenatale.ai",
    },
    en: {
      company: "Sellma Business Info",
      ceo: "CEO: Cho Eun-sang",
      businessNumber: "Business Registration Number: 266-62-00613",
      telecomNumber:
        "Telecommunications Sales Report Number: 2023-Seoul Seongbuk-0852",
      address: "Address: Seoul Seongbuk-gu Seongbuk-ro 4-gil 52, 206-504",
      serviceInquiry: "Service Inquiry: contact@prenatale.ai",
      privacyInquiry: "Privacy Inquiry: privacy@prenatale.ai",
      phone: "Phone: 010-3048-6442",
      hosting: "Hosting Provider: Vercel",
      website: "Website: https://prenatale.ai",
      email: "Email: contact@prenatale.ai",
    },
  };

  const info = businessInfo[language] || businessInfo.en;

  return (
    <footer className="bg-cream border-t border-gray-200 py-4 px-4 mb-20">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-gray-600 text-sm font-medium focus:outline-none"
        >
          <span>{info.company}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-1 text-xs text-gray-500 leading-relaxed">
            <div>{info.ceo}</div>
            <div>{info.businessNumber}</div>
            <div>{info.telecomNumber}</div>
            <div>{info.address}</div>
            <div>{info.serviceInquiry}</div>
            <div>{info.privacyInquiry}</div>
            <div>{info.phone}</div>
            <div>{info.website}</div>
            <div>{info.email}</div>
            <div>{info.hosting}</div>
          </div>
        )}
      </div>
    </footer>
  );
}
