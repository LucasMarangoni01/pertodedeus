import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Bible from "./pages/Bible";
import Prayer from "./pages/Prayer";
import Devotional from "./pages/Devotional";
import Profile from "./pages/Profile";
import Diary from "./pages/Diary";
import Study from "./pages/Study";
import FindChurches from "./pages/FindChurches";
import Community from "./pages/Community";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Guide from "./pages/Guide";
import ReadingPlans from "./pages/ReadingPlans";
import Calculator from "./pages/Calculator";
import Temptation from "./pages/Temptation";
import ReligionQuiz from "./pages/ReligionQuiz";
import StruggleTracker from "./pages/StruggleTracker";
import Agenda from "./pages/Agenda";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="quiz" element={<ReligionQuiz />} />
              <Route path="struggles" element={<StruggleTracker />} />
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
              <Route path="settings" element={<Settings />} />
              <Route path="devotional" element={<Devotional />} />
              <Route path="profile" element={<Profile />} />
              <Route path="guide" element={<Guide />} />
              <Route path="sos" element={<Temptation />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
