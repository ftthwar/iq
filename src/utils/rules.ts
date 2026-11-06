import { PlanDefinition, PlanPrice, PlanReceiptOption, PlanType } from '../types';

export const NANO_DEVICE_MODEL = 'PowerBeam M5 400';

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  // --- الاشتراكات الشهرية ---
  {
    planType: 'monthly',
    price: 35,
    name: 'اشتراك شهري 35 ألف',
    durationLabel: 'شهر واحد',
    options: [
      {
        id: 'opt_35_nano',
        label: 'جهاز نانو',
        shortLabel: 'نانو',
        expectedCash: 0,
        requiresNano: true,
      },
      {
        id: 'opt_35_40k',
        label: '40 ألف دينار',
        shortLabel: '40 ألف',
        expectedCash: 40000,
        requiresNano: false,
      },
      {
        id: 'opt_35_50k',
        label: '50 ألف دينار',
        shortLabel: '50 ألف',
        expectedCash: 50000,
        requiresNano: false,
      },
    ],
  },
  {
    planType: 'monthly',
    price: 45,
    name: 'اشتراك شهري 45 ألف',
    durationLabel: 'شهر واحد',
    options: [
      {
        id: 'opt_45_10k_nano',
        label: '10 ألف + نانو',
        shortLabel: '10 ألف + نانو',
        expectedCash: 10000,
        requiresNano: true,
      },
      {
        id: 'opt_45_60k',
        label: '60 ألف دينار',
        shortLabel: '60 ألف',
        expectedCash: 60000,
        requiresNano: false,
      },
    ],
  },
  {
    planType: 'monthly',
    price: 65,
    name: 'اشتراك شهري 65 ألف',
    durationLabel: 'شهر واحد',
    options: [
      {
        id: 'opt_65_nano_20k',
        label: 'نانو + 20 ألف',
        shortLabel: 'نانو + 20 ألف',
        expectedCash: 20000,
        requiresNano: true,
      },
    ],
  },
  {
    planType: 'monthly',
    price: 100,
    name: 'اشتراك شهري 100 ألف',
    durationLabel: 'شهر واحد',
    options: [
      {
        id: 'opt_100_nano_50k',
        label: 'نانو + 50 ألف',
        shortLabel: 'نانو + 50 ألف',
        expectedCash: 50000,
        requiresNano: true,
      },
      {
        id: 'opt_100_100k',
        label: '100 ألف كاملة',
        shortLabel: '100 ألف كاملة',
        expectedCash: 100000,
        requiresNano: false,
      },
    ],
  },

  // --- عروض 3 أشهر ---
  {
    planType: 'three_months',
    price: 35,
    name: 'عرض 3 أشهر (35 ألف)',
    durationLabel: '3 أشهر',
    options: [
      {
        id: 'opt_3m_35_105k',
        label: '105 ألف دينار',
        shortLabel: '105 ألف',
        expectedCash: 105000,
        requiresNano: false,
      },
    ],
  },
  {
    planType: 'three_months',
    price: 45,
    name: 'عرض 3 أشهر (45 ألف)',
    durationLabel: '3 أشهر',
    options: [
      {
        id: 'opt_3m_45_125k',
        label: '125 ألف دينار',
        shortLabel: '125 ألف',
        expectedCash: 125000,
        requiresNano: false,
      },
    ],
  },
];

export function getPlanDefinition(planType: PlanType, price: PlanPrice): PlanDefinition | undefined {
  return PLAN_DEFINITIONS.find((p) => p.planType === planType && p.price === price);
}

export function validateThreePartName(name: string): { isValid: boolean; partsCount: number; message?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, partsCount: 0, message: 'اسم المشترك مطلوب' };
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 3) {
    return {
      isValid: false,
      partsCount: parts.length,
      message: 'الاسم يجب أن يكون ثلاثياً على الأقل',
    };
  }
  return { isValid: true, partsCount: parts.length };
}

export function formatIQD(amount: number): string {
  if (amount === 0) return '0 د.ع';
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

export function formatArabicDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}
