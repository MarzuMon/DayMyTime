import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageTransition from "@/components/PageTransition";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const Landing = lazyWithRetry(() => import("./pages/Landing"), "landing");
const Auth = lazyWithRetry(() => import("./pages/Auth"), "auth");
const Index = lazyWithRetry(() => import("./pages/Index"), "index");
const Profile = lazyWithRetry(() => import("./pages/Profile"), "profile");
const ProUpgrade = lazyWithRetry(() => import("./pages/ProUpgrade"), "pro-upgrade");
const Author = lazyWithRetry(() => import("./pages/Author"), "marzooq-dashboard");
const Teams = lazyWithRetry(() => import("./pages/Teams"), "teams");
const Contact = lazyWithRetry(() => import("./pages/Contact"), "contact");
const Analytics = lazyWithRetry(() => import("./pages/Analytics"), "analytics");
const Reports = lazyWithRetry(() => import("./pages/Reports"), "reports");
const AcceptInvite = lazyWithRetry(() => import("./pages/AcceptInvite"), "accept-invite");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"), "reset-password");
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"), "privacy");
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"), "terms");
const About = lazyWithRetry(() => import("./pages/About"), "about");
const History = lazyWithRetry(() => import("./pages/History"), "history");
const TodayTip = lazyWithRetry(() => import("./pages/TodayTip"), "todaytip");
const Disclaimer = lazyWithRetry(() => import("./pages/Disclaimer"), "disclaimer");
const Topics = lazyWithRetry(() => import("./pages/Topics"), "topics");
const CategoryPage = lazyWithRetry(() => import("./pages/CategoryPage"), "category-page");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "not-found");
const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe"), "unsubscribe");
const Giveaway = lazyWithRetry(() => import("./pages/Giveaway"), "giveaway");

const queryClient = new QueryClient();

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
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
              <Route path="/history/:slug" element={<PageTransition><History /></PageTransition>} />
              <Route path="/todaytip" element={<PageTransition><TodayTip /></PageTransition>} />
              <Route path="/todaytip/:slug" element={<PageTransition><TodayTip /></PageTransition>} />
              <Route path="/disclaimer" element={<PageTransition><Disclaimer /></PageTransition>} />
              <Route path="/topics" element={<PageTransition><Topics /></PageTransition>} />
              <Route path="/topics/:category" element={<PageTransition><CategoryPage /></PageTransition>} />
              <Route path="/unsubscribe" element={<PageTransition><Unsubscribe /></PageTransition>} />
              <Route path="/giveaway" element={<PageTransition><Giveaway /></PageTransition>} />

              {/* Protected routes */}
              <Route path="/app" element={<ProtectedRoute><PageTransition><Index /></PageTransition></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
              <Route path="/pro" element={<ProtectedRoute><PageTransition><ProUpgrade /></PageTransition></ProtectedRoute>} />
              <Route path="/marzooq-dashboard" element={<ProtectedRoute><PageTransition><Author /></PageTransition></ProtectedRoute>} />
              <Route path="/teams" element={<ProtectedRoute><PageTransition><Teams /></PageTransition></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><PageTransition><Analytics /></PageTransition></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><PageTransition><Reports /></PageTransition></ProtectedRoute>} />

              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
