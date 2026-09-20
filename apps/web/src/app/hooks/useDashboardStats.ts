import { useEffect, useState } from 'react';
import { api, type DepartmentDashboardData } from '../lib/api';

import { useDataRefresh, useReloadTracker } from '../contexts/DataRefreshContext';

export function useDepartmentDashboard(department: string) {
  const { refreshKey } = useDataRefresh();
  const [data, setData] = useState<DepartmentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useReloadTracker(loading);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.stats
      .department(department)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [department, refreshKey]);

  return { data, loading, error };
}

export function useAdminDashboard() {
  const { refreshKey } = useDataRefresh();
  const [stats, setStats] = useState<{
    totalEmployees: number;
    pendingInquiries: number;
    totalActivities: number;
    activeDepartments: number;
    recentActivities: Array<{
      user_name: string;
      action: string;
      department: string;
      created_at: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useReloadTracker(loading);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.stats
      .dashboard()
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { stats, loading, error };
}
