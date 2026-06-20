import { Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import SchemesPage from "../pages/SchemesPage.jsx";
import SchemeDetailsPage from "../pages/SchemeDetailsPage.jsx";
import ChatPage from "../pages/ChatPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import SearchSchemesPage from "../pages/SearchSchemesPage.jsx";
import SchemeComparisonPage from "../pages/SchemeComparisonPage.jsx";
import SavedSchemesPage from "../pages/SavedSchemesPage.jsx";
import MissedBenefitsPage from "../pages/MissedBenefitsPage.jsx";
import EligibilityVisualizationPage from "../pages/EligibilityVisualizationPage.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/schemes" element={<SchemesPage />} />
      <Route path="/schemes/:schemeId" element={<SchemeDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchSchemesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compare"
        element={
          <ProtectedRoute>
            <SchemeComparisonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <SavedSchemesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/missed-benefits"
        element={
          <ProtectedRoute>
            <MissedBenefitsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eligibility-visualization"
        element={
          <ProtectedRoute>
            <EligibilityVisualizationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
