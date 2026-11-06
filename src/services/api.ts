import { AuditLog, Receipt, StatsSummary, User } from '../types';

const BASE_URL = '/api';

export const api = {
  // Auth
  async login(username: string, password: string):Promise<{ user: User; token: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل تسجيل الدخول');
    }
    return res.json();
  },

  // Users (Employees)
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/users`);
    if (!res.ok) throw new Error('فشل جلب قائمة الموظفين');
    return res.json();
  },

  async createUser(payload: {
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'employee';
    phone?: string;
    currentUserId: string;
    currentUserName: string;
    currentUserRole: string;
  }): Promise<User> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل إنشاء حساب الموظف');
    }
    return res.json();
  },

  async updateUser(
    id: string,
    payload: {
      fullName?: string;
      password?: string;
      role?: 'admin' | 'employee';
      phone?: string;
      isActive?: boolean;
      currentUserId: string;
      currentUserName: string;
      currentUserRole: string;
    }
  ): Promise<User> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل تحديث بيانات الموظف');
    }
    return res.json();
  },

  async deleteUser(
    id: string,
    currentUserId: string,
    currentUserName: string,
    currentUserRole: string
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId, currentUserName, currentUserRole }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل حذف الموظف');
    }
  },

  // Receipts
  async getReceipts(params?: {
    q?: string;
    planType?: string;
    cashStatus?: string;
    nanoStatus?: string;
    employeeId?: string;
  }): Promise<Receipt[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.planType) query.append('planType', params.planType);
    if (params?.cashStatus) query.append('cashStatus', params.cashStatus);
    if (params?.nanoStatus) query.append('nanoStatus', params.nanoStatus);
    if (params?.employeeId) query.append('employeeId', params.employeeId);

    const res = await fetch(`${BASE_URL}/receipts?${query.toString()}`);
    if (!res.ok) throw new Error('فشل جلب المقبوضات');
    return res.json();
  },

  async createReceipt(payload: Partial<Receipt> & { employeeRole?: string }): Promise<Receipt> {
    const res = await fetch(`${BASE_URL}/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل تسجيل المقبوض');
    }
    return res.json();
  },

  async updateReceipt(
    id: string,
    payload: Partial<Receipt> & {
      currentUserId?: string;
      currentUserName?: string;
      currentUserRole?: string;
    }
  ): Promise<Receipt> {
    const res = await fetch(`${BASE_URL}/receipts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل تحديث المقبوض');
    }
    return res.json();
  },

  async deleteReceipt(
    id: string,
    currentUserId: string,
    currentUserName: string,
    currentUserRole: string
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/receipts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId, currentUserName, currentUserRole }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل حذف سند المقبوض');
    }
  },

  // Audit Logs
  async getAuditLogs(params?: { actionType?: string; userId?: string }): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    if (params?.actionType) query.append('actionType', params.actionType);
    if (params?.userId) query.append('userId', params.userId);

    const res = await fetch(`${BASE_URL}/audit-logs?${query.toString()}`);
    if (!res.ok) throw new Error('فشل جلب سجل العمليات');
    return res.json();
  },

  // Stats
  async getStats(params?: { range?: string; employeeId?: string }): Promise<StatsSummary> {
    const query = new URLSearchParams();
    if (params?.range) query.append('range', params.range);
    if (params?.employeeId) query.append('employeeId', params.employeeId);

    const res = await fetch(`${BASE_URL}/stats?${query.toString()}`);
    if (!res.ok) throw new Error('فشل جلب الإحصائيات');
    return res.json();
  },

  // Backup
  async exportBackup(): Promise<any> {
    const res = await fetch(`${BASE_URL}/backup/export`);
    if (!res.ok) throw new Error('فشل تصدير النسخة الاحتياطية');
    return res.json();
  },

  async restoreBackup(payload: {
    backupData: any;
    currentUserId: string;
    currentUserName: string;
    currentUserRole: string;
  }): Promise<{ success: boolean; count: number }> {
    const res = await fetch(`${BASE_URL}/backup/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل استعادة النسخة الاحتياطية');
    }
    return res.json();
  },
};
