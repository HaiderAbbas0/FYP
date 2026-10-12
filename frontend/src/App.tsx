import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

/* ── Screens ── */
import Dashboard from "./screens/Dashboard";
import AttackSimulation from "./screens/AttackSimulation";
import Devices from "./screens/Devices";
import DeviceDetail from "./screens/DeviceDetail";
import Incidents from "./screens/Incidents";
import IncidentDetail from "./screens/IncidentDetail";
import CaseMemory from "./screens/CaseMemory";
import CaseDetail from "./screens/CaseDetail";
import Evaluation from "./screens/Evaluation";
import AuditLog from "./screens/AuditLog";
import Reports from "./screens/Reports";
import SystemHealth from "./screens/SystemHealth";

/* ── Components ── */
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

/* ── Auth Screens ── */
import Login from "./screens/Login";
import ForgotPassword from "./screens/ForgotPassword";
import ResetPassword from "./screens/ResetPassword";
import AcceptInvitation from "./screens/AcceptInvitation";
import VerifyEmail from "./screens/VerifyEmail";

/* ── Marketing Screens ── */
import MarketingLayout from "./marketing/MarketingLayout";
import Home from "./marketing/Home";
import Platform from "./marketing/Platform";
import Solutions from "./marketing/Solutions";
import Integrations from "./marketing/Integrations";
import SecurityCompliance from "./marketing/SecurityCompliance";
import Resources from "./marketing/Resources";
import About from "./marketing/About";
import Contact from "./marketing/Contact";

import type { Screen } from "./types";

/* ── Helpers ── */
function pathToScreen(pathname: string): Screen {
  const map: Record<string, Screen> = {
    "/dashboard":              "dashboard",
    "/simulation":             "simulation-configure",
    "/simulation/running":     "simulation-running",
    "/simulation/result":      "simulation-result",
    "/devices":                "devices",
    "/devices/detail":         "device-detail",
    "/incidents":              "incidents",
    "/incidents/overview":     "incident-overview",
    "/incidents/safereuse":    "incident-safereuse",
    "/incidents/response":     "incident-response",
    "/cases":                  "case-memory",
    "/cases/detail":           "case-detail",
    "/evaluation":             "evaluation",
    "/audit":                  "audit-log",
    "/reports":                "reports",
    "/system":                 "system-health",
    "/settings":               "settings",
  };
  return map[pathname] ?? "dashboard";
}

function screenToPath(screen: Screen): string {
  const map: Record<Screen, string> = {
    "login":                  "/login",
    "dashboard":              "/dashboard",
    "simulation-configure":   "/simulation",
    "simulation-running":     "/simulation/running",
    "simulation-result":      "/simulation/result",
    "devices":                "/devices",
    "device-detail":          "/devices/detail",
    "incidents":              "/incidents",
    "incident-overview":      "/incidents/overview",
    "incident-safereuse":     "/incidents/safereuse",
    "incident-response":      "/incidents/response",
    "case-memory":            "/cases",
    "case-detail":            "/cases/detail",
    "evaluation":             "/evaluation",
    "audit-log":              "/audit",
    "reports":                "/reports",
    "system-health":          "/system",
    "settings":               "/settings",
    "forgot-password":        "/forgot-password",
    "reset-password":         "/reset-password",
    "accept-invitation":      "/accept-invitation",
    "verify-email":           "/verify-email",
  };
  return map[screen] ?? "/dashboard";
}

/* ── Authenticated shell ── */
function AuthenticatedApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [incidentTab, setIncidentTab] = useState<"overview" | "safereuse" | "response">("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentScreen = pathToScreen(location.pathname);

  function handleNavigate(s: Screen) {
    if (s.startsWith("incident-")) {
      const tab = s.replace("incident-", "") as "overview" | "safereuse" | "response";
      setIncidentTab(tab);
    }
    navigate(screenToPath(s));
  }

  // Role guard: the backend requires the `admin` role for the audit log
  // (see app/main.py access_control: '/api/audit'). The frontend role name for
  // that tier is `super_admin`, so that is what is compared here and in
  // AuditLog itself. Previously both compared against "admin", a value no role
  // can hold, which redirected every user away from the page.
  if (currentScreen === "audit-log" && user?.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-full" style={{ background: "var(--bg)" }}>
      <Sidebar
        screen={currentScreen}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          screen={currentScreen}
          onNavigate={handleNavigate}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />

        <main className="relative min-h-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/dashboard"      element={<Dashboard onNavigate={handleNavigate} />} />
            <Route path="/simulation/*"   element={<AttackSimulation onNavigate={handleNavigate} />} />
            <Route path="/devices"        element={<Devices onNavigate={handleNavigate} />} />
            <Route path="/devices/detail" element={<DeviceDetail onNavigate={handleNavigate} />} />
            <Route path="/incidents"      element={<Incidents onNavigate={handleNavigate} />} />
            <Route path="/incidents/*"    element={
              <IncidentDetail
                tab={incidentTab}
                onNavigate={handleNavigate}
                onTabChange={(t) => {
                  setIncidentTab(t);
                  navigate(`/incidents/${t}`);
                }}
              />
            } />
            <Route path="/cases"          element={<CaseMemory onNavigate={handleNavigate} />} />
            <Route path="/cases/detail"   element={<CaseDetail onNavigate={handleNavigate} />} />
            <Route path="/evaluation"     element={<Evaluation onNavigate={handleNavigate} />} />
            <Route path="/audit"          element={<AuditLog onNavigate={handleNavigate} />} />
            <Route path="/reports"        element={<Reports onNavigate={handleNavigate} />} />
            <Route path="/system"         element={<SystemHealth onNavigate={handleNavigate} />} />
            <Route path="/settings"       element={<SystemHealth onNavigate={handleNavigate} />} />
            <Route path="*"               element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ── Root with auth & marketing routing ── */
function AppRouter() {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {/* Marketing Site */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Home />} />

        <Route path="/platform" element={<Platform />} />
        <Route path="/capabilities" element={<Platform />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/healthcare-security" element={<Solutions />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/security" element={<SecurityCompliance />} />
        <Route path="/compliance" element={<SecurityCompliance />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth Flows */}
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot-password" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
      <Route path="/reset-password" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />
      <Route path="/accept-invitation" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <AcceptInvitation />} />
      <Route path="/verify-email" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <VerifyEmail />} />

      {/* Authenticated Application */}
      <Route path="/*" element={isLoggedIn ? <AuthenticatedApp /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

/* ── Root export ── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}