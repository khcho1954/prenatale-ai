import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Mail, MessageSquare, FileText, HelpCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";

export default function HelpSupport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const contactMutation = useMutation({
    mutationFn: async (formData: typeof contactForm) => {
      return await apiRequest("POST", "/api/contact", formData);
    },
    onSuccess: () => {
      toast({
        title: t("messageSent"),
        description: t("messageResponse"),
      });
      setContactForm({ name: "", email: "", subject: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: t("messageSendFailed"),
        variant: "destructive",
      });
    },
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast({
        title: t("missingInformation"),
        description: t("fillAllFields"),
        variant: "destructive",
      });
      return;
    }
    contactMutation.mutate(contactForm);
  };

  const faqData = [
    {
      question: t("whatIsPrenatale"),
      answer: t("whatIsPrenataleAnswer")
    },
    {
      question: t("planDifference"),
      answer: t("planDifferenceAnswer")
    },
    {
      question: t("howToUseTTS"),
      answer: t("howToUseTTSAnswer")
    },
    {
      question: t("canCancelSubscription"),
      answer: t("canCancelSubscriptionAnswer")
    },
    {
      question: t("howToCreateCustomStories"),
      answer: t("howToCreateCustomStoriesAnswer")
    },
    {
      question: t("dataSecurityQuestion"),
      answer: t("dataSecurityAnswer")
    },
    {
      question: t("deleteAccountQuestion"),
      answer: t("deleteAccountAnswer")
    },
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
            {t("helpAndSupport")}
          </h1>
        </div>

        {/* FAQ Section */}
        <Card className="mb-6 bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-custom">
              <HelpCircle className="h-5 w-5 text-lavender" />
              {t("frequentlyAskedQuestions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-gray-200">
                  <AccordionTrigger className="text-left text-gray-custom hover:text-lavender">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Terms & Policy */}
        <Card className="mb-6 bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-custom">
              <FileText className="h-5 w-5 text-mint" />
              {t("termsPolicy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-gray-custom">
                  {language === 'ko' ? '1. 서비스 이용' : '1. Service Usage'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {language === 'ko' 
                    ? '프레나 동화 서비스는 동화 구독 서비스입니다. 본 약관에 동의하고 구독함으로써 서비스를 이용할 수 있습니다.'
                    : 'The prena tale service is a story subscription service. You can use the service by agreeing to these terms and conditions.'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-custom">
                  {language === 'ko' ? '2. 개인정보보호' : '2. Privacy Protection'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {language === 'ko'
                    ? '회사는 회원의 개인정보를 관련 법령에 따라 안전하게 보호하고 처리합니다.'
                    : 'The company safely protects and processes members\' personal information in accordance with relevant laws and regulations.'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-custom">
                  {language === 'ko' ? '3. 콘텐츠 및 저작권' : '3. Content and Copyright'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {language === 'ko'
                    ? '서비스의 모든 콘텐츠에 대한 저작권은 회사에 있으며, 개인의 비상업적 용도로만 이용 가능합니다. 무단 복제 및 상업적 사용은 엄격히 금지됩니다.'
                    : 'All content in the service is owned by the company and is for personal, non-commercial use only. Unauthorized copying and commercial use are strictly prohibited.'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-custom">
                  {language === 'ko' ? '4. 구독 및 환불' : '4. Subscription & Refund'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {language === 'ko'
                    ? '서비스는 정기 자동 결제로 운영되며, 구독 시작일로부터 7일이 경과한 후에는 환불이 불가합니다.'
                    : 'The service operates on a recurring automatic payment basis, and refunds are not possible after 7 days from the subscription start date.'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-custom">
                  {language === 'ko' ? '5. 면책 조항' : '5. Disclaimer'}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {language === 'ko'
                    ? '동화 콘텐츠는 의학적 치료 목적이 아니며, 어떠한 효능도 보장하지 않습니다.'
                    : 'The story content is not intended for medical or therapeutic purposes and does not guarantee any specific effects.'
                  }
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => setLocation("/terms-of-service")}
                  className="text-lavender hover:text-lavender/80 hover:underline text-left block text-sm"
                >
                  {t("fullTermsOfService")}
                </button>
                <button
                  onClick={() => setLocation("/privacy-policy")}
                  className="text-lavender hover:text-lavender/80 hover:underline text-left block text-sm"
                >
                  {t("privacyPolicy")}
                </button>
                <button
                  onClick={() => setLocation("/refund-policy")}
                  className="text-lavender hover:text-lavender/80 hover:underline text-left block text-sm"
                >
                  {language === 'ko' ? '환불 정책' : 'Refund Policy'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Us */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-custom">
              <MessageSquare className="h-5 w-5 text-coral" />
              {t("contactUs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-gray-custom">
                    {t("name")} *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="border-gray-300 focus:border-lavender focus:ring-lavender"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-custom">
                    {t("email")} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="border-gray-300 focus:border-lavender focus:ring-lavender"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="subject" className="text-gray-custom">
                  {t("subject")} *
                </Label>
                <Input
                  id="subject"
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="border-gray-300 focus:border-lavender focus:ring-lavender"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-gray-custom">
                  {t("message")} *
                </Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="border-gray-300 focus:border-lavender focus:ring-lavender min-h-[100px]"
                  placeholder={t("inquiryPlaceholder")}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={contactMutation.isPending}
                className="w-full bg-lavender hover:bg-lavender/90 text-white"
              >
                {contactMutation.isPending ? (
                  t("sending")
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t("sendMessage")}
                  </>
                )}
              </Button>
            </form>
            
            {/* Contact Information */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium mb-3 text-gray-custom">
                {t("otherWaysToReachUs")}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-soft-green" />
                  <span className="text-sm text-gray-600">
                    support@prenatale.com
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {t("responseTime")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}