import React from 'react';
import {
  Printer,
  Share2,
  X,
  Wifi,
} from 'lucide-react';
import { Receipt } from '../types';
import { formatIQD, formatArabicDateTime, NANO_DEVICE_MODEL } from '../utils/rules';
import { printReceiptVoucher } from '../utils/pdfGenerator';

interface ReceiptVoucherModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

export const ReceiptVoucherModal: React.FC<ReceiptVoucherModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    printReceiptVoucher(receipt);
  };

  const handleWhatsApp = () => {
    const text = `*سند قبض واشتراك إنترنت - NanoPay*
رقم السند: ${receipt.receiptNumber}
اسم المشترك: ${receipt.subscriberName}
نوع الاشتراك: ${receipt.planType === 'three_months' ? `عرض 3 أشهر (${receipt.planPrice} ألف)` : `شهري (${receipt.planPrice} ألف)`}
المقبوضات: ${receipt.selectedOptionText}
المبلغ المقبوض: ${receipt.actualCashReceived.toLocaleString('ar-IQ')} د.ع (${receipt.cashStatus === 'paid' ? 'واصل' : 'غير واصل'})
${receipt.requiresNano ? `جهاز النانو (${NANO_DEVICE_MODEL}): ${receipt.nanoReceived ? 'واصل (مستلم)' : 'غير واصل'}` : ''}
القائم بالعملية: ${receipt.employeeName}
التاريخ: ${new Date(receipt.createdAt).toLocaleDateString('ar-IQ')}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-scaleIn">
        {/* Top */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="font-black text-xs text-slate-800 dark:text-slate-200">
            معاينة سند القبض
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher */}
        <div className="p-5 space-y-3.5 text-xs">
          <div className="text-center pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              NanoPay • سند قبض ومقبوضات
            </h3>
            <span className="inline-block mt-1 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {receipt.receiptNumber}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-bold">اسم المشترك الثلاثي:</span>
              <span className="font-black text-slate-900 dark:text-white text-sm">
                {receipt.subscriberName}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-bold">نوع الاشتراك:</span>
              <span className="font-bold">
                {receipt.planType === 'three_months'
                  ? `عرض 3 أشهر (${receipt.planPrice} ألف)`
                  : `شهري (${receipt.planPrice} ألف)`}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-bold">المقبوضات:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {receipt.selectedOptionText}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">المبلغ المقبوض:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {formatIQD(receipt.actualCashReceived)}
              </span>
            </div>

            {receipt.requiresNano && (
              <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-teal-600" />
                  {NANO_DEVICE_MODEL}
                </span>
                <span className="font-bold text-teal-800 dark:text-teal-200">
                  {receipt.nanoReceived ? 'واصل (مستلم)' : 'غير واصل (مؤجل)'}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-400 text-[11px]">
              <span>القائم بالعملية:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{receipt.employeeName}</span>
            </div>

            <div className="flex justify-between py-1 text-slate-400 text-[11px]">
              <span>التاريخ:</span>
              <span>{formatArabicDateTime(receipt.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الوصل</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>واتساب</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
