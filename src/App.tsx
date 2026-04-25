import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/layout/MainLayout";

// Lazy Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Bible = lazy(() => import("./pages/Bible"));
const Prayer = lazy(() => import("./pages/Prayer"));
const Devotional = lazy(() => import("./pages/Devotional"));
const Profile = lazy(() => import("./pages/Profile"));
const Diary = lazy(() => import("./pages/Diary"));
const Study = lazy(() => import("./pages/Study"));
const FindChurches = lazy(() => import("./pages/FindChurches"));
const Community = lazy(() => import("./pages/Community"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Guide = lazy(() => import("./pages/Guide"));
const ReadingPlans = lazy(() => import("./pages/ReadingPlans"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Temptation = lazy(() => import("./pages/Temptation"));
const ReligionQuiz = lazy(() => import("./pages/ReligionQuiz"));
const StruggleTracker = lazy(() => import("./pages/StruggleTracker"));
const Fasting = lazy(() => import("./pages/Fasting"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Admin = lazy(() => import("./pages/Admin"));

const PageLoader = () => (
  <div className="min-h-screen bg-navy flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-amber/20 border-t-amber rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="quiz" element={<ReligionQuiz />} />
                <Route path="struggles" element={<StruggleTracker />} />
                <Route path="jejum" element={<Fasting />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="bible" element={<Bible />} />
                <Route path="plans" element={<ReadingPlans />} />
                <Route path="calculator" element={<Calculator />} />
                <Route path="prayer" element={<Prayer />} />
                <Route path="diary" element={<Diary />} />
                <Route path="churches" element={<FindChurches />} />
                <Route path="study" element={<Study />} />
                <Route path="community" element={<Community />} />
                <Route path="assistant" element={<Assistant />} />
                <Route path="admin" element={<Admin />} />
                <Route path="settings" element={<Settings />} />
                <Route path="devotional" element={<Devotional />} />
                <Route path="profile" element={<Profile />} />
                <Route path="guide" element={<Guide />} />
                <Route path="sos" element={<Temptation />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
