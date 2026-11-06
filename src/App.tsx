/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { NewReceiptForm } from './components/NewReceiptForm';
import { ReceiptsList } from './components/ReceiptsList';
import { StatsDashboard } from './components/StatsDashboard';
import { EmployeesManagement } from './components/EmployeesManagement';
import { AuditLogView } from './components/AuditLogView';
import { ReceiptVoucherModal } from './components/ReceiptVoucherModal';
import { LoginModal } from './components/LoginModal';
import { AuditLog, Receipt, StatsSummary, User } from './types';
import { firebaseDb } from './services/firebaseDb';
import { CheckCircle2, AlertCircle, FileText, PlusCircle, BarChart3, History, Users } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nanopay_theme');
    return saved ? saved === 'dark' : false;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nanopay_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return {
      id: 'usr_admin_main',
      username: 'admin',
      fullName: 'مدير المنظومة (مسؤول النظام)',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  });

  const [activeTab, setActiveTab] = useState<TabType>('receipts');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [statsDateRange, setStatsDateRange] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [voucherModalReceipt, setVoucherModalReceipt] = useState<Receipt | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nanopay_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nanopay_theme', 'light');
    }
  }, [darkMode]);

  // Persist current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nanopay_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('nanopay_current_user');
    }
  }, [currentUser]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Firebase Real-time Subscriptions & Offline persistence
  useEffect(() => {
    setIsLoading(true);

    // Initial check & seed default admin in Firestore
    firebaseDb.seedIfEmpty();

    const unsubReceipts = firebaseDb.subscribeReceipts((list) => {
      setReceipts(list);
      setIsLoading(false);
    });

    const unsubUsers = firebaseDb.subscribeUsers((usersList) => {
      setEmployees(usersList);
      if (currentUser && usersList.length > 0) {
        const updated = usersList.find((u) => u.id === currentUser.id);
        if (updated) setCurrentUser(updated);
      }
    });

    const unsubAudit = firebaseDb.subscribeAuditLogs((logsList) => {
      setAuditLogs(logsList);
    });

    return () => {
      unsubReceipts();
      unsubUsers();
      unsubAudit();
    };
  }, []);

  // Compute stats in real-time from receipts and filter by statsDateRange
  const stats: StatsSummary = useMemo(() => {
    let filtered = [...receipts];
    if (statsDateRange === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      filtered = filtered.filter((r) => r.createdAt.startsWith(todayStr));
    } else if (statsDateRange === 'week') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      filtered = filtered.filter((r) => r.createdAt >= sevenDaysAgo);
    } else if (statsDateRange === 'month') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      filtered = filtered.filter((r) => r.createdAt.startsWith(currentMonth));
    }

    let totalReceiptsCount = filtered.length;
    let totalExpectedCash = 0;
    let totalCollectedCash = 0;
    let totalUnpaidCash = 0;
    let totalNanoRequiredCount = 0;
    let totalNanoReceivedCount = 0;
    let totalNanoPendingCount = 0;
    let monthlyCount = 0;
    let threeMonthsCount = 0;

    const planMap: Record<string, any> = {};
    const empMap: Record<string, any> = {};

    for (const r of filtered) {
      totalExpectedCash += r.expectedCash || 0;
      totalCollectedCash += r.actualCashReceived || 0;
      const rem = Math.max(0, (r.expectedCash || 0) - (r.actualCashReceived || 0));
      totalUnpaidCash += rem;

      if (r.planType === 'monthly') monthlyCount++;
      else threeMonthsCount++;

      if (r.requiresNano) {
        totalNanoRequiredCount++;
        if (r.nanoReceived) totalNanoReceivedCount++;
        else totalNanoPendingCount++;
      }

      const planKey = `${r.planType}_${r.planPrice}`;
      if (!planMap[planKey]) {
        planMap[planKey] = {
          planKey,
          name: r.planType === 'three_months' ? `عرض 3 أشهر (${r.planPrice} ألف)` : `شهري (${r.planPrice} ألف)`,
          count: 0,
          collectedCash: 0,
          unpaidCash: 0,
          nanoReceived: 0,
          nanoPending: 0,
        };
      }
      planMap[planKey].count++;
      planMap[planKey].collectedCash += r.actualCashReceived || 0;
      planMap[planKey].unpaidCash += rem;
      if (r.requiresNano) {
        if (r.nanoReceived) planMap[planKey].nanoReceived++;
        else planMap[planKey].nanoPending++;
      }

      const empId = r.employeeId || 'unknown';
      if (!empMap[empId]) {
        empMap[empId] = {
          employeeId: empId,
          employeeName: r.employeeName || 'الموظف',
          receiptsCount: 0,
          collectedCash: 0,
          nanoReceived: 0,
        };
      }
      empMap[empId].receiptsCount++;
      empMap[empId].collectedCash += r.actualCashReceived || 0;
      if (r.requiresNano && r.nanoReceived) {
        empMap[empId].nanoReceived++;
      }
    }

    return {
      totalReceiptsCount,
      totalExpectedCash,
      totalCollectedCash,
      totalUnpaidCash,
      totalNanoRequiredCount,
      totalNanoReceivedCount,
      totalNanoPendingCount,
      monthlyCount,
      threeMonthsCount,
      planBreakdown: Object.values(planMap),
      employeePerformance: Object.values(empMap),
    };
  }, [receipts, statsDateRange]);

  // Create receipt (automatically assigns currentUser as author)
  const handleCreateReceipt = async (payload: Partial<Receipt>) => {
    try {
      const created = await firebaseDb.createReceipt(
        {
          subscriberName: payload.subscriberName!,
          planType: payload.planType!,
          planPrice: payload.planPrice!,
          selectedOptionId: payload.selectedOptionId!,
          selectedOptionText: payload.selectedOptionText!,
          expectedCash: payload.expectedCash!,
          actualCashReceived: payload.actualCashReceived!,
          cashStatus: payload.cashStatus!,
          requiresNano: payload.requiresNano!,
          nanoReceived: payload.nanoReceived!,
          nanoModel: payload.nanoModel || 'PowerBeam M5 400',
          nanoSerial: payload.nanoSerial,
          employeeId: currentUser?.id || 'usr-system',
          employeeName: currentUser?.fullName || 'الموظف',
          notes: payload.notes,
        },
        receipts.length
      );

      showToast(`تم حفظ السند برقم (${created.receiptNumber})`);
      setActiveTab('receipts');
      return created;
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ السند', 'error');
      throw err;
    }
  };

  // Update receipt (Permission enforced: creator employee or admin)
  const handleUpdateReceipt = async (id: string, update: Partial<Receipt>) => {
    try {
      const target = receipts.find((r) => r.id === id);
      if (!target) return;

      const canEdit = currentUser?.role === 'admin' || currentUser?.id === target.employeeId;
      if (!canEdit) {
        showToast('لا تملك صلاحية تعديل هذا السند، التعديل متاح للمنشئ أو المدير فقط', 'error');
        return;
      }

      await firebaseDb.updateReceipt(id, update, {
        id: currentUser?.id || 'usr-system',
        fullName: currentUser?.fullName || 'الموظف',
        role: currentUser?.role || 'employee',
      });
      showToast('تم تحديث السند بنجاح');
    } catch (err: any) {
      showToast(err.message || 'فشل التحديث', 'error');
    }
  };

  // Delete receipt (Admin only)
  const handleDeleteReceipt = async (id: string, receiptNumber: string, subscriberName: string) => {
    try {
      await firebaseDb.deleteReceipt(id, receiptNumber, subscriberName, {
        id: currentUser?.id || 'usr-admin',
        fullName: currentUser?.fullName || 'المدير',
        role: currentUser?.role || 'admin',
      });
      showToast('تم حذف السند نهائياً');
    } catch (err: any) {
      showToast(err.message || 'فشل الحذف', 'error');
    }
  };

  // User management (Admin only)
  const handleCreateEmployee = async (payload: {
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'employee';
    phone?: string;
  }) => {
    try {
      await firebaseDb.createUser(payload, {
        id: currentUser?.id || 'usr-admin',
        fullName: currentUser?.fullName || 'المدير',
      });
      showToast(`تم إنشاء حساب ${payload.fullName} بنجاح`);
    } catch (err: any) {
      showToast(err.message || 'فشل إنشاء الحساب', 'error');
      throw err;
    }
  };

  const handleUpdateEmployee = async (id: string, payload: Partial<User>) => {
    try {
      await firebaseDb.updateUser(id, payload, {
        id: currentUser?.id || 'usr-admin',
        fullName: currentUser?.fullName || 'المدير',
      });
      showToast('تم تحديث بيانات الموظف');
    } catch (err: any) {
      showToast(err.message || 'فشل التحديث', 'error');
      throw err;
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const emp = employees.find((e) => e.id === id);
      await firebaseDb.deleteUser(id, emp?.fullName || id, {
        id: currentUser?.id || 'usr-admin',
        fullName: currentUser?.fullName || 'المدير',
      });
      showToast('تم حذف حساب الموظف');
    } catch (err: any) {
      showToast(err.message || 'فشل الحذف', 'error');
      throw err;
    }
  };

  // Login handler
  const handleLogin = async (username: string, pass: string) => {
    const user = employees.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === pass
    );

    if (!user) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    if (!user.isActive) {
      throw new Error('هذا الحساب معطل من قبل المدير');
    }

    setCurrentUser(user);
    showToast(`مرحباً ${user.fullName}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowUserModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl text-xs sm:text-sm font-bold animate-fadeIn backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Responsive Full-Screen / Mobile Container */}
      <div className="w-full max-w-5xl mx-auto min-h-screen flex flex-col justify-between">
        <div>
          {/* Header */}
          <Header
            currentUser={currentUser}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onOpenUserSwitch={() => setShowUserModal(true)}
            onLogout={handleLogout}
            onRefresh={() => showToast('البيانات محدثة لحظياً مع فايربيس')}
            isLoading={isLoading}
          />

          {/* Desktop & Tablet Navigation Tabs Bar */}
          <div className="hidden md:flex items-center justify-between px-6 py-2 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('receipts')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'receipts'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>المقبوضات ({receipts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('new')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'new'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>تسجيل مقبوض جديد</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'stats'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>الإحصائيات</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'logs'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>العمليات</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'users'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>الموظفين</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="p-3 sm:p-5">
            {activeTab === 'receipts' && (
              <ReceiptsList
                receipts={receipts}
                stats={stats}
                currentUser={currentUser}
                onUpdateReceipt={handleUpdateReceipt}
                onDeleteReceipt={handleDeleteReceipt}
                onOpenReceiptVoucher={(r) => setVoucherModalReceipt(r)}
                onNavigateToNew={() => setActiveTab('new')}
              />
            )}

            {activeTab === 'new' && (
              <NewReceiptForm
                currentUser={currentUser}
                onSubmitReceipt={handleCreateReceipt}
                onCancel={() => setActiveTab('receipts')}
              />
            )}

            {activeTab === 'stats' && (
              <StatsDashboard
                stats={stats}
                receipts={receipts}
                currentUser={currentUser}
                dateRange={statsDateRange}
                setDateRange={setStatsDateRange}
                onRefreshStats={() => {}}
              />
            )}

            {activeTab === 'logs' && (
              <AuditLogView
                logs={auditLogs}
                onRefresh={() => {}}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'users' && (
              <EmployeesManagement
                currentUser={currentUser}
                employees={employees}
                onCreateEmployee={handleCreateEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
              />
            )}
          </main>
        </div>

        {/* Mobile Docked Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          receiptsCount={receipts.length}
          pendingNanoCount={stats.totalNanoPendingCount}
        />
      </div>

      {/* Modals */}
      <ReceiptVoucherModal
        receipt={voucherModalReceipt}
        onClose={() => setVoucherModalReceipt(null)}
      />

      {showUserModal && (
        <LoginModal
          currentUser={currentUser}
          employees={employees}
          onLogin={handleLogin}
          onSelectUserDirectly={(u) => setCurrentUser(u)}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  );
}
