import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import { initApiClient } from "./lib/apiClient";
import NotFound from "@/pages/not-found";

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

// Initialize the API client so it can inject the auth token
initApiClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/students">
        <ProtectedRoute>
          <StudentsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/students/:id">
        <ProtectedRoute>
          <StudentProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/teachers">
        <ProtectedRoute>
          <TeachersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teachers/:id">
        <ProtectedRoute>
          <TeacherDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/classes">
        <ProtectedRoute>
          <ClassesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/marks">
        <ProtectedRoute>
          <MarksPage />
        </ProtectedRoute>
      </Route>
      <Route path="/attendance">
        <ProtectedRoute>
          <AttendancePage />
        </ProtectedRoute>
      </Route>
      <Route path="/fees">
        <ProtectedRoute>
          <FeesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/discipline">
        <ProtectedRoute>
          <DisciplinePage />
        </ProtectedRoute>
      </Route>
      <Route path="/announcements">
        <ProtectedRoute>
          <AnnouncementsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/suggestions">
        <ProtectedRoute>
          <SuggestionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <AnalyticsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/rankings">
        <ProtectedRoute>
          <RankingsPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
