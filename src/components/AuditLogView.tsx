import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  User as UserIcon,
  Clock,
  Filter,
  CheckCircle,
  AlertCircle,
  FileText,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { AuditLog } from '../types';
import { formatArabicDateTime } from '../utils/rules';

interface AuditLogViewProps {
  logs: AuditLog[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onRefresh, isLoading }) => {
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'all') return true;
    if (filterAction === 'receipts' && log.actionType.includes('receipt')) return true;
    if (filterAction === 'users' && log.actionType.includes('user')) return true;
    if (filterAction === 'nano' && log.actionType.includes('nano')) return true;
    return true;
  });

  const getActionBadge = (type: AuditLog['actionType']) => {
    switch (type) {
      case 'create_receipt':
        return { label: 'تسجيل مقبوض', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'toggle_nano_status':
        return { label: 'تحديث نانو', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
      case 'toggle_cash_status':
        return { label: 'تحديث نقد', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'delete_receipt':
        return { label: 'حذف مقبوض', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' };
      case 'create_user':
        return { label: 'إضافة موظف', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'login':
        return { label: 'تسجيل دخول', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
      default:
        return { label: 'عملية نظام', color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-28 space-y-4">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-300">
              <History className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              سجل العمليات (Audit Log)
            </h2>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          title="تحديث السجل"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'all', label: 'جميع العمليات' },
          { id: 'receipts', label: 'المقبوضات' },
          { id: 'nano', label: 'حركات أجهزة النانو' },
          { id: 'users', label: 'المستخدمين والصلاحيات' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterAction(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterAction === tab.id
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 text-center text-slate-500 text-xs">
            لا توجد سجلات مطابقة للفلتر
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getActionBadge(log.actionType);

            return (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start gap-3 hover:border-slate-300 transition-all"
              >
                {/* User avatar indicator */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                    log.userRole === 'admin' ? 'bg-purple-600' : 'bg-emerald-600'
                  }`}
                >
                  {log.userRole === 'admin' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {log.userName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatArabicDateTime(log.timestamp)}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {log.title}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
