import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export type Language = "ko" | "en";

// Translation function - will be expanded with actual translations
const translations = {
  ko: {
    // Navigation
    today: "오늘의동화",
    create: "만들기",
    library: "도서관",
    myPage: "마이페이지",

    // Today Page
    todaysFairyTales: "오늘의 동화",
    recentlyRead: "최근 읽은 동화",
    startYourFairyTaleJourney: "아이와 함께 동화 속 여정을 떠나보세요",
    signInToCheckRecentReading: "최근 읽은 내역을 확인하려면 로그인 하세요",

    // Create Page
    createYourStory: "나만의 동화를 만들어보세요",
    chooseThemeDescription: "아이만을 위한 특별한 동화를 만들어보세요.",
    oneStoryPerDay: "하루에 한 편씩 만들 수 있습니다.",
    loveAndCare: "사랑과 배려",
    nature: "자연",
    emotions: "감정과 교감",
    imagination: "상상과 모험",
    growth: "성장",
    recommended: "추천",
    mainCharacter: "주인공",
    createAccordingToStory: "동화에 어울리는 주인공 자동 생성",
    readStory: "동화 읽기",
    readMoreStories: "동화 더보기",

    // TTS Player
    ttsNotSupported: "사용자 생성 동화는 음성 읽기 기능이 제공되지 않습니다",
    ttsNotSupportedDescription:
      "현재 사용자 생성 동화는 TTS 기능을 지원하지 않습니다",
    audioNotAvailable: "음성 파일이 준비되지 않았습니다",
    audioPlayError: "음성 재생 중 오류가 발생했습니다",

    // 프레나 플랜 기능 접근 메시지
    ttsFeatureTitle: "음성 읽기 기능",
    ttsFeatureDescription: "음성 읽기 기능은 프레나 플랜 유저에게 제공됩니다",
    createFeatureTitle: "나만의 동화 생성",
    createFeatureDescription:
      "나만의 동화 생성 기능은 프레나 플랜 유저에게 제공됩니다",
    subscribe: "구독하기",
    audioLoadError: "음성 파일을 불러올 수 없습니다",
    audioStory: "음성 동화",
    addSpecialMessage: "아이를 위한 메시지를 담아보세요 (선택)",
    enterSpecialMessage: "동화에 포함하고 싶은 메시지를 입력하세요",
    createMyStory: "나만의 동화 생성하기",
    recentlyCreated: "최근 생성한 동화",
    noStoriesCreatedYet: "아직 생성한 동화가 없습니다.",
    createFirstFairyTale: "우리 아이만을 위한 동화를 만들어보세요!",
    creatingDailyStory: "오늘의 동화 생성 중",
    youveCreatedToday: "오늘 동화를 생성했습니다",
    createAnotherStoryIn: "다음 동화는 {time}에 생성할 수 있습니다.",
    pleaseWaitMoment: "잠시만 기다려주세요",

    // Library Page
    yourLibrary: "나의 도서관",
    allStories: "모든 동화",
    favorites: "즐겨찾기",
    todaysStories: "오늘의 동화",
    createdStories: "생성한 동화",
    searchYourLibrary: "동화 검색",

    // Authentication
    login: "로그인",
    logout: "로그아웃",
    signup: "회원가입",
    signIn: "로그인",
    signUp: "회원가입",
    createAccount: "회원가입",
    alreadyHaveAccount: "이미 계정이 있으신가요?",

    // Terms and Privacy Agreement
    termsOfServiceAgreement: "서비스 이용약관 동의 (필수)",
    privacyPolicyAgreement: "개인정보 수집·이용 동의 (필수)",
    viewTermsOfService: "내용 확인",
    viewPrivacyPolicy: "내용 확인",
    agreeToTermsAndPrivacy: "필수 항목에 동의해야 회원가입이 가능합니다.",
    dontHaveAccount: "계정이 없으신가요?",
    createNewAccount: "회원가입",
    signInWithGoogle: "구글 계정으로 로그인",
    welcomeToPrenatale: "환영합니다",
    signInToContinue: "로그인하고 동화 속 세계를 탐험하세요",
    signInButton: "로그인",

    // Signup Choice Page
    chooseSignupMethod: "단 1분이면 준비가 완료됩니다",
    oneMinuteSetup: "단 1분이면 준비가 완료됩니다",
    signUpWithEmail: "이메일로 회원가입",
    embarkOnFairyTaleJourney: "동화 속 여정을 떠나보세요",

    // Form fields
    email: "이메일",
    password: "비밀번호",
    confirmPassword: "비밀번호 확인",
    babyName: "아기 이름",
    dueDate: "출산 예정일",
    preferredLanguage: "선호 언어",
    selectLanguage: "언어를 선택하세요",

    // Form placeholders
    enterEmailAddress: "이메일 주소를 입력하세요",
    enterPassword: "비밀번호를 입력하세요",
    createPassword: "비밀번호를 생성하세요",
    confirmYourPassword: "비밀번호를 다시 입력하세요",
    enterBabyName: "아기 이름을 입력하세요",
    pickDate: "날짜를 선택하세요",

    // Relationship
    yourRelationshipToBaby: "아기와의 관계",
    mom: "엄마",
    dad: "아빠",
    other: "기타",
    specifyRelationship: "아기와의 관계를 직접 입력하세요",
    relationshipPlaceholder: "예: 할머니, 할아버지, 고모 등",

    // Common
    back: "뒤로가기",
    loading: "로딩 중",
    loggingIn: "로그인 중...",
    forgotPasswordText: "비밀번호를 잊으셨나요?",
    orLoginWith: "또는 다음으로 로그인",
    orSignUpWith: "또는 다음으로 회원가입",
    or: "또는",
    continueWithGoogle: "Google로 계속하기",
    signUpWithGoogle: "구글 계정으로 회원가입",

    // Signup specific
    embarkOnAdventure: "환상적인 동화의 세계를 탐험하세요",
    username: "사용자 이름",
    enterUsername: "사용자 이름을 입력하세요",
    language: "언어",
    timezone: "시간대",

    // Error Messages
    error: "오류",
    loginFailed: "로그인 실패",
    invalidCredentials: "아이디 또는 비밀번호가 올바르지 않습니다",
    accountCreationFailed: "계정 생성 실패",
    accountCreationError: "계정 생성 중 오류가 발생했습니다",
    emailAlreadyExists: "이미 등록된 이메일입니다. 다른 이메일을 사용해주세요",
    tryAgainLater: "나중에 다시 시도해주세요",
    updateFailed: "업데이트 실패",
    updateBabyInfoFailed: "아기 정보 업데이트에 실패했습니다",
    updateAccountFailed: "계정 업데이트에 실패했습니다",
    profileSetupFailed: "프로필 설정 실패",
    pleaseRetry: "다시 시도해주세요",
    favoriteUpdateFailed: "즐겨찾기 업데이트에 실패했습니다",
    storyCreationFailed: "동화 생성 실패",
    storyCreationError: "동화 생성 중 오류가 발생했습니다",
    yourStoryBeingCreated: "동화를 생성하고 있습니다...",
    favorite: "즐겨찾기",
    favoriteUpdated: "즐겨찾기 상태가 업데이트되었습니다",

    // MyPage
    myBaby: "아기 정보",
    settings: "설정",
    notifications: "알림",
    dailyStoryUpdates: "매일 새로운 동화 업데이트",
    privacySettings: "개인정보 설정",
    theme: "테마",
    lightDarkMode: "라이트/다크 모드",
    subscription: "구독",
    planManagement: "요금제 관리",
    edit: "편집",
    notSet: "설정되지 않음",
    account: "계정",
    profileSettings: "프로필 설정",
    helpSupport: "도움말 및 지원",
    faqContact: "FAQ 및 문의",

    // Reading Statistics
    readingStatistics: "의 동화 통계",
    storiesRead: "읽은 동화",
    storiesCreated: "생성한 동화",
    themes: "테마",
    viewDetails: "자세히 보기",
    readingCalendar: "의 동화 달력",
    readStoryDay: "읽은 날",
    todayCalendar: "오늘",
    welcomeToMyPage: "마이페이지에 오신 것을 환영합니다",
    signInToAccess: "로그인하여 모든 기능을 이용하세요",
    signInWithIdPassword: "ID, 비밀번호로 로그인",

    // Google Profile Completion
    completeProfile: "프로필 완성",
    completeProfileDescription:
      "Google 계정으로 가입하신 것을 환영합니다! 개인화된 서비스를 위해 몇 가지 정보를 입력해 주세요.",
    completeGoogleProfile: "Google 프로필 완성",
    korean: "한국어",
    english: "영어",

    // Timezone explanation
    timezoneExplanation: "매일 00시 기준으로 오늘의 동화가 업데이트 됩니다",

    // Password Management
    changePassword: "비밀번호 변경",
    currentPassword: "현재 비밀번호",
    newPassword: "새 비밀번호",
    confirmNewPassword: "새 비밀번호 확인",
    passwordChanged: "비밀번호가 성공적으로 변경되었습니다",
    passwordChangeFailed: "비밀번호 변경에 실패했습니다",
    passwordMismatch: "비밀번호가 일치하지 않습니다",
    passwordTooShort: "비밀번호는 최소 8자 이상이어야 합니다",
    incorrectCurrentPassword: "현재 비밀번호가 올바르지 않습니다",
    googleAccountPassword: "Google 계정은 Google에서 비밀번호를 관리합니다",

    // Forgot Password Link
    forgotPassword: "비밀번호를 잊으셨나요?",
    forgotPasswordLink: "비밀번호를 잊으셨나요?",
    forgotPasswordTitle: "비밀번호 재설정",
    forgotPasswordDescription:
      "가입한 이메일 주소로 재설정 링크를 보내드립니다.",
    resetProcess: "재설정 과정",
    resetStep1: "이메일 주소 확인 후 재설정 링크를 발송합니다",
    resetStep2: "이메일을 확인하여 재설정 링크를 클릭합니다",
    resetStep3: "새로운 비밀번호를 설정하여 계정에 다시 로그인합니다",
    emailAddress: "이메일 주소",
    sentTo: "발송 대상",
    emailSentInstructions:
      "비밀번호 재설정 링크가 포함된 이메일을 발송했습니다. 이메일을 확인하고 링크를 클릭하여 새 비밀번호를 설정하세요.",
    checkSpamFolder: "이메일이 보이지 않으면 스팸 폴더를 확인해 주세요.",
    understood: "확인했습니다",
    forgotPasswordInstructions:
      "1. 이메일 주소를 확인하고 재설정 버튼을 클릭하세요.\n2. 등록된 이메일로 재설정 링크가 발송됩니다.\n3. 이메일의 링크를 클릭하여 새 비밀번호를 설정하세요.",
    sendResetEmail: "재설정 이메일 발송",
    resetEmailSent: "재설정 이메일이 발송되었습니다",
    resetEmailFailed: "재설정 이메일 발송에 실패했습니다",
    checkYourEmail: "이메일을 확인해주세요",

    // Delete Account Page
    deleteAccountTitle: "계정 삭제",
    deleteAccountWarningTitle: "계정을 정말 삭제하시겠습니까?",
    deleteAccountWarningDescription:
      "이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.",
    deleteAccountConfirmation: "위 내용을 이해했으며 계정 삭제에 동의합니다",
    permanentDeletion: "영구 삭제",
    beforeYouDelete: "삭제하기 전에",
    alternativeOptions: "다른 옵션",
    contactSupportFirst:
      "앱에 문제가 있으시면 먼저 고객지원팀에 문의해 주세요. 많은 문제가 계정 삭제 없이 해결될 수 있습니다.",
    contactSupportInstead: "고객지원팀에 문의하기",
    accountDeleted: "계정 삭제됨",
    accountDeletedSuccessfully: "계정이 성공적으로 삭제되었습니다.",
    accountDeleteFailed: "계정 삭제에 실패했습니다. 다시 시도해 주세요.",
    confirmDeletion: "삭제 확인",
    sending: "전송 중...",

    // Login Error Messages
    emailNotFound: "등록되지 않은 이메일입니다. 계정을 먼저 생성해주세요.",
    invalidPassword: "비밀번호가 올바르지 않습니다. 다시 확인해주세요.",
    loginWithGoogle: "구글 계정으로 로그인해주세요.",

    // Library Empty States
    noStoriesYet: "아직 읽은 동화가 없습니다",
    fillLibraryMessage: "동화를 읽고 도서관을 채워보세요",
    noTodayStories: "아직 읽은 동화가 없습니다",
    readTodayStories: "오늘의 동화를 읽어보세요",
    noFavoriteStories: "즐겨찾기한 동화가 없습니다",
    addFavoriteStories: "마음에 드는 동화를 즐겨찾기에 추가해보세요",
    noCreatedStories: "생성한 동화가 없습니다",
    createYourFirstStory: "나만의 동화를 만들어보세요",

    // Subscription Page
    subscriptionManagement: "구독 관리",
    currentPlan: "현재 플랜",
    freePlan: "무료 플랜",
    prenaPlan: "프레나 플랜",
    upgrade: "업그레이드",
    cancel: "취소",
    monthly: "월간",
    yearly: "연간",
    yearlyDiscount: "연간 (58% 할인)",
    upgradePlanMessage:
      "현재 무료 플랜을 이용 중입니다. 프레나 플랜으로 업그레이드하여 더 많은 기능과 개인화된 경험을 즐겨보세요!",
    subscriptionDetails: "구독 세부 정보",
    planFeatures: "플랜 기능",
    billingHistory: "결제 내역",
    nextBilling: "다음 결제",
    couponCode: "쿠폰 코드",
    haveCoupon: "쿠폰이 있으신가요?",
    enterCouponCode: "쿠폰 코드를 입력하세요",
    applyCoupon: "적용",
    applying: "적용 중...",
    subscriptionSuccess: "구독이 성공적으로 업그레이드되었습니다!",
    subscriptionError: "결제 처리에 실패했습니다",
    subscriptionCancelled: "구독이 성공적으로 취소되었습니다",
    couponApplied: "쿠폰이 성공적으로 적용되었습니다",
    couponFailed: "쿠폰 적용에 실패했습니다",
    couponInvalid: "유효하지 않은 쿠폰 코드입니다",
    couponExpired: "쿠폰이 만료되었습니다",
    couponUsageLimitReached: "이미 사용 완료된 쿠폰입니다",
    couponAlreadyUsed: "이미 사용한 쿠폰입니다",
    couponNotActive: "쿠폰이 비활성화 상태입니다",
    alreadyHasSubscription: "이미 프레나 플랜을 구독 중입니다",
    freeFeature1: "일일 큐레이션 동화 (하루 2편)",
    freeFeature2: "기본 테마 및 캐릭터",
    freeFeature3: "즐겨찾기 및 읽기 기록",
    freeFeature4: "읽기 통계",
    prenaFeature1: "사용자 생성 동화 (UCT) 생성",
    prenaFeature2: "일일 동화 TTS (텍스트 음성 변환) 기능",
    prenaFeature3: "우선 지원",
    prenaFeature4: "고급 개인화",

    // Account Settings Page
    accountSettings: "계정 설정",
    profileInformation: "프로필 정보",
    babyInformation: "아기 정보",
    preferences: "환경 설정",
    avatar: "아바타",
    selectAvatar: "아바타 선택",
    noAvatar: "아바타 없음",
    profileAvatar: "프로필 아바타",
    chooseAvatarDescription: "동화 캐릭터 아바타를 선택하세요",
    saving: "저장 중",
    saveChanges: "변경 사항 저장",
    changesSaved: "변경 사항이 저장되었습니다",
    changesSaveFailed: "변경 사항 저장에 실패했습니다",
    deleteAccount: "계정 삭제",
    deleteAccountWarning: "계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다",
    emailCannotBeChanged: "이메일은 변경할 수 없습니다",

    // Help & Support Page
    helpAndSupport: "도움말 및 지원",
    frequentlyAskedQuestions: "자주 묻는 질문",
    contactUs: "문의하기",
    contactForm: "문의 양식",
    name: "이름",
    subject: "제목",
    message: "메시지",
    sendMessage: "메시지 전송",
    messageSent: "메시지가 전송되었습니다",
    messageResponse: "24시간 내에 응답드리겠습니다",
    messageSendFailed: "메시지 전송에 실패했습니다. 다시 시도해 주세요",
    missingInformation: "정보가 누락되었습니다",
    fillAllFields: "모든 필수 항목을 입력해 주세요",

    // FAQ Questions
    whatIsPrenatale: "프레나테일이 무엇인가요?",
    whatIsPrenataleAnswer:
      "프레나테일은 예비 부모를 위한 태교 동화 서비스입니다. AI로 생성된 개인화된 동화와 TTS 기능을 통해 아기와 특별한 시간을 만들어, 태교 유대감 형성을 돕습니다.",
    planDifference: "무료 플랜과 프레나 플랜의 차이는 무엇인가요?",
    planDifferenceAnswer:
      "무료 플랜에는 일일 큐레이션 동화, 기본 테마, 읽기 통계가 포함됩니다. 프레나 플랜에는 사용자 생성 동화(UCT), TTS 기능, 음성 선택, 사용자 음성 녹음, 우선 지원이 추가됩니다.",
    howToUseTTS: "TTS 기능은 어떻게 사용하나요?",
    howToUseTTSAnswer:
      "TTS 기능은 프레나 플랜 구독자만 사용할 수 있습니다. 음성 설정에서 6가지 다른 음성 중 선택하거나 직접 음성을 녹음할 수 있습니다. 텍스트를 음성으로 변환하여 개인화된 스토리텔링 경험을 제공합니다.",
    canCancelSubscription: "구독을 취소할 수 있나요?",
    canCancelSubscriptionAnswer:
      "네, 구독 관리 페이지에서 언제든지 구독을 취소할 수 있습니다. 구독 기간이 종료될 때까지 프레나 플랜 기능을 계속 사용할 수 있습니다.",
    howToCreateCustomStories: "사용자 지정 동화는 어떻게 만드나요?",
    howToCreateCustomStoriesAnswer:
      "프레나 플랜 구독자는 '동화 만들기' 페이지에서 테마, 캐릭터, 특별 메시지를 선택하여 AI가 생성한 개인화된 동화를 만들 수 있습니다.",
    dataSecurityQuestion: "개인정보는 안전한가요?",
    dataSecurityAnswer:
      "네, 개인정보 보호와 보안을 우선으로 합니다. 모든 개인정보는 암호화되어 안전하게 저장되며, 사용자 동의 없이 제3자에게 데이터를 제공하지 않습니다.",
    deleteAccountQuestion: "계정을 삭제하려면 어떻게 하나요?",
    deleteAccountAnswer:
      "계정 설정 페이지의 '위험 구역' 섹션에서 계정을 삭제할 수 있습니다. 이 작업은 되돌릴 수 없으므로 신중히 고려하시기 바랍니다.",

    // Help & Support
    termsPolicy: "이용 약관 및 정책",
    inquiryPlaceholder: "문의 사항을 작성해주세요",
    otherWaysToReachUs: "직접 연락하기",
    responseTime: "답변에는 일반적으로 영업일 기준 24시간이 소요됩니다.",
    fullTermsOfService: "이용약관",
    privacyPolicy: "개인정보 처리방침",
    refundPolicy: "환불 정책",
  },
  en: {
    // Navigation
    today: "Today",
    create: "Create",
    library: "Library",
    myPage: "My Page",

    // Today Page
    todaysFairyTales: "Today's Fairy Tales",
    recentlyRead: "Recently Read",
    startYourFairyTaleJourney: "Start your fairy tale journey",
    signInToCheckRecentReading:
      "Please sign in to check your recent reading history",
    signInToContinue: "Sign in to explore the world of fairy tales",

    // Create Page
    createYourStory: "Create Your Story",

    // Subscription Page
    subscriptionManagement: "Subscription Management",
    upgrade: "Upgrade",
    cancel: "Cancel",
    subscriptionDetails: "Subscription Details",
    planFeatures: "Plan Features",
    billingHistory: "Billing History",
    nextBilling: "Next Billing",
    couponCode: "Coupon Code",
    subscriptionSuccess: "Subscription upgraded successfully!",
    subscriptionError: "Payment processing failed",
    subscriptionCancelled: "Subscription cancelled successfully",
    couponApplied: "Coupon applied successfully",
    couponFailed: "Failed to apply coupon",
    couponInvalid: "Invalid coupon code",
    couponExpired: "Coupon has expired",
    couponUsageLimitReached: "This coupon has already been fully used",
    couponAlreadyUsed: "You have already used this coupon",
    couponNotActive: "Coupon is not active",
    alreadyHasSubscription: "You already have an active subscription",
    freeFeature1: "Daily curated fairy tales (2 tales/day)",
    freeFeature2: "Basic themes and characters",
    freeFeature3: "Favorites and reading history",
    freeFeature4: "Reading statistics",
    prenaFeature1: "User Created Tales (UCT) generation",
    prenaFeature2: "TTS (Text-to-Speech) feature for daily tales",
    prenaFeature3: "Priority support",
    prenaFeature4: "Advanced personalization",

    // Account Settings Page
    accountSettings: "Account Settings",
    profileInformation: "Profile Information",
    babyInformation: "Baby Information",
    preferences: "Preferences",
    avatar: "Avatar",
    selectAvatar: "Select Avatar",
    noAvatar: "No Avatar",
    saveChanges: "Save Changes",
    changesSaved: "Changes saved successfully",
    changesSaveFailed: "Failed to save changes",
    deleteAccount: "Delete Account",
    deleteAccountWarning:
      "Deleting your account will permanently remove all your data",
    emailCannotBeChanged: "Email cannot be changed",

    // Help & Support Page
    helpAndSupport: "Help & Support",
    frequentlyAskedQuestions: "Frequently Asked Questions",
    contactUs: "Contact Us",
    contactForm: "Contact Form",
    name: "Name",
    subject: "Subject",
    message: "Message",
    sendMessage: "Send Message",
    messageSent: "Message Sent",
    messageResponse: "We'll respond within 24 hours",
    messageSendFailed: "Failed to send message. Please try again",
    missingInformation: "Missing Information",
    fillAllFields: "Please fill in all required fields",

    // Account Settings Page (Additional)
    username: "Username",
    profileAvatar: "Profile Avatar",
    chooseAvatarDescription: "Choose a fairy tale character avatar",
    babyName: "Baby Name",
    relationship: "Relationship",
    mom: "Mom",
    dad: "Dad",
    other: "Other",
    dueDate: "Due Date",
    pickDate: "Pick a date",
    timezone: "Timezone",
    language: "Language",
    saving: "Saving",
    specifyRelationship: "Please specify your relationship with baby",
    relationshipPlaceholder: "e.g., Grandmother, Grandfather, Aunt, etc.",

    // Subscription Page (Additional)
    currentPlan: "Current Plan",
    freePlan: "Free Plan",
    prenaPlan: "Prena Plan",
    upgradePlanMessage:
      "You're currently on the Free Plan. Upgrade to Prena Plan for enhanced features and personalized experiences!",
    monthly: "Monthly",
    yearly: "Yearly",
    yearlyDiscount: "Yearly (58% off)",
    cancelAnytime: "Cancel anytime",
    haveCoupon: "Have a coupon?",
    enterCouponCode: "Enter coupon code",
    applyCoupon: "Apply",
    applying: "Applying...",

    // Additional TTS Messages (removed duplicates from above)
    audioPlayError: "Error occurred while playing audio",

    // Prena Plan Feature Access Messages
    ttsFeatureTitle: "Voice Reading Feature",
    ttsFeatureDescription:
      "Voice reading feature is available for Prena Plan users",
    createFeatureTitle: "Create My Story",
    createFeatureDescription:
      "Create My Story feature is available for Prena Plan users",
    subscribe: "Subscribe",

    // Login Error Messages
    accountNotFound: "Account not found. Please create an account first.",
    loginFailed: "Login failed. Please check your email and password.",
    back: "Back",

    // FAQ Questions
    whatIsPrenatale: "What is prena tale?",
    whatIsPrenataleAnswer:
      "prena tale is a prenatal fairy tale service for expecting parents. We create special moments with your baby through AI-generated personalized stories and TTS features, designed to support your prenatal bonding journey.",
    planDifference: "What's the difference between Free Plan and Prena Plan?",
    planDifferenceAnswer:
      "Free Plan includes daily curated fairy tales, basic themes, and reading statistics. Prena Plan adds User Created Tales (UCT) generation, TTS features, voice selection, custom voice recording, and priority support.",
    howToUseTTS: "How do I use the TTS feature?",
    howToUseTTSAnswer:
      "TTS feature is available for Prena Plan subscribers only. You can choose from 6 different voices or record your own voice in Voice Settings. The feature converts text to speech for a personalized storytelling experience.",
    canCancelSubscription: "Are you sure you want to cancel your subscription?",
    canCancelSubscriptionAnswer:
      "Yes, you can cancel your subscription anytime in the Subscription Management page. You'll continue to have access to Prena Plan features until your subscription period ends.",
    howToCreateCustomStories: "How do I create custom stories?",
    howToCreateCustomStoriesAnswer:
      "Prena Plan subscribers can create AI-generated personalized stories by selecting themes, characters, and special messages on the 'Create Story' page.",
    dataSecurityQuestion: "Is my data secure?",
    dataSecurityAnswer:
      "Yes, we prioritize your privacy and security. All personal information is encrypted and stored securely. We never share your data with third parties without your consent.",
    deleteAccountQuestion: "How do I delete my account?",
    deleteAccountAnswer:
      "You can delete your account in the Account Settings page under the 'Danger Zone' section. This action cannot be undone, so please consider carefully before proceeding.",

    // Help & Support
    termsPolicy: "Terms & Policy",
    inquiryPlaceholder: "Please describe your inquiry in detail...",
    otherWaysToReachUs: "Other Ways to Reach Us",
    responseTime: "We typically respond within 24 hours during business days.",
    chooseThemeDescription:
      "Choose a theme to create a personalized fairy tale for your little one.",
    oneStoryPerDay: "You can create one story per day.",
    loveAndCare: "Love & Care",
    nature: "Nature",
    emotions: "Emotions",
    imagination: "Imagination",
    growth: "Growth",
    recommended: "Rec'd",
    mainCharacter: "Main Character",
    createAccordingToStory: "Create according to story",
    readStory: "Read Story",
    addSpecialMessage: "Add a special message for your baby (optional)",
    enterSpecialMessage: "Enter a special message to include in your story",
    createMyStory: "Create My Story",
    recentlyCreated: "Recently Created",
    noStoriesCreatedYet: "No stories created yet",
    createFirstFairyTale: "Create your first fairy tale for your little one!",
    creatingDailyStory: "Creating Daily Story",
    youveCreatedToday: "You've created your story for today",
    createAnotherStoryIn: "You can create another story in {time}.",
    pleaseWaitMoment: "Please wait a moment",

    // Library Page
    yourLibrary: "Your Library",
    allStories: "All stories",
    favorites: "Favorites",
    todaysStories: "Today's",
    createdStories: "Created",
    searchYourLibrary: "Search your library",

    // Authentication
    login: "Login",
    logout: "Logout",
    signup: "Sign Up",
    signIn: "Sign In",
    signUp: "Sign Up",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?",

    // Terms and Privacy Agreement
    termsOfServiceAgreement: "Terms of Service Agreement (Required)",
    privacyPolicyAgreement: "Privacy Policy Agreement (Required)",
    viewTermsOfService: "View Terms of Service",
    viewPrivacyPolicy: "View Privacy Policy",
    agreeToTermsAndPrivacy:
      "You must agree to the Terms of Service and Privacy Policy to create an account.",
    dontHaveAccount: "Don't have an account?",
    signInWithGoogle: "Sign in with Google",
    welcomeToPrenatale: "Welcome",
    signInButton: "Sign In",
    createNewAccount: "Create New Account",

    // Signup Choice Page
    chooseSignupMethod: "Choose how you'd like to create your account",
    oneMinuteSetup: "Ready in just one minute",
    signUpWithGoogle: "Sign up with Google",
    signUpWithEmail: "Sign up with Email",
    embarkOnFairyTaleJourney: "Embark on a fairy tale journey",

    // Form fields
    selectLanguage: "Select a language",

    // Form placeholders
    enterEmailAddress: "Enter email address",
    enterPassword: "Enter password",
    createPassword: "Create password",
    confirmYourPassword: "Confirm your password",
    enterBabyName: "Enter baby name",

    // Relationship
    yourRelationshipToBaby: "Your relationship to baby",

    // Common
    loading: "Loading",
    loggingIn: "Logging in...",
    sending: "Sending...",
    fullTermsOfService: "Full Terms of Service",
    privacyPolicy: "Privacy Policy",
    forgotPasswordText: "Forgot password?",
    orLoginWith: "Or login with",
    or: "or",
    continueWithGoogle: "Continue with Google",

    // Error Messages
    error: "Error",
    invalidCredentials: "Invalid username or password",
    emailNotFound: "Email not found. Please create an account first.",
    invalidPassword: "Invalid password. Please check and try again.",
    loginWithGoogle: "Please login with Google.",
    accountCreationFailed: "Account Creation Failed",
    accountCreationError: "An error occurred while creating your account",
    emailAlreadyExists:
      "This email is already registered. Please use a different email",
    tryAgainLater: "Please try again later",
    updateFailed: "Update Failed",
    updateBabyInfoFailed: "Failed to update baby information",
    updateAccountFailed: "Failed to update account",
    profileSetupFailed: "Profile Setup Failed",
    pleaseRetry: "Please try again",
    favoriteUpdateFailed: "Failed to update favorite status. Please try again",
    storyCreationFailed: "Story Creation Failed",
    storyCreationError: "An error occurred while creating your story",
    yourStoryBeingCreated: "Your story is being created...",
    favorite: "Favorite",
    favoriteUpdated: "Your favorite status has been updated",

    // MyPage
    myBaby: "My Baby",
    settings: "Settings",
    notifications: "Notifications",
    dailyStoryUpdates: "Daily story updates",
    privacySettings: "Privacy Settings",
    theme: "Theme",
    lightDarkMode: "Light/Dark mode",
    subscription: "Subscription",
    planManagement: "Plan management",
    edit: "Edit",
    notSet: "Not set",
    account: "Account",
    profileSettings: "Profile Settings",
    helpSupport: "Help & Support",
    faqContact: "FAQ & Contact",

    // Reading Statistics
    readingStatistics: "'s Reading Statistics",
    storiesRead: "Stories Read",
    storiesCreated: "Stories Created",
    themes: "Themes",
    viewDetails: "View Details",
    readingCalendar: "'s Reading Calendar",
    readStoryDay: "Read Story",
    readMoreStories: "Read More Stories",

    // TTS Player
    ttsNotSupported: "User-generated stories do not support audio reading",
    ttsNotSupportedDescription:
      "TTS feature is not currently supported for user-created stories",
    audioNotAvailable: "Audio file is not available",
    audioLoadError: "Unable to load audio file",
    audioStory: "Audio Story",
    todayCalendar: "Today",
    welcomeToMyPage: "Welcome to My Page",
    signInToAccess: "Sign in to access all features",
    signInWithIdPassword: "Sign in with ID & Password",

    // Google Profile Completion
    completeProfile: "Complete Profile",
    completeProfileDescription:
      "Welcome to signing up with Google! Please provide some information for personalized service.",
    completeGoogleProfile: "Complete Google Profile",
    korean: "Korean",
    english: "English",

    // Library Empty States
    noStoriesYet: "No stories read yet",
    fillLibraryMessage: "Read stories to fill your library",
    noTodayStories: "No stories read today",
    readTodayStories: "Read today's stories",
    noFavoriteStories: "No favorite stories",
    addFavoriteStories: "Add stories to your favorites",
    noCreatedStories: "No created stories",
    createYourFirstStory: "Create your own story",

    // Timezone explanation
    timezoneExplanation:
      "Daily stories update at midnight based on your timezone",

    // Password Management
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    passwordChanged: "Password changed successfully",
    passwordChangeFailed: "Failed to change password",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters",
    incorrectCurrentPassword: "Current password is incorrect",
    googleAccountPassword: "Google accounts manage passwords through Google",

    // Forgot Password Link
    forgotPassword: "Forgot your password?",
    forgotPasswordLink: "Forgot your password?",
    forgotPasswordTitle: "Reset Password",
    forgotPasswordDescription:
      "We'll send a reset link to your registered email address.",
    resetProcess: "Reset Process",
    resetStep1: "We'll verify your email address and send a reset link",
    resetStep2: "Check your email and click the reset link",
    resetStep3: "Set a new password and log back into your account",
    emailAddress: "Email Address",
    sentTo: "Sent to",
    emailSentInstructions:
      "We've sent an email with a password reset link. Check your email and click the link to set a new password.",
    checkSpamFolder:
      "If you don't see the email, please check your spam folder.",
    understood: "Understood",
    forgotPasswordInstructions:
      "1. Verify your email address and click the reset button.\n2. A reset link will be sent to your registered email.\n3. Click the link in the email to set a new password.",
    sendResetEmail: "Send Reset Email",
    resetEmailSent: "Reset email has been sent",
    resetEmailFailed: "Failed to send reset email",
    checkYourEmail: "Please check your email",

    // Delete Account Page
    deleteAccountTitle: "Delete Account",
    deleteAccountWarningTitle: "Are you sure you want to delete your account?",
    deleteAccountWarningDescription:
      "This action cannot be undone. All your data will be permanently deleted.",
    deleteAccountConfirmation: "I understand and agree to delete my account",
    permanentDeletion: "Permanently Delete",
    beforeYouDelete: "Before You Delete",
    alternativeOptions: "Alternative Options",
    contactSupportFirst:
      "If you're having issues with the app, please consider contacting our support team first. Many problems can be resolved without deleting your account.",
    contactSupportInstead: "Contact Support Instead",
    accountDeleted: "Account Deleted",
    accountDeletedSuccessfully: "Your account has been successfully deleted.",
    accountDeleteFailed: "Failed to delete account. Please try again.",
    confirmDeletion: "Confirm Deletion",
  },
};

export function useLanguage() {
  const { user, isAuthenticated } = useAuth();
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    if (isAuthenticated && (user as any)?.language) {
      // For authenticated users, use their preference
      setLanguage((user as any).language as Language);
    } else {
      // For non-authenticated users or users without preference, detect browser language
      const browserLanguage =
        navigator.language || navigator.languages?.[0] || "";
      const detectedLanguage = browserLanguage.toLowerCase().includes("ko")
        ? "ko"
        : "en";
      setLanguage(detectedLanguage);
      console.log(
        "useLanguage - Browser language detection:",
        browserLanguage,
        "-> detected:",
        detectedLanguage,
      );
    }
  }, [isAuthenticated, user]);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  const t = (key: string) => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return {
    language,
    setLanguage: changeLanguage,
    t,
  };
}
