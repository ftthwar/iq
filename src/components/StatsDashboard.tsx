import React, { useState, useRef } from 'react';
import {
  DollarSign,
  Wifi,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
  FileDown,
  Database,
  UploadCloud,
  DownloadCloud,
} from 'lucide-react';
import { Receipt, StatsSummary, User } from '../types';
import { formatIQD } from '../utils/rules';
import { exportReceiptsToPDF } from '../utils/pdfGenerator';
import { firebaseDb } from '../services/firebaseDb';

interface StatsDashboardProps {
  stats: StatsSummary;
  receipts: Receipt[];
  currentUser: User | null;
  dateRange: string;
  setDateRange: (range: string) => void;
  onRefreshStats: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  receipts,
  currentUser,
  dateRange,
  setDateRange,
  onRefreshStats,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'plans' | 'employees' | 'backup'>('overview');
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin';

  const dateLabels: Record<string, string> = {
    all: 'جميع الفترات',
    today: 'اليوم',
    week: 'آخر 7 أيام',
    month: 'هذا الشهر',
  };

  const handleExportBackup = async () => {
    setIsBackupLoading(true);
    try {
      const data = await firebaseDb.exportFullBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NanoPay-Firebase-Backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('فشل تصدير النسخة الاحتياطية: ' + e.message);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('هل تريد استعادة البيانات ودمجها مباشرة في قاعدة بيانات فايربيس؟')) {
      return;
    }

    setIsBackupLoading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await firebaseDb.restoreBackup(parsed, {
        id: currentUser?.id || 'usr-admin',
        fullName: currentUser?.fullName || 'المدير',
      });
      alert(`تمت استعادة ${res.restoredCount} سند بنجاح وتخزينها في قاعدة البيانات مباشرة!`);
      onRefreshStats();
    } catch (err: any) {
      alert('فشل استعادة النسخة الاحتياطية: ' + err.message);
    } finally {
      setIsBackupLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-28 space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'هذا الأسبوع' },
            { id: 'month', label: 'هذا الشهر' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateRange(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                dateRange === item.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => exportReceiptsToPDF(receipts, stats, dateLabels[dateRange])}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <FileDown className="w-4 h-4" />
          <span>تصدير تقرير PDF</span>
        </button>
      </div>

      {/* CORE STATS 4 CARDS: المبالغ المقبوضة، غير واصل، نانو واصل، نانو غير واصل */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. المقبوضات */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-emerald-200 dark:border-emerald-900 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>المبالغ المقبوضة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatIQD(stats.totalCollectedCash)}
          </div>
        </div>

        {/* 2. غير واصل */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-red-200 dark:border-red-900 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>غير واصل (متبقي)</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-red-600 dark:text-red-400 truncate">
            {formatIQD(stats.totalUnpaidCash)}
          </div>
        </div>

        {/* 3. نانو واصل */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-teal-200 dark:border-teal-900 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>نانو واصل</span>
            <Wifi className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400">
            {stats.totalNanoReceivedCount} <span className="text-xs font-normal">جهاز</span>
          </div>
        </div>

        {/* 4. نانو غير واصل */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-amber-200 dark:border-amber-900 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>نانو غير واصل</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
            {stats.totalNanoPendingCount} <span className="text-xs font-normal">جهاز</span>
          </div>
        </div>
      </div>

      {/* Tabs: Plans / Employees / Backup (Admin) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab('plans')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'plans'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              حسب الباقات
            </button>
            <button
              onClick={() => setActiveSubTab('employees')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'employees'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              أداء الموظفين
            </button>

            {/* Admin Backup Tab */}
            {isAdmin && (
              <button
                onClick={() => setActiveSubTab('backup')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  activeSubTab === 'backup'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>النسخ الاحتياطي</span>
              </button>
            )}
          </div>

          <span className="text-xs font-bold text-slate-500">
            {stats.totalReceiptsCount} مقبوض
          </span>
        </div>

        {/* Tab 1: Plans */}
        {activeSubTab === 'plans' && (
          <div className="space-y-2">
            {stats.planBreakdown.map((item) => (
              <div
                key={item.planKey}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                  <div className="text-[11px] text-slate-500">{item.count} اشتراك</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {formatIQD(item.collectedCash)}
                    </span>
                  </div>
                  {(item.nanoReceived > 0 || item.nanoPending > 0) && (
                    <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 pr-2 border-r border-slate-200 dark:border-slate-700">
                      نانو: {item.nanoReceived} واصل | {item.nanoPending} غير واصل
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Employees */}
        {activeSubTab === 'employees' && (
          <div className="space-y-2">
            {stats.employeePerformance.map((emp) => (
              <div
                key={emp.employeeId}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{emp.employeeName}</div>
                  <div className="text-[11px] text-slate-500">{emp.receiptsCount} عملية تسجيل</div>
                </div>

                <div className="text-right">
                  <div className="font-black text-emerald-600 dark:text-emerald-400">
                    {formatIQD(emp.collectedCash)}
                  </div>
                  <div className="text-[11px] text-teal-600 font-bold">
                    {emp.nanoReceived} نانو واصل
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Admin Backup & Restore */}
        {activeSubTab === 'backup' && isAdmin && (
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-4">
            <div>
              <h4 className="font-black text-sm text-purple-900 dark:text-purple-200">
                النسخ الاحتياطي والاستعادة المباشرة لقاعدة بيانات فايربيس
              </h4>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                يمكن للمدير حفظ نسخة كاملة من البيانات واستعادتها دون أي فقدان للبيانات.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Export Backup */}
              <button
                disabled={isBackupLoading}
                onClick={handleExportBackup}
                className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>تحميل نسخة احتياطية (JSON)</span>
              </button>

              {/* Import / Restore Backup */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  disabled={isBackupLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 hover:bg-purple-50 text-purple-800 dark:text-purple-200 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>استعادة نسخة احتياطية من ملف</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
