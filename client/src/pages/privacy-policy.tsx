import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";



export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

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
            {language === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
          </h1>
        </div>

        {/* Privacy Policy Content Card */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-custom">
              <Shield className="h-5 w-5 text-mint" />
              {language === 'ko' ? 'prena tale 개인정보처리방침' : 'prena tale Privacy Policy'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 leading-relaxed">
              {language === 'ko' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-custom mb-3 text-base">(주)셀머 'prena tale(프레나 태교동화)' 개인정보 처리방침</h3>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제1조 (총칙)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      (주)셀머(이하 "회사")는 'prena tale(프레나 태교동화)' 서비스(이하 "서비스")를 운영함에 있어 회원의 개인정보를 중요시하며, 「개인정보보호법」 및 관련 법령을 준수하고 있습니다. 본 개인정보 처리방침은 회사가 어떤 정보를 수집하고, 수집한 정보를 어떻게 사용하며, 정보 보호를 위해 어떤 노력을 하는지 명시하고 있습니다.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제2조 (개인정보 수집 항목 및 목적)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      회사는 서비스 제공, 회원 관리, 상담 및 통계 분석을 위해 다음과 같은 개인정보를 수집 및 이용합니다.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">구분</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">수집 항목</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">수집 및 이용 목적</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">회원 가입 및 관리</td>
                            <td className="border border-gray-300 px-3 py-2">이름, 이메일 주소, 비밀번호</td>
                            <td className="border border-gray-300 px-3 py-2">회원 식별, 서비스 이용 계약 이행, 고객 상담 및 민원 처리</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">서비스 제공</td>
                            <td className="border border-gray-300 px-3 py-2">결제 정보(카드번호, 휴대전화번호), 결제 기록</td>
                            <td className="border border-gray-300 px-3 py-2">유료 서비스 이용에 대한 요금 정산, 콘텐츠 제공</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">고객 문의</td>
                            <td className="border border-gray-300 px-3 py-2">이름, 이메일 주소, 문의 내용</td>
                            <td className="border border-gray-300 px-3 py-2">고객 문의사항 확인 및 답변, 서비스 개선</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">통계 분석</td>
                            <td className="border border-gray-300 px-3 py-2">접속 IP, 쿠키, 서비스 이용 기록</td>
                            <td className="border border-gray-300 px-3 py-2">서비스 이용 분석, 접속 빈도 파악, 서비스 개선</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제3조 (개인정보 보유 및 이용기간)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 따라 보존해야 하는 정보는 해당 법령에서 정한 기간 동안 보존합니다.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                      <li>• 대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                      <li>• 소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제4조 (개인정보의 제3자 제공)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      회사는 회원의 개인정보를 제1항에서 명시한 목적 이외의 용도로 사용하거나, 회원의 사전 동의 없이 외부에 제공하지 않습니다. 다만, 법령에 특별한 규정이 있거나 수사 목적으로 법정 절차에 따라 요청이 있는 경우에는 예외로 합니다.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제5조 (개인정보 처리 위탁)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm mb-3">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">수탁업체</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">위탁 업무 내용</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">(결제대행사명)</td>
                            <td className="border border-gray-300 px-3 py-2">신용카드, 휴대전화 등 결제 및 결제 확인</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">(호스팅업체명)</td>
                            <td className="border border-gray-300 px-3 py-2">서비스 운영을 위한 서버 관리 및 시스템 개발</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      위탁 계약 시 「개인정보보호법」에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 손해배상 등 책임에 관한 사항을 계약서에 명시하고 관리 감독하고 있습니다.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제6조 (개인정보 파기 절차 및 방법)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      회사는 개인정보 수집 및 이용 목적이 달성된 후에는 다음과 같은 절차 및 방법에 따라 해당 정보를 파기합니다.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• 파기 절차: 회원은 회원가입 등을 위해 입력한 정보가 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류함) 관계 법령에 따라 일정 기간 저장된 후 파기됩니다.</li>
                      <li>• 파기 방법: 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통해 파기하며, 전자적 파일 형태로 저장된 개인정보는 복구할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제7조 (이용자 및 법정대리인의 권리)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      회원은 언제든지 개인정보 열람, 정정, 삭제, 처리 정지 등을 요청할 수 있습니다. 개인정보 관리 책임자에게 서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다. 만 14세 미만 아동의 개인정보는 법정대리인의 동의를 받아야만 수집 및 이용이 가능하며, 법정대리인은 아동의 개인정보에 대한 권리를 행사할 수 있습니다.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제8조 (개인정보 보호책임자)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 회원의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• 개인정보 보호책임자: 조은상</li>
                      <li>• 연락처: 010-3048-6442, querist.jojosh@gmail.com</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제9조 (개인정보의 안전성 확보 조치)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      회사는 회원의 개인정보를 안전하게 보호하기 위해 다음과 같은 조치를 취하고 있습니다.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• 기술적 조치: 개인정보 암호화, 보안 프로그램 설치 및 주기적 업데이트, 백업 시스템 구축 등</li>
                      <li>• 관리적 조치: 개인정보 취급 직원의 최소화 및 정기적인 교육, 내부 관리 계획 수립 및 시행 등</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">제10조 (정책 변경에 따른 공지)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      이 개인정보 처리방침은 법률 및 정책 변경 또는 보안 기술 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다. 변경사항이 있을 경우 회사는 홈페이지를 통해 고지합니다.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• 시행일: 2025년 7월 14일</li>
                    </ul>
                  </div>


                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-custom mb-3 text-base">Sellma Co., Ltd. 'prena tale' Privacy Policy</h3>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 1 (General Provisions)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      Sellma Co., Ltd. (hereinafter referred to as "the Company") values the personal information of its members and complies with the Personal Information Protection Act and other relevant laws when operating the 'prena tale' (prenatal story) service (hereinafter referred to as "the Service"). This Privacy Policy outlines what information the Company collects, how it uses that information, and what efforts it makes to protect it.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 2 (Personal Information Collected and Purpose of Collection)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      The Company collects and uses the following personal information to provide the Service, manage members, handle inquiries, and for statistical analysis.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Category</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Items Collected</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Purpose of Collection and Use</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">Membership Registration & Management</td>
                            <td className="border border-gray-300 px-3 py-2">Name, Email Address, Password</td>
                            <td className="border border-gray-300 px-3 py-2">Member identification, fulfillment of the service agreement, customer support, and complaint handling</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">Service Provision</td>
                            <td className="border border-gray-300 px-3 py-2">Payment Information (card number, mobile phone number), Payment History</td>
                            <td className="border border-gray-300 px-3 py-2">Payment settlement for paid services and content provision</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">Customer Inquiries</td>
                            <td className="border border-gray-300 px-3 py-2">Name, Email Address, Inquiry Details</td>
                            <td className="border border-gray-300 px-3 py-2">Confirmation and response to customer inquiries, service improvement</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">Statistical Analysis</td>
                            <td className="border border-gray-300 px-3 py-2">IP address, Cookies, Service usage history</td>
                            <td className="border border-gray-300 px-3 py-2">Service usage analysis, frequency of access tracking, service improvement</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 3 (Retention and Use Period of Personal Information)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      The Company will, in principle, destroy personal information without delay after the purpose of its collection and use has been achieved. However, information that must be retained by law will be stored for the period specified by the relevant statutes.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Records on contracts or subscription withdrawals, etc.: 5 years (Act on the Consumer Protection in Electronic Commerce, etc.)</li>
                      <li>• Records on payment settlement and supply of goods, etc.: 5 years (Act on the Consumer Protection in Electronic Commerce, etc.)</li>
                      <li>• Records on consumer complaints or dispute resolution: 3 years (Act on the Consumer Protection in Electronic Commerce, etc.)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 4 (Provision of Personal Information to Third Parties)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      The Company will not use a member's personal information for purposes other than those specified in Article 1 or provide it to third parties without the member's prior consent. Exceptions may be made if there is a special provision in the law or if there is a request for investigative purposes in accordance with legal procedures.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 5 (Entrustment of Personal Information Processing)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      For the smooth provision of the Service, the Company entrusts personal information processing to the following entities:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm mb-3">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Entrusted Party</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Entrusted Work</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">(Payment gateway name)</td>
                            <td className="border border-gray-300 px-3 py-2">Credit card and mobile phone payment processing and confirmation</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2">(Hosting company name)</td>
                            <td className="border border-gray-300 px-3 py-2">Server management and system development for service operation</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      When entrusting processing, the Company specifies in the contract that the entrusted party is prohibited from processing personal information for purposes other than the entrusted work, and outlines technical and administrative protective measures, restrictions on re-entrustment, and liability for damages, in accordance with the Personal Information Protection Act.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 6 (Procedure and Method of Personal Information Destruction)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      After the purpose of collection and use of personal information has been achieved, the Company will destroy the information according to the following procedure and method:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Destruction Procedure: Information entered by a member for registration, etc., is transferred to a separate database (or to a separate document cabinet for paper records) after its purpose is fulfilled, stored for a certain period in accordance with relevant laws, and then destroyed.</li>
                      <li>• Destruction Method: Personal information printed on paper is shredded or incinerated. Electronic files containing personal information are deleted using a technical method that makes the data unrecoverable.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 7 (Rights of Users and Legal Representatives)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      Members may at any time request to view, correct, delete, or suspend the processing of their personal information. If you contact the Personal Information Protection Officer in writing, by phone, or by email, we will take action without delay. Personal information of children under 14 may only be collected and used with the consent of a legal representative, who may exercise all rights regarding the child's personal information.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 8 (Personal Information Protection Officer)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      The Company is responsible for the overall management of personal information processing and has designated the following person to handle member complaints and provide remedies related to personal information processing.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Personal Information Protection Officer: Jo Eun-sang</li>
                      <li>• Contact: 010-3048-6442, querist.jojosh@gmail.com</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 9 (Measures for Securing Personal Information Safety)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      The Company takes the following measures to safely protect members' personal information:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Technical Measures: Personal information encryption, installation and regular updates of security programs, and establishment of backup systems.</li>
                      <li>• Administrative Measures: Minimization of staff handling personal information and provision of regular training, establishment and implementation of an internal management plan, etc.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-custom mb-2 text-sm">Article 10 (Announcement of Policy Changes)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      This Privacy Policy may be added to, deleted, or amended in accordance with changes in laws, policies, or security technology. The Company will make an announcement on its website if any changes are made.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Effective Date: July 14, 2025</li>
                    </ul>
                  </div>


                </div>
              )}
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