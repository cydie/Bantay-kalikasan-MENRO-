import { BrowserRouter, Routes, Route, Navigate, HashRouter } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CitizenAuthProvider } from './contexts/CitizenAuthContext';
import { OnlineStatusProvider } from './contexts/OnlineStatusContext';
import { DataRefreshProvider } from './contexts/DataRefreshContext';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { isDesktop } from './lib/platform';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { CitizenLoginPage } from './components/CitizenLoginPage';
import { PublicInquiryPage } from './components/PublicInquiryPage';
import { CitizenPortal } from './components/CitizenPortal';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { NurseryDashboard } from './components/dashboards/NurseryDashboard';
import { EnvironmentalDashboard } from './components/dashboards/EnvironmentalDashboard';
import { SolidWasteDashboard } from './components/dashboards/SolidWasteDashboard';
import { LandfillDashboard } from './components/dashboards/LandfillDashboard';
import { EnforcementDashboard } from './components/dashboards/EnforcementDashboard';
import { Loader2 } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:';
const Router = isElectron ? HashRouter : BrowserRouter;

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading Bantay Kalikasan...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/staff-login" replace />;

  return <>{children}</>;
}

function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/staff-login" replace />;

  switch (user.department) {
    case 'admin':
      return <AdminDashboard />;
    case 'nursery':
      return <NurseryDashboard />;
    case 'environmental':
      return <EnvironmentalDashboard />;
    case 'solid-waste':
      return <SolidWasteDashboard />;
    case 'landfill':
      return <LandfillDashboard />;
    case 'enforcement':
      return <EnforcementDashboard />;
    default:
      return <Navigate to="/staff-login" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/inquiries" element={<PublicInquiryPage />} />
      <Route path="/staff-login" element={<LoginPage />} />
      <Route path="/citizen-login" element={<CitizenLoginPage />} />
      <Route path="/citizen-portal" element={<CitizenPortal />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const routes = (
    <AuthProvider>
      <CitizenAuthProvider>
        <AppRoutes />
        {isDesktop() && <OfflineStatusBanner />}
      </CitizenAuthProvider>
    </AuthProvider>
  );

  return (
    <Router>
      <DataRefreshProvider>
        {isDesktop() ? <OnlineStatusProvider>{routes}</OnlineStatusProvider> : routes}
      </DataRefreshProvider>
      <Toaster richColors position="top-right" />
    </Router>
  );
}

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      isDesktop: boolean;
      apiUrl?: string;
      storage?: {
        init: () => Promise<{ path: string }>;
        getAll: <T>(entity: string) => Promise<T[]>;
        upsert: (entity: string, items: unknown) => Promise<void>;
        remove: (entity: string, id: string) => Promise<void>;
        replaceAll: (entity: string, items: unknown[]) => Promise<void>;
        getCache: <T>(pathKey: string) => Promise<T | null>;
        setCache: <T>(pathKey: string, data: T) => Promise<void>;
        getSyncQueue: () => Promise<Array<{
          id?: number;
          method: string;
          path: string;
          body?: string;
          created_at: string;
          status: string;
          record_id?: string;
          module_name?: string;
          operation_type?: string;
          local_updated_at?: string;
          error_message?: string;
          retry_count?: number;
        }>>;
        getSyncQueueStats: () => Promise<{ pending: number; failed: number; syncing: number }>;
        addToSyncQueue: (item: {
          method: string;
          path: string;
          body?: string;
          created_at: string;
          record_id?: string;
          module_name?: string;
          operation_type?: string;
          local_updated_at?: string;
        }) => Promise<void>;
        markSyncQueueSynced: (ids: number[]) => Promise<void>;
        markSyncQueueFailed: (id: number, errorMessage: string) => Promise<void>;
        resetFailedSyncQueue: () => Promise<void>;
        clearFailedSyncQueue: () => Promise<void>;
        addSyncLog: (entry: {
          queue_id?: number;
          module_name: string;
          record_id: string;
          operation_type: string;
          status: string;
          message: string;
          created_at: string;
        }) => Promise<void>;
        getSyncLogs: (limit?: number) => Promise<Array<Record<string, unknown>>>;
        setIdMapping: (localId: string, moduleName: string, serverId: string) => Promise<void>;
        getIdMapping: (localId: string, moduleName: string) => Promise<string | null>;
        getSyncMetadata: () => Promise<Record<string, unknown>>;
        updateSyncMetadata: (updates: Record<string, unknown>) => Promise<void>;
      };
    };
  }
}
