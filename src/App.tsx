import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import OnboardingPage from "./pages/Onboarding";
import IthacaPage from "./pages/IthacaPage";
import VoyagePage from "./pages/VoyagePage";
import MirrorPage from "./pages/MirrorPage";
import AtlasPage from "./pages/AtlasPage";
import ForksPage from "./pages/ForksPage";
import type { ReactNode } from "react";
import Landing from "./pages/Landing";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-ithaca flex items-center justify-center"><p className="text-muted">Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ithaca flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (user) return <Navigate to="/voyage" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path = "/" element ={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/ithaca" element={<IthacaPage />} />
        <Route path="/voyage" element={<VoyagePage />} />
        <Route path="/mirror" element={<MirrorPage />} />
        <Route path="/atlas" element={<AtlasPage />} />
        <Route path="/forks" element={<ForksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/voyage" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}