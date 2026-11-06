import React, { useState } from 'react';
import { X, Check, AlertCircle, Wifi, DollarSign, User as UserIcon } from 'lucide-react';
import { CashStatus, Receipt, User } from '../types';
import { formatIQD, NANO_DEVICE_MODEL, validateThreePartName } from '../utils/rules';

interface EditReceiptModalProps {
  receipt: Receipt;
  currentUser: User | null;
  onSave: (id: string, updatedData: Partial<Receipt>) => Promise<void>;
  onClose: () => void;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({
  receipt,
  currentUser,
  onSave,
  onClose,
}) => {
  const [subscriberName, setSubscriberName] = useState(receipt.subscriberName);
  const [cashStatus, setCashStatus] = useState<CashStatus>(receipt.cashStatus);
  const [actualCashReceived, setActualCashReceived] = useState<number>(receipt.actualCashReceived);
  const [nanoReceived, setNanoReceived] = useState<boolean>(receipt.nanoReceived);
  const [nanoSerial, setNanoSerial] = useState(receipt.nanoSerial || '');
  const [notes, setNotes] = useState(receipt.notes || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const nameVal = validateThreePartName(subscriberName);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameVal.isValid) {
      setErrorMsg(nameVal.message || 'الاسم يجب أن يكون ثلاثياً');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onSave(receipt.id, {
        subscriberName: subscriberName.trim(),
        cashStatus,
        actualCashReceived: Number(actualCashReceived) || 0,
        nanoReceived: receipt.requiresNano ? nanoReceived : false,
        nanoSerial: receipt.requiresNano && nanoSerial ? nanoSerial.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حفظ التعديلات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-scaleIn">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              تعديل بيانات السند ({receipt.receiptNumber})
            </h3>
            <p className="text-[11px] text-slate-500">
              القائم بالتعديل: {currentUser?.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="m-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 dark:text-white">
              اسم المشترك الثلاثي
            </label>
            <input
              type="text"
              required
              value={subscriberName}
              onChange={(e) => setSubscriberName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs"
            />
          </div>

          {/* Cash Status */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-bold text-slate-900 dark:text-white flex justify-between">
              <span>حالة المبلغ النقدي</span>
              <span className="font-normal text-slate-500">المطلوب: {formatIQD(receipt.expectedCash)}</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCashStatus('paid');
                  setActualCashReceived(receipt.expectedCash);
                }}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  cashStatus === 'paid'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                واصل
              </button>
              <button
                type="button"
                onClick={() => {
                  setCashStatus('unpaid');
                  setActualCashReceived(0);
                }}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  cashStatus === 'unpaid'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                غير واصل
              </button>
              <button
                type="button"
                onClick={() => setCashStatus('partial')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  cashStatus === 'partial'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                واصل جزئياً
              </button>
            </div>

            {cashStatus === 'partial' && (
              <div className="pt-1">
                <input
                  type="number"
                  step="5000"
                  value={actualCashReceived}
                  onChange={(e) => setActualCashReceived(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-bold"
                  placeholder="المبلغ المقبوض فعلياً"
                />
              </div>
            )}
          </div>

          {/* Nano Device (PowerBeam M5 400) */}
          {receipt.requiresNano && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>جهاز النانو ({NANO_DEVICE_MODEL})</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNanoReceived(true)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    nanoReceived
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  واصل (مستلم)
                </button>
                <button
                  type="button"
                  onClick={() => setNanoReceived(false)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    !nanoReceived
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  غير واصل (مؤجل)
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="السيريال / MAC"
                  dir="ltr"
                  value={nanoSerial}
                  onChange={(e) => setNanoSerial(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              الملاحظات
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
