import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Wifi,
  DollarSign,
  User as UserIcon,
  FileCheck,
} from 'lucide-react';
import { PlanPrice, PlanType, Receipt, User } from '../types';
import {
  getPlanDefinition,
  validateThreePartName,
  formatIQD,
  NANO_DEVICE_MODEL,
} from '../utils/rules';

interface NewReceiptFormProps {
  currentUser: User | null;
  onSubmitReceipt: (payload: Partial<Receipt>) => Promise<Receipt | void>;
  onCancel?: () => void;
}

export const NewReceiptForm: React.FC<NewReceiptFormProps> = ({
  currentUser,
  onSubmitReceipt,
  onCancel,
}) => {
  const [subscriberName, setSubscriberName] = useState('');
  const [planType, setPlanType] = useState<PlanType>('monthly');
  const [planPrice, setPlanPrice] = useState<PlanPrice>(35);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('opt_35_40k');

  const [cashStatus, setCashStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid');
  const [actualCashReceived, setActualCashReceived] = useState<number>(40000);

  const [nanoReceived, setNanoReceived] = useState<boolean>(true);
  const [nanoSerial, setNanoSerial] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPlan = getPlanDefinition(planType, planPrice);
  const currentOption = currentPlan?.options.find((o) => o.id === selectedOptionId);

  useEffect(() => {
    if (currentPlan && currentPlan.options.length > 0) {
      const defaultOpt = currentPlan.options[0];
      setSelectedOptionId(defaultOpt.id);
      if (cashStatus === 'paid') {
        setActualCashReceived(defaultOpt.expectedCash);
      } else if (cashStatus === 'unpaid') {
        setActualCashReceived(0);
      }
    }
  }, [planType, planPrice]);

  const handleSelectOption = (optId: string) => {
    setSelectedOptionId(optId);
    const opt = currentPlan?.options.find((o) => o.id === optId);
    if (opt) {
      if (cashStatus === 'paid') {
        setActualCashReceived(opt.expectedCash);
      } else if (cashStatus === 'unpaid') {
        setActualCashReceived(0);
      }
      if (opt.requiresNano) {
        setNanoReceived(true);
      }
    }
  };

  const handleCashStatusChange = (status: 'paid' | 'unpaid' | 'partial') => {
    setCashStatus(status);
    if (status === 'paid' && currentOption) {
      setActualCashReceived(currentOption.expectedCash);
    } else if (status === 'unpaid') {
      setActualCashReceived(0);
    }
  };

  const nameValidation = validateThreePartName(subscriberName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nameValidation.isValid) {
      setErrorMsg(nameValidation.message || 'يرجى إدخال اسم المشترك الثلاثي كاملاً');
      return;
    }

    if (!currentOption) {
      setErrorMsg('يرجى تحديد خيار المقبوضات');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Receipt> = {
        subscriberName: subscriberName.trim(),
        planType,
        planPrice,
        selectedOptionId: currentOption.id,
        selectedOptionText: currentOption.shortLabel,
        expectedCash: currentOption.expectedCash,
        actualCashReceived: Number(actualCashReceived) || 0,
        cashStatus,
        requiresNano: currentOption.requiresNano,
        nanoReceived: currentOption.requiresNano ? nanoReceived : false,
        nanoModel: NANO_DEVICE_MODEL, // Strictly PowerBeam M5 400
        nanoSerial: currentOption.requiresNano && nanoSerial ? nanoSerial.trim() : undefined,
        employeeId: currentUser?.id || 'usr-system',
        employeeName: currentUser?.fullName || 'الموظف',
        notes: notes.trim() || undefined,
      };

      await onSubmitReceipt(payload);

      // Reset
      setSubscriberName('');
      setNotes('');
      setNanoSerial('');
      setCashStatus('paid');
      if (currentOption) {
        setActualCashReceived(currentOption.expectedCash);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Title */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            تسجيل مقبوض جديد
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            القائم بالعملية: <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentUser?.fullName}</span>
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Subscriber Three-part Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-emerald-600" />
              <span>اسم المشترك الثلاثي</span>
              <span className="text-red-500">*</span>
            </label>
            {subscriberName && (
              <span
                className={`text-[11px] font-bold flex items-center gap-1 ${
                  nameValidation.isValid
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {nameValidation.isValid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    اسم ثلاثي صحيح
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    مطلوب 3 مقاطع
                  </>
                )}
              </span>
            )}
          </div>

          <input
            type="text"
            required
            placeholder="الاسم الأول + اسم الأب + اسم الجد"
            value={subscriberName}
            onChange={(e) => setSubscriberName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Subscription Plan Type & Price */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span>نوع الاشتراك وسعر الباقة</span>
          </label>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setPlanType('monthly');
                setPlanPrice(35);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                planType === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              شهري (شهر واحد)
            </button>
            <button
              type="button"
              onClick={() => {
                setPlanType('three_months');
                setPlanPrice(35);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                planType === 'three_months'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              عرض 3 أشهر
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {planType === 'monthly' ? (
              <>
                {[35, 45, 65, 100].map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setPlanPrice(price as PlanPrice)}
                    className={`flex-1 min-w-[70px] py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                      planPrice === price
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {price} ألف
                  </button>
                ))}
              </>
            ) : (
              <>
                {[35, 45].map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setPlanPrice(price as PlanPrice)}
                    className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold border transition-all ${
                      planPrice === price
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    باقة {price} ألف ({price === 35 ? '105 ألف' : '125 ألف'})
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Required Receipt Options */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>المقبوضات الإلزامية:</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentPlan?.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {opt.label}
                    </span>
                  </div>

                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {formatIQD(opt.expectedCash)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cash Status */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>حالة المبلغ النقدي</span>
            <span className="text-xs font-normal text-slate-500">
              المطلوب: {formatIQD(currentOption?.expectedCash || 0)}
            </span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleCashStatusChange('paid')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                cashStatus === 'paid'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              واصل
            </button>
            <button
              type="button"
              onClick={() => handleCashStatusChange('unpaid')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                cashStatus === 'unpaid'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              غير واصل
            </button>
            <button
              type="button"
              onClick={() => handleCashStatusChange('partial')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                cashStatus === 'partial'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              واصل جزئياً
            </button>
          </div>

          {cashStatus === 'partial' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                المبلغ المقبوض فعلياً (د.ع):
              </label>
              <input
                type="number"
                step="5000"
                value={actualCashReceived}
                onChange={(e) => setActualCashReceived(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              />
            </div>
          )}
        </div>

        {/* Nano Device: Fixed model PowerBeam M5 400 */}
        {currentOption?.requiresNano && (
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-teal-600" />
                <span>جهاز النانو: <b className="font-extrabold text-teal-700 dark:text-teal-300">{NANO_DEVICE_MODEL}</b></span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNanoReceived(true)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  nanoReceived
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-teal-200 dark:border-slate-700 text-teal-800 dark:text-slate-300'
                }`}
              >
                واصل (تم الاستلام)
              </button>
              <button
                type="button"
                onClick={() => setNanoReceived(false)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  !nanoReceived
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-teal-200 dark:border-slate-700 text-teal-800 dark:text-slate-300'
                }`}
              >
                غير واصل (مؤجل)
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-teal-900 dark:text-teal-300 mb-1">
                الرقم التسلسلي / MAC (اختياري)
              </label>
              <input
                type="text"
                placeholder="السيريال أو الماك"
                dir="ltr"
                value={nanoSerial}
                onChange={(e) => setNanoSerial(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            ملاحظات (اختياري)
          </label>
          <input
            type="text"
            placeholder="ملاحظات حول المشترك أو الوصل"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Submit Button ONLY: Single Save button */}
        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            <FileCheck className="w-5 h-5" />
            <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ وتسجيل المقبوض'}</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs font-bold"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
