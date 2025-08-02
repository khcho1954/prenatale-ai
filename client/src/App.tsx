import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import "@/utils/tokenHandler"; // Import token handler to process URL tokens
import TodayPage from "@/pages/today";
import StoryDetail from "@/pages/story-detail";
import Library from "@/pages/library";
import Create from "@/pages/create";
import MyPage from "@/pages/mypage";
import ThemeDetails from "@/pages/theme-details";
import AccountSettings from "@/pages/account-settings";
import ChangePassword from "@/pages/change-password";
import DeleteAccount from "@/pages/delete-account";
import Subscription from "@/pages/subscription";
import HelpSupport from "@/pages/help-support";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import RefundPolicy from "@/pages/refund-policy";
import Login from "@/pages/login";
import SignupChoice from "@/pages/signup-choice";
import SignUp from "@/pages/signup";
import GoogleProfileCompletion from "@/pages/google-profile-completion";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isLoading, user } = useAuth();

  // Process URL token on component mount - this is the root fix
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');
    
    if (token && userId) {
      console.log('📍 Router: Processing OAuth redirect token:', token);
      localStorage.setItem('authToken', token);
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Force auth refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.dispatchEvent(new CustomEvent('authTokenChanged'));
      
      console.log('✅ Router: Token processed and auth refreshed');
    }
  }, []);

  // Listen for auth token changes and refresh user data
  useEffect(() => {
    const handleAuthTokenChanged = () => {
      console.log("Auth token changed, refreshing user data");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    };

    window.addEventListener('authTokenChanged', handleAuthTokenChanged);
    return () => window.removeEventListener('authTokenChanged', handleAuthTokenChanged);
  }, []);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Check if Google user needs profile completion
  const needsProfileCompletion = (user as any)?.needsProfileCompletion || 
    ((user as any)?.googleId && (!(user as any)?.babyName || !(user as any)?.babyDueDate || !(user as any)?.relationship));

  // If user needs profile completion, redirect to profile completion page
  if (needsProfileCompletion && window.location.pathname !== '/google-profile-completion') {
    window.location.href = '/google-profile-completion';
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-gray-600">Redirecting to profile completion...</div>
      </div>
    );
  }

  // Unified routing - handle all routes in one place to prevent 404 flashes
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup-choice" component={SignupChoice} />
      <Route path="/signup" component={SignUp} />
      <Route path="/google-profile-completion" component={GoogleProfileCompletion} />
      
      {/* Main app routes */}
      <Route path="/" component={TodayPage} />
      <Route path="/today" component={TodayPage} />
      <Route path="/library" component={Library} />
      <Route path="/create" component={Create} />
      <Route path="/mypage" component={MyPage} />
      <Route path="/theme-details" component={ThemeDetails} />
      <Route path="/settings/account" component={AccountSettings} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/settings/change-password" component={ChangePassword} />
      <Route path="/settings/delete-account" component={DeleteAccount} />
      <Route path="/settings/subscription" component={Subscription} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/settings/help" component={HelpSupport} />
      <Route path="/help-support" component={HelpSupport} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/story/:uuid" component={StoryDetail} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Optional: Clear authentication token on app start for development (non-logged in state)
  // localStorage.removeItem('authToken');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div className="min-h-screen bg-cream">
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link 
              href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" 
              rel="stylesheet" 
            />
            <Router />
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
