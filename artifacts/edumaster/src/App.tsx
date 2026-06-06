import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import { BrandingProvider } from "./context/BrandingContext";
import { initApiClient } from "./lib/apiClient";
import NotFound from "@/pages/not-found";
import { ReactNode } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { StudentsPage } from "@/pages/StudentsPage";
import { StudentProfilePage } from "@/pages/StudentProfilePage";
import { TeachersPage } from "@/pages/TeachersPage";
import { TeacherDetailPage } from "@/pages/TeacherDetailPage";
import { ClassesPage } from "@/pages/ClassesPage";
import { MarksPage } from "@/pages/MarksPage";
import { AttendancePage } from "@/pages/AttendancePage";
import { FeesPage } from "@/pages/FeesPage";
import { DisciplinePage } from "@/pages/DisciplinePage";
import { AnnouncementsPage } from "@/pages/AnnouncementsPage";
import { SuggestionsPage } from "@/pages/SuggestionsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { RankingsPage } from "@/pages/RankingsPage";
import { HeadteacherIntelligencePage } from "@/pages/HeadteacherIntelligencePage";
import { ClassInvestigationPage } from "@/pages/ClassInvestigationPage";
import { SchoolBrandingPage } from "@/pages/SchoolBrandingPage";
import { ClubsManagementPage } from "@/pages/ClubsManagementPage";
import { ClubDashboardPage } from "@/pages/ClubDashboardPage";

initApiClient();

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />

      <Route path="/dashboard">
        <ProtectedLayout><DashboardPage /></ProtectedLayout>
      </Route>
      <Route path="/club-dashboard">
        <ProtectedLayout><ClubDashboardPage /></ProtectedLayout>
      </Route>
      <Route path="/branding">
        <ProtectedLayout><SchoolBrandingPage /></ProtectedLayout>
      </Route>
      <Route path="/clubs">
        <ProtectedLayout><ClubsManagementPage /></ProtectedLayout>
      </Route>
      <Route path="/students">
        <ProtectedLayout><StudentsPage /></ProtectedLayout>
      </Route>
      <Route path="/students/:id">
        <ProtectedLayout><StudentProfilePage /></ProtectedLayout>
      </Route>
      <Route path="/teachers">
        <ProtectedLayout><TeachersPage /></ProtectedLayout>
      </Route>
      <Route path="/teachers/:id">
        <ProtectedLayout><TeacherDetailPage /></ProtectedLayout>
      </Route>
      <Route path="/classes">
        <ProtectedLayout><ClassesPage /></ProtectedLayout>
      </Route>
      <Route path="/marks">
        <ProtectedLayout><MarksPage /></ProtectedLayout>
      </Route>
      <Route path="/attendance">
        <ProtectedLayout><AttendancePage /></ProtectedLayout>
      </Route>
      <Route path="/fees">
        <ProtectedLayout><FeesPage /></ProtectedLayout>
      </Route>
      <Route path="/discipline">
        <ProtectedLayout><DisciplinePage /></ProtectedLayout>
      </Route>
      <Route path="/announcements">
        <ProtectedLayout><AnnouncementsPage /></ProtectedLayout>
      </Route>
      <Route path="/suggestions">
        <ProtectedLayout><SuggestionsPage /></ProtectedLayout>
      </Route>
      <Route path="/analytics">
        <ProtectedLayout><AnalyticsPage /></ProtectedLayout>
      </Route>
      <Route path="/rankings">
        <ProtectedLayout><RankingsPage /></ProtectedLayout>
      </Route>
      <Route path="/intelligence">
        <ProtectedLayout><HeadteacherIntelligencePage /></ProtectedLayout>
      </Route>
      <Route path="/intelligence/class/:id">
        <ProtectedLayout><ClassInvestigationPage /></ProtectedLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </BrandingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
