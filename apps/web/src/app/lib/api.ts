import { ApiError, getToken, request, setToken } from './offline-api';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  department: 'admin' | 'nursery' | 'environmental' | 'solid-waste' | 'landfill' | 'enforcement';
  staff_role: 'main_admin' | 'section_admin';
  role: string;
}

export interface AdminStaffAccount extends StaffUser {
  section_label: string;
}

export interface HistoryEntry {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  section: string;
  section_label: string;
  status: string;
  performed_by: string;
  event_date: string;
}

export interface SectionService {
  id: string;
  department_id: string;
  department_name: string;
  service_name: string;
  description: string;
  requirements?: string;
  processing_time?: string;
  status: 'Active' | 'Inactive';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // backward compatibility
  section: string;
  section_name: string;
  inquiry_category: string;
  title: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  status: string;
}

export interface CitizenUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  account_type: 'staff' | 'citizen';
  department?: string;
  staff_role?: 'main_admin' | 'section_admin';
  role?: string;
  phone?: string;
  section_label?: string;
  created_at?: string;
}

export interface Inquiry {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  priority: 'Low' | 'Normal' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
  assigned_to: string;
  department_id?: string;
  service_id?: string;
  date_submitted: string;
  updated_at?: string;
  response?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  participants: number;
  department: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  phone: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  date_hired: string;
}

export interface Record {
  id: string;
  record_type: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: 'Active' | 'Archived' | 'Pending';
  created_by: string;
}

export interface DashboardStats {
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
  departmentStats?: {
    pendingInquiries: number;
    activities: number;
  } | null;
}

export interface DashboardStatCard {
  label: string;
  value: string;
}

export interface DepartmentDashboardData {
  stats: DashboardStatCard[];
  tableItems: Array<Record<string, string | number>>;
  capacityPercent?: number;
  capacityHistory?: Array<{ month: string; percent: number }>;
}

export const api = {
  getToken,
  setToken,

  auth: {
    staffLogin: (email: string, password: string) =>
      request<{ token: string; user: StaffUser }>('/auth/staff/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    citizenRegister: (data: { name: string; email: string; password: string; phone?: string }) =>
      request<{ token: string; user: CitizenUser }>('/auth/citizen/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    citizenLogin: (email: string, password: string) =>
      request<{ token: string; user: CitizenUser }>('/auth/citizen/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    me: () =>
      request<{ type: 'staff' | 'citizen'; user: StaffUser | CitizenUser }>('/auth/me'),
  },

  inquiries: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<Inquiry[]>(`/inquiries${query}`);
    },
    create: (data: Partial<Inquiry> & { department_id?: string; service_id?: string }) =>
      request<Inquiry>('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { status?: string; response?: string }) =>
      request<Inquiry>(`/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  activities: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<Activity[]>(`/activities${query}`);
    },
    create: (data: Partial<Activity>) =>
      request<Activity>('/activities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Activity>) =>
      request<Activity>(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/activities/${id}`, { method: 'DELETE' }),
  },

  employees: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<Employee[]>(`/employees${query}`);
    },
    create: (data: Partial<Employee & { dateHired?: string }>) =>
      request<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Employee & { dateHired?: string }>) =>
      request<Employee>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/employees/${id}`, { method: 'DELETE' }),
  },

  records: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<Record[]>(`/records${query}`);
    },
    create: (data: Partial<Record & { recordType?: string; createdBy?: string }>) =>
      request<Record>('/records', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Record & { recordType?: string; createdBy?: string }>) =>
      request<Record>(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/records/${id}`, { method: 'DELETE' }),
  },

  stats: {
    dashboard: () => request<DashboardStats>('/stats/dashboard'),
    department: (department: string) =>
      request<DepartmentDashboardData>(`/stats/department/${department}`),
  },

  history: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<HistoryEntry[]>(`/history${query}`);
    },
  },

  users: {
    list: () => request<UserAccount[]>('/users'),
  },

  sync: {
    status: () =>
      request<{
        totalLogs: number;
        totalConflicts: number;
        lastSyncAt: string | null;
        recentLogs: Array<Record<string, unknown>>;
      }>('/sync/status'),
    logs: (limit = 100) => request<Array<Record<string, unknown>>>(`/sync/logs?limit=${limit}`),
  },

  adminStaff: {
    list: () => request<AdminStaffAccount[]>('/admin-staff'),
    create: (data: Partial<AdminStaffAccount & { password?: string }>) =>
      request<AdminStaffAccount>('/admin-staff', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<AdminStaffAccount & { password?: string }>) =>
      request<AdminStaffAccount>(`/admin-staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/admin-staff/${id}`, { method: 'DELETE' }),
  },

  services: {
    list: (params?: { department_id?: string }) => {
      const query = params?.department_id ? `?department_id=${params.department_id}` : '';
      return request<SectionService[]>(`/services${query}`);
    },
    manage: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<SectionService[]>(`/services/manage${query}`);
    },
    create: (data: Partial<SectionService>) =>
      request<SectionService>('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<SectionService>) =>
      request<SectionService>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/services/${id}`, { method: 'DELETE' }),
  },

  departments: {
    list: () => request<Department[]>('/departments'),
  },
};

export { ApiError };
