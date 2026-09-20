import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/common/AppShell';
import { AuthProvider } from './services/auth/AuthContext';
import { TabsProvider } from './services/tabs/TabsContext';
import { HomePage } from './pages/Home/HomePage';
import { BookmarksPage } from './pages/Bookmarks/BookmarksPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { DownloadsPage } from './pages/Downloads/DownloadsPage';
import { SettingsLayout } from './pages/Settings/SettingsLayout';
import { SettingsHubPage } from './pages/Settings/SettingsHubPage';
import { GeneralSettingsPage } from './pages/Settings/GeneralSettingsPage';
import { AppearanceSettingsPage } from './pages/Settings/AppearanceSettingsPage';
import { TabsSettingsPage } from './pages/Settings/TabsSettingsPage';
import { LoginPage } from './pages/Login/LoginPage';
import { SignupPage } from './pages/Signup/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPassword/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPassword/ResetPasswordPage';

function App() {
  return (
    <AuthProvider>
      <TabsProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<SettingsHubPage />} />
              <Route path="general" element={<GeneralSettingsPage />} />
              <Route path="appearance" element={<AppearanceSettingsPage />} />
              <Route path="tabs" element={<TabsSettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </TabsProvider>
    </AuthProvider>
  );
}

export default App;
