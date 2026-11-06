import React, { useState } from 'react';
import {
  Search,
  Printer,
  Trash2,
  Edit2,
  Wifi,
  DollarSign,
  User as UserIcon,
  FileDown,
  Clock,
  Plus,
} from 'lucide-react';
import { Receipt, StatsSummary, User } from '../types';
import { formatIQD, formatArabicDateTime, NANO_DEVICE_MODEL } from '../utils/rules';
import { exportReceiptsToPDF } from '../utils/pdfGenerator';
import { EditReceiptModal } from './EditReceiptModal';

interface ReceiptsListProps {
  receipts: Receipt[];
  stats: StatsSummary;
  currentUser: User | null;
  onUpdateReceipt: (id: string, update: Partial<Receipt>) => Promise<void>;
  onDeleteReceipt: (id: string, receiptNumber: string, subscriberName: string) => Promise<void>;
  onOpenReceiptVoucher: (receipt: Receipt) => void;
  onNavigateToNew: () => void;
}

export const ReceiptsList: React.FC<ReceiptsListProps> = ({
  receipts,
  stats,
  currentUser,
  onUpdateReceipt,
  onDeleteReceipt,
  onOpenReceiptVoucher,
  onNavigateToNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'paid' | 'unpaid' | 'nano_received' | 'nano_pending' | 'monthly' | 'three_months'
  >('all');
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<string>('all');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);

  const filteredReceipts = receipts.filter((r) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = r.subscriberName.toLowerCase().includes(q);
      const matchNo = r.receiptNumber.toLowerCase().includes(q);
      if (!matchName && !matchNo) return false;
    }

    if (filterType === 'paid' && r.cashStatus !== 'paid') return false;
    if (filterType === 'unpaid' && r.cashStatus === 'paid') return false;
    if (filterType === 'nano_received' && (!r.requiresNano || !r.nanoReceived)) return false;
    if (filterType === 'nano_pending' && (!r.requiresNano || r.nanoReceived)) return false;
    if (filterType === 'monthly' && r.planType !== 'monthly') return false;
    if (filterType === 'three_months' && r.planType !== 'three_months') return false;

    if (selectedPlanPrice !== 'all' && String(r.planPrice) !== selectedPlanPrice) return false;

    return true;
  });

  const handleDelete = async (r: Receipt) => {
    if (window.confirm(`هل أنت متأكد من حذف السند ${r.receiptNumber} للمشترك ${r.subscriberName}؟`)) {
      setIsDeletingId(r.id);
      try {
        await onDeleteReceipt(r.id, r.receiptNumber, r.subscriberName);
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-28 space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="بحث باسم المشترك الثلاثي أو رقم السند..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <button
            onClick={() => exportReceiptsToPDF(filteredReceipts, stats)}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير PDF</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            الكل ({receipts.length})
          </button>

          <button
            onClick={() => setFilterType('paid')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterType === 'paid'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            واصل كاش
          </button>

          <button
            onClick={() => setFilterType('unpaid')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterType === 'unpaid'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
            }`}
          >
            غير واصل كاش
          </button>

          <button
            onClick={() => setFilterType('nano_received')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterType === 'nano_received'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
            }`}
          >
            نانو واصل ({stats.totalNanoReceivedCount})
          </button>

          <button
            onClick={() => setFilterType('nano_pending')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterType === 'nano_pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            نانو غير واصل ({stats.totalNanoPendingCount})
          </button>

          <button
            onClick={() => setFilterType('three_months')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterType === 'three_months'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
            }`}
          >
            عروض 3 أشهر
          </button>
        </div>
      </div>

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
            لا توجد مقبوضات مطابقة
          </p>
          <button
            onClick={onNavigateToNew}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            تسجيل مقبوض جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredReceipts.map((r) => {
            const isFullyPaid = r.cashStatus === 'paid';
            const isUnpaid = r.cashStatus === 'unpaid';
            const hasNanoPending = r.requiresNano && !r.nanoReceived;

            // Permission rule: Can be edited by creator employee OR by admin
            const canEdit = currentUser?.role === 'admin' || currentUser?.id === r.employeeId;
            const canDelete = currentUser?.role === 'admin';

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden"
              >
                {/* Status indicator bar */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1.5 ${
                    isUnpaid || hasNanoPending
                      ? 'bg-amber-500'
                      : isFullyPaid
                      ? 'bg-emerald-500'
                      : 'bg-teal-500'
                  }`}
                ></div>

                {/* Card Header: Receipt Number & Author */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs">
                      {r.receiptNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatArabicDateTime(r.createdAt)}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    القائم بها: {r.employeeName}
                  </span>
                </div>

                {/* Subscriber Name & Plan */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{r.subscriberName}</span>
                  </h4>

                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {r.planType === 'three_months'
                      ? `عرض 3 أشهر (${r.planPrice} ألف)`
                      : `شهري (${r.planPrice} ألف)`}
                  </span>
                </div>

                {/* Financial & Nano Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Cash Info */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] text-slate-400">المبلغ المقبوض:</div>
                    <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {formatIQD(r.actualCashReceived)}
                    </div>
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isFullyPaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {isFullyPaid ? 'واصل' : 'غير واصل'}
                    </span>
                  </div>

                  {/* Nano Info */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-teal-600" />
                      <span>النانو:</span>
                    </div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {r.requiresNano ? NANO_DEVICE_MODEL : 'غير مطلوب'}
                    </div>
                    {r.requiresNano && (
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          r.nanoReceived
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {r.nanoReceived ? 'واصل (مستلم)' : 'غير واصل (مؤجل)'}
                      </span>
                    )}
                  </div>
                </div>

                {r.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                    ملاحظات: {r.notes}
                  </p>
                )}

                {/* Action Buttons: Edit (creator/admin), Print, Delete (admin) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Edit button: Creator employee or Admin */}
                    {canEdit && (
                      <button
                        onClick={() => setEditingReceipt(r)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenReceiptVoucher(r)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>معاينة السند</span>
                    </button>
                  </div>

                  {canDelete && (
                    <button
                      disabled={isDeletingId === r.id}
                      onClick={() => handleDelete(r)}
                      className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingReceipt && (
        <EditReceiptModal
          receipt={editingReceipt}
          currentUser={currentUser}
          onSave={onUpdateReceipt}
          onClose={() => setEditingReceipt(null)}
        />
      )}
    </div>
  );
};
