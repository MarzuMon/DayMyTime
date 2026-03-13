import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageTransition from "@/components/PageTransition";
import { AnimatePresence } from "framer-motion";

const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const ProUpgrade = lazy(() => import("./pages/ProUpgrade"));
const Author = lazy(() => import("./pages/Author"));
const Teams = lazy(() => import("./pages/Teams"));
const Contact = lazy(() => import("./pages/Contact"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));
const History = lazy(() => import("./pages/History"));
const TodayTip = lazy(() => import("./pages/TodayTip"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/accept-invite" element={<PageTransition><AcceptInvite /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/history" element={<PageTransition><History /></PageTransition>} />
        <Route path="/todaytip" element={<PageTransition><TodayTip /></PageTransition>} />

        {/* Protected routes */}
        <Route path="/app" element={<ProtectedRoute><PageTransition><Index /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/pro" element={<ProtectedRoute><PageTransition><ProUpgrade /></PageTransition></ProtectedRoute>} />
        <Route path="/author" element={<ProtectedRoute><PageTransition><Author /></PageTransition></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><PageTransition><Teams /></PageTransition></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><PageTransition><Analytics /></PageTransition></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><PageTransition><Reports /></PageTransition></ProtectedRoute>} />

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <AnimatedRoutes />
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}