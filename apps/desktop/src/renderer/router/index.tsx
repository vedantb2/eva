import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { HomePage } from "../pages/HomePage";
import { SessionPage } from "../pages/SessionPage";
import { SettingsPage } from "../pages/SettingsPage";

export function AppRouter() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/session/:sessionId" element={<SessionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
