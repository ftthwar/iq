import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { AuditLog, Receipt, StatsSummary, User } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  users: User[];
  receipts: Receipt[];
  auditLogs: AuditLog[];
  nextReceiptSeq: number;
}

// Initial Seed Data with users, realistic ISP receipts matching all rules, and initial audit logs
function getInitialData(): DatabaseSchema {
  const now = new Date();
  const isoNow = now.toISOString();

  const users: User[] = [
    {
      id: 'usr-admin-1',
      username: 'admin',
      password: '123',
      fullName: 'مدير المنظومة (مسؤول النظام)',
      role: 'admin',
      phone: '07701234567',
      isActive: true,
      createdAt: isoNow,
    },
    {
      id: 'usr-emp-1',
      username: 'ahmed',
      password: '123',
      fullName: 'أحمد جاسم محمد (جابي)',
      role: 'employee',
      phone: '07809876543',
      isActive: true,
      createdAt: isoNow,
    },
    {
      id: 'usr-emp-2',
      username: 'mustafa',
      password: '123',
      fullName: 'مصطفى كريم حميد (جابي)',
      role: 'employee',
      phone: '07712349876',
      isActive: true,
      createdAt: isoNow,
    },
  ];

  const receipts: Receipt[] = [
    {
      id: 'rec-1',
      receiptNumber: 'REC-2026-0001',
      subscriberName: 'علي حسن كاظم',
      subscriberPhone: '07701112233',
      subscriberAddress: 'حي الجامعة - قرب البرج 4',
      planType: 'monthly',
      planPrice: 35,
      selectedOptionId: 'opt_35_40k',
      selectedOptionText: 'مبلغ نقدي 40 ألف د.ع',
      expectedCash: 40000,
      actualCashReceived: 40000,
      cashStatus: 'paid',
      requiresNano: false,
      nanoReceived: false,
      employeeId: 'usr-emp-1',
      employeeName: 'أحمد جاسم محمد (جابي)',
      notes: 'تم الدفع كاش كاملاً',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'rec-2',
      receiptNumber: 'REC-2026-0002',
      subscriberName: 'كرار حيدر جبار',
      subscriberPhone: '07802223344',
      subscriberAddress: 'الشارع العام - محلة 102',
      planType: 'monthly',
      planPrice: 35,
      selectedOptionId: 'opt_35_nano',
      selectedOptionText: 'استلام جهاز نانو فقط',
      expectedCash: 0,
      actualCashReceived: 0,
      cashStatus: 'paid',
      requiresNano: true,
      nanoReceived: true,
      nanoModel: 'LiteBeam 5AC Gen2',
      nanoSerial: 'LB-99281-IQ',
      employeeId: 'usr-emp-2',
      employeeName: 'مصطفى كريم حميد (جابي)',
      notes: 'تم فحص النانو في الورشة والجهاز يعمل بنجاح',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'rec-3',
      receiptNumber: 'REC-2026-0003',
      subscriberName: 'محمد باقر عبد الرضا',
      subscriberPhone: '07713334455',
      subscriberAddress: 'حي السلام - زقاق 12',
      planType: 'monthly',
      planPrice: 45,
      selectedOptionId: 'opt_45_10k_nano',
      selectedOptionText: '10,000 د.ع + جهاز نانو',
      expectedCash: 10000,
      actualCashReceived: 10000,
      cashStatus: 'paid',
      requiresNano: true,
      nanoReceived: true,
      nanoModel: 'NanoStation M5',
      nanoSerial: 'NS-77341-IQ',
      employeeId: 'usr-emp-1',
      employeeName: 'أحمد جاسم محمد (جابي)',
      notes: 'تم استلام الـ 10 آلاف وجهاز النانو في الموقع',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'rec-4',
      receiptNumber: 'REC-2026-0004',
      subscriberName: 'سجاد عقيل عبد الزهرة',
      subscriberPhone: '07504445566',
      subscriberAddress: 'حي المعلمين - قرب مدرسة الفرات',
      planType: 'monthly',
      planPrice: 45,
      selectedOptionId: 'opt_45_60k',
      selectedOptionText: 'مبلغ نقدي 60,000 د.ع',
      expectedCash: 60000,
      actualCashReceived: 0,
      cashStatus: 'unpaid',
      requiresNano: false,
      nanoReceived: false,
      employeeId: 'usr-emp-2',
      employeeName: 'مصطفى كريم حميد (جابي)',
      notes: 'المشترك طلب تأجيل السداد لنهاية الأسبوع (غير واصل)',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'rec-5',
      receiptNumber: 'REC-2026-0005',
      subscriberName: 'حسين فلاح مهدي',
      subscriberPhone: '07725556677',
      subscriberAddress: 'منطقة اليرموك - فرع الصيدلية',
      planType: 'monthly',
      planPrice: 65,
      selectedOptionId: 'opt_65_nano_20k',
      selectedOptionText: '20,000 د.ع + جهاز نانو',
      expectedCash: 20000,
      actualCashReceived: 20000,
      cashStatus: 'paid',
      requiresNano: true,
      nanoReceived: false, // جهاز النانو غير واصل بعد
      nanoModel: 'PowerBeam 5AC 400',
      employeeId: 'usr-emp-1',
      employeeName: 'أحمد جاسم محمد (جابي)',
      notes: 'سدد الـ 20 ألف، ووعد بتسليم النانو للمكتب غداً (النانو غير واصل)',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'rec-6',
      receiptNumber: 'REC-2026-0006',
      subscriberName: 'ياسر عمار طه',
      subscriberPhone: '07816667788',
      subscriberAddress: 'حي البنوك - مقابل جامع القدس',
      planType: 'monthly',
      planPrice: 100,
      selectedOptionId: 'opt_100_nano_50k',
      selectedOptionText: '50,000 د.ع + جهاز نانو',
      expectedCash: 50000,
      actualCashReceived: 50000,
      cashStatus: 'paid',
      requiresNano: true,
      nanoReceived: true,
      nanoModel: 'LiteBeam AC 23dBi',
      nanoSerial: 'UB-55410-AC',
      employeeId: 'usr-admin-1',
      employeeName: 'مدير المنظومة (مسؤول النظام)',
      notes: 'تم استلام المبلغ والنانو بحالة ممتازة',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'rec-7',
      receiptNumber: 'REC-2026-0007',
      subscriberName: 'ضرغام قاسم سلمان',
      subscriberPhone: '07707778899',
      subscriberAddress: 'حي الخضراء - عمارة النور',
      planType: 'three_months',
      planPrice: 35,
      selectedOptionId: 'opt_3m_35_105k',
      selectedOptionText: 'مبلغ نقدي 105,000 د.ع',
      expectedCash: 105000,
      actualCashReceived: 105000,
      cashStatus: 'paid',
      requiresNano: false,
      nanoReceived: false,
      employeeId: 'usr-emp-2',
      employeeName: 'مصطفى كريم حميد (جابي)',
      notes: 'عرض 3 أشهر - باقة 35 ألف بسعر مخفض 105 ألف كاملة',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'rec-8',
      receiptNumber: 'REC-2026-0008',
      subscriberName: 'مرتضى سعدون خضير',
      subscriberPhone: '07808889900',
      subscriberAddress: 'حي الصحة - قرب المستوصف',
      planType: 'three_months',
      planPrice: 45,
      selectedOptionId: 'opt_3m_45_125k',
      selectedOptionText: 'مبلغ نقدي 125,000 د.ع',
      expectedCash: 125000,
      actualCashReceived: 125000,
      cashStatus: 'paid',
      requiresNano: false,
      nanoReceived: false,
      employeeId: 'usr-emp-1',
      employeeName: 'أحمد جاسم محمد (جابي)',
      notes: 'عرض 3 أشهر - باقة 45 ألف بمبلغ 125 ألف د.ع نقداً',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000 * 50).toISOString(),
      userId: 'usr-admin-1',
      userName: 'مدير المنظومة (مسؤول النظام)',
      userRole: 'admin',
      actionType: 'create_user',
      title: 'تهيئة النظام وإنشاء حسابات الموظفين',
      details: 'تم تأسيس حسابات الجباة وإعداد قواعد المقبوضات وأجهزة النانو.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      userId: 'usr-emp-1',
      userName: 'أحمد جاسم محمد (جابي)',
      userRole: 'employee',
      actionType: 'create_receipt',
      title: 'تسجيل مقبوض جديد',
      details: 'تم تسجيل اشتراك المشترك علي حسن كاظم (باقة 35 ألف) بمبلغ 40 ألف د.ع نقدياً.',
      targetId: 'rec-1',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      userId: 'usr-emp-2',
      userName: 'مصطفى كريم حميد (جابي)',
      userRole: 'employee',
      actionType: 'create_receipt',
      title: 'تسجيل مقبوض نانو',
      details: 'تم استلام جهاز نانو LiteBeam 5AC للمشترك كرار حيدر جبار (باقة 35 ألف).',
      targetId: 'rec-2',
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      userId: 'usr-emp-1',
      userName: 'أحمد جاسم محمد (جابي)',
      userRole: 'employee',
      actionType: 'create_receipt',
      title: 'تسجيل مقبوض جزئي (نانو غير واصل)',
      details: 'تم تسجيل اشتراك المشترك حسين فلاح مهدي (باقة 65 ألف): تم دفع 20 ألف د.ع وجهاز النانو مؤجل (غير واصل).',
      targetId: 'rec-5',
    },
  ];

  return {
    users,
    receipts,
    auditLogs,
    nextReceiptSeq: 9,
  };
}

// Read database from disk
function loadDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error loading database, resetting to initial seed:', err);
    const initial = getInitialData();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    } catch (writeErr) {
      console.error('Failed to write db file:', writeErr);
    }
    return initial;
  }
}

// Save database to disk
function saveDb(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Add an audit log helper
function recordAuditLog(
  db: DatabaseSchema,
  userId: string,
  userName: string,
  userRole: 'admin' | 'employee',
  actionType: AuditLog['actionType'],
  title: string,
  details: string,
  targetId?: string
) {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    userId: userId || 'usr-system',
    userName: userName || 'النظام',
    userRole: userRole || 'employee',
    actionType,
    title,
    details,
    targetId,
  };
  db.auditLogs.unshift(log);
  // Keep last 500 logs to prevent file from growing indefinitely
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

// Compute statistics
function computeStats(receipts: Receipt[]): StatsSummary {
  let totalReceiptsCount = receipts.length;
  let totalExpectedCash = 0;
  let totalCollectedCash = 0;
  let totalUnpaidCash = 0;
  let totalNanoRequiredCount = 0;
  let totalNanoReceivedCount = 0;
  let totalNanoPendingCount = 0;
  let monthlyCount = 0;
  let threeMonthsCount = 0;

  const planMap: Record<
    string,
    {
      planKey: string;
      name: string;
      count: number;
      collectedCash: number;
      unpaidCash: number;
      nanoReceived: number;
      nanoPending: number;
    }
  > = {};

  const employeeMap: Record<
    string,
    {
      employeeId: string;
      employeeName: string;
      receiptsCount: number;
      collectedCash: number;
      nanoReceived: number;
    }
  > = {};

  for (const r of receipts) {
    totalExpectedCash += r.expectedCash || 0;
    totalCollectedCash += r.actualCashReceived || 0;

    const remaining = Math.max(0, (r.expectedCash || 0) - (r.actualCashReceived || 0));
    totalUnpaidCash += remaining;

    if (r.planType === 'monthly') {
      monthlyCount++;
    } else {
      threeMonthsCount++;
    }

    if (r.requiresNano) {
      totalNanoRequiredCount++;
      if (r.nanoReceived) {
        totalNanoReceivedCount++;
      } else {
        totalNanoPendingCount++;
      }
    }

    // Plan breakdown
    const planKey = `${r.planType}_${r.planPrice}`;
    if (!planMap[planKey]) {
      const planName =
        r.planType === 'three_months'
          ? `عرض 3 أشهر (${r.planPrice} ألف)`
          : `شهري (${r.planPrice} ألف)`;
      planMap[planKey] = {
        planKey,
        name: planName,
        count: 0,
        collectedCash: 0,
        unpaidCash: 0,
        nanoReceived: 0,
        nanoPending: 0,
      };
    }
    planMap[planKey].count++;
    planMap[planKey].collectedCash += r.actualCashReceived || 0;
    planMap[planKey].unpaidCash += remaining;
    if (r.requiresNano) {
      if (r.nanoReceived) {
        planMap[planKey].nanoReceived++;
      } else {
        planMap[planKey].nanoPending++;
      }
    }

    // Employee performance
    const empId = r.employeeId || 'unknown';
    if (!employeeMap[empId]) {
      employeeMap[empId] = {
        employeeId: empId,
        employeeName: r.employeeName || 'غير محدد',
        receiptsCount: 0,
        collectedCash: 0,
        nanoReceived: 0,
      };
    }
    employeeMap[empId].receiptsCount++;
    employeeMap[empId].collectedCash += r.actualCashReceived || 0;
    if (r.requiresNano && r.nanoReceived) {
      employeeMap[empId].nanoReceived++;
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
    employeePerformance: Object.values(employeeMap),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  // 1. Health
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Authentication Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const db = loadDb();

    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    const user = db.users.find(
      (u) => u.username.toLowerCase() === String(username).toLowerCase() && u.password === String(password)
    );

    if (!user) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'هذا الحساب معطل من قبل المدير. يرجى مراجعة الإدارة.' });
    }

    recordAuditLog(
      db,
      user.id,
      user.fullName,
      user.role,
      'login',
      'تسجيل دخول ناجح',
      `قام المستخدم ${user.fullName} (${user.role === 'admin' ? 'مدير' : 'موظف'}) بتسجيل الدخول للنظام.`
    );
    saveDb(db);

    const { password: _, ...userWithoutPass } = user;
    return res.json({
      user: userWithoutPass,
      token: `token-${user.id}-${Date.now()}`,
    });
  });

  // 3. User Management (Employees)
  app.get('/api/users', (req: Request, res: Response) => {
    const db = loadDb();
    const safeUsers = db.users.map(({ password: _, ...u }) => u);
    res.json(safeUsers);
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const db = loadDb();
    const { username, password, fullName, role, phone, currentUserId, currentUserName, currentUserRole } =
      req.body;

    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'فقط مدير النظام يملك صلاحية إضافة حسابات الموظفين' });
    }

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'اسم الموظف، اسم المستخدم، وكلمة المرور حقول مطلوبة' });
    }

    const exists = db.users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر' });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: username.trim().toLowerCase(),
      password: String(password).trim(),
      fullName: fullName.trim(),
      role: role === 'admin' ? 'admin' : 'employee',
      phone: phone ? phone.trim() : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    recordAuditLog(
      db,
      currentUserId,
      currentUserName,
      currentUserRole,
      'create_user',
      'إضافة حساب موظف جديد',
      `تم إنشاء حساب للموظف: ${newUser.fullName} (${newUser.username}) بصلاحية ${newUser.role === 'admin' ? 'مدير' : 'موظف/جابي'}.`,
      newUser.id
    );
    saveDb(db);

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { fullName, password, role, phone, isActive, currentUserId, currentUserName, currentUserRole } =
      req.body;
    const db = loadDb();

    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'فقط مدير النظام يملك صلاحية تعديل حسابات الموظفين' });
    }

    const userIndex = db.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'الموظف غير موجود' });
    }

    const user = db.users[userIndex];
    if (fullName) user.fullName = fullName.trim();
    if (password && String(password).trim()) user.password = String(password).trim();
    if (role && (role === 'admin' || role === 'employee')) user.role = role;
    if (phone !== undefined) user.phone = phone.trim();
    if (typeof isActive === 'boolean') user.isActive = isActive;

    db.users[userIndex] = user;
    recordAuditLog(
      db,
      currentUserId,
      currentUserName,
      currentUserRole,
      'update_user',
      'تعديل بيانات حساب موظف',
      `تم تحديث بيانات الموظف ${user.fullName}، الحالة: ${user.isActive ? 'نشط' : 'معطل'}.`,
      user.id
    );
    saveDb(db);

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { currentUserId, currentUserName, currentUserRole } = req.body;
    const db = loadDb();

    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'فقط مدير النظام يملك صلاحية حذف الحسابات' });
    }

    if (id === currentUserId) {
      return res.status(400).json({ error: 'لا يمكنك حذف حسابك الحالي الذي تستخدمه لتسجيل الدخول' });
    }

    const userToDelete = db.users.find((u) => u.id === id);
    if (!userToDelete) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    db.users = db.users.filter((u) => u.id !== id);
    recordAuditLog(
      db,
      currentUserId,
      currentUserName,
      currentUserRole,
      'delete_user',
      'حذف حساب موظف',
      `تم حذف حساب الموظف ${userToDelete.fullName} (${userToDelete.username}) نهائياً من قبل المدير.`
    );
    saveDb(db);

    res.json({ success: true, message: 'تم حذف حساب الموظف بنجاح' });
  });

  // 4. Receipts API
  app.get('/api/receipts', (req: Request, res: Response) => {
    const db = loadDb();
    const { q, planType, cashStatus, nanoStatus, employeeId } = req.query;

    let list = [...db.receipts];

    if (q) {
      const search = String(q).trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.subscriberName.toLowerCase().includes(search) ||
          (r.subscriberPhone && r.subscriberPhone.includes(search)) ||
          r.receiptNumber.toLowerCase().includes(search) ||
          (r.subscriberAddress && r.subscriberAddress.toLowerCase().includes(search))
      );
    }

    if (planType && planType !== 'all') {
      list = list.filter((r) => r.planType === planType);
    }

    if (cashStatus && cashStatus !== 'all') {
      list = list.filter((r) => r.cashStatus === cashStatus);
    }

    if (nanoStatus && nanoStatus !== 'all') {
      if (nanoStatus === 'received') {
        list = list.filter((r) => r.requiresNano && r.nanoReceived);
      } else if (nanoStatus === 'pending') {
        list = list.filter((r) => r.requiresNano && !r.nanoReceived);
      } else if (nanoStatus === 'not_required') {
        list = list.filter((r) => !r.requiresNano);
      }
    }

    if (employeeId && employeeId !== 'all') {
      list = list.filter((r) => r.employeeId === employeeId);
    }

    // Sort by latest created first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  app.post('/api/receipts', (req: Request, res: Response) => {
    const db = loadDb();
    const data = req.body;

    if (!data.subscriberName || !data.planPrice || !data.selectedOptionId) {
      return res.status(400).json({ error: 'الاسم الثلاثي، باقة الاشتراك، وخيار المقبوضات مطلوبة' });
    }

    // Generate unique sequence receipt number
    const seq = db.nextReceiptSeq || db.receipts.length + 1;
    db.nextReceiptSeq = seq + 1;
    const year = new Date().getFullYear();
    const receiptNumber = `REC-${year}-${String(seq).padStart(4, '0')}`;

    const newReceipt: Receipt = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      receiptNumber,
      subscriberName: data.subscriberName.trim(),
      subscriberPhone: data.subscriberPhone ? data.subscriberPhone.trim() : undefined,
      subscriberAddress: data.subscriberAddress ? data.subscriberAddress.trim() : undefined,
      planType: data.planType || 'monthly',
      planPrice: Number(data.planPrice) as any,
      selectedOptionId: data.selectedOptionId,
      selectedOptionText: data.selectedOptionText,
      expectedCash: Number(data.expectedCash) || 0,
      actualCashReceived: Number(data.actualCashReceived) || 0,
      cashStatus: data.cashStatus || 'paid',
      requiresNano: Boolean(data.requiresNano),
      nanoReceived: Boolean(data.nanoReceived),
      nanoSerial: data.nanoSerial ? data.nanoSerial.trim() : undefined,
      nanoModel: data.nanoModel ? data.nanoModel.trim() : undefined,
      employeeId: data.employeeId || 'usr-system',
      employeeName: data.employeeName || 'موظف',
      notes: data.notes ? data.notes.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.receipts.unshift(newReceipt);

    // Audit log
    const cashText =
      newReceipt.actualCashReceived > 0
        ? `مبلغ نقدي ${newReceipt.actualCashReceived.toLocaleString()} د.ع`
        : 'بدون نقد';
    const nanoText = newReceipt.requiresNano
      ? newReceipt.nanoReceived
        ? 'تم استلام جهاز نانو (واصل)'
        : 'جهاز نانو مؤجل (غير واصل)'
      : 'لا يتطلب نانو';

    recordAuditLog(
      db,
      newReceipt.employeeId,
      newReceipt.employeeName,
      data.employeeRole || 'employee',
      'create_receipt',
      `تسجيل مقبوض جديد (${newReceipt.receiptNumber})`,
      `قام الموظف ${newReceipt.employeeName} بتسجيل مقبوض للمشترك: ${newReceipt.subscriberName}، باقة ${newReceipt.planPrice} ألف، المقبوضات: [${cashText} | ${nanoText}].`,
      newReceipt.id
    );

    saveDb(db);
    res.status(201).json(newReceipt);
  });

  app.put('/api/receipts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const db = loadDb();

    const index = db.receipts.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'سند المقبوض غير موجود' });
    }

    const oldReceipt = db.receipts[index];
    const changes: string[] = [];

    // Track what changed for audit log
    if (updateData.cashStatus && updateData.cashStatus !== oldReceipt.cashStatus) {
      changes.push(`تغيير حالة النقد من (${oldReceipt.cashStatus}) إلى (${updateData.cashStatus})`);
    }
    if (
      updateData.actualCashReceived !== undefined &&
      updateData.actualCashReceived !== oldReceipt.actualCashReceived
    ) {
      changes.push(
        `تعديل المبلغ المقبوض من ${oldReceipt.actualCashReceived} إلى ${updateData.actualCashReceived} د.ع`
      );
    }
    if (
      updateData.nanoReceived !== undefined &&
      updateData.nanoReceived !== oldReceipt.nanoReceived
    ) {
      changes.push(
        updateData.nanoReceived
          ? 'تم تأكيد استلام جهاز النانو (أصبح واصل)'
          : 'تغيير حالة النانو إلى غير واصل'
      );
    }
    if (updateData.notes !== undefined && updateData.notes !== oldReceipt.notes) {
      changes.push('تحديث الملاحظات');
    }

    const updatedReceipt: Receipt = {
      ...oldReceipt,
      ...updateData,
      id: oldReceipt.id,
      receiptNumber: oldReceipt.receiptNumber,
      createdAt: oldReceipt.createdAt,
      updatedAt: new Date().toISOString(),
    };

    db.receipts[index] = updatedReceipt;

    const actionType =
      updateData.nanoReceived !== undefined && updateData.nanoReceived !== oldReceipt.nanoReceived
        ? 'toggle_nano_status'
        : updateData.cashStatus && updateData.cashStatus !== oldReceipt.cashStatus
        ? 'toggle_cash_status'
        : 'update_receipt';

    recordAuditLog(
      db,
      updateData.currentUserId || updatedReceipt.employeeId,
      updateData.currentUserName || updatedReceipt.employeeName,
      updateData.currentUserRole || 'employee',
      actionType,
      `تحديث سند المقبوض (${updatedReceipt.receiptNumber})`,
      `للمشترك ${updatedReceipt.subscriberName}: ${changes.join('، ') || 'تم تحديث التفاصيل'}.`,
      updatedReceipt.id
    );

    saveDb(db);
    res.json(updatedReceipt);
  });

  app.delete('/api/receipts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { currentUserId, currentUserName, currentUserRole } = req.body;
    const db = loadDb();

    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'صلاحية حذف المقبوضات مخصصة لمدير النظام فقط' });
    }

    const receipt = db.receipts.find((r) => r.id === id);
    if (!receipt) {
      return res.status(404).json({ error: 'سند المقبوض غير موجود' });
    }

    db.receipts = db.receipts.filter((r) => r.id !== id);

    recordAuditLog(
      db,
      currentUserId,
      currentUserName,
      currentUserRole,
      'delete_receipt',
      `حذف سند مقبوض (${receipt.receiptNumber})`,
      `قام المدير بحذف سند المقبوض للمشترك ${receipt.subscriberName} نهائياً.`
    );

    saveDb(db);
    res.json({ success: true, message: 'تم حذف سند المقبوض بنجاح' });
  });

  // 5. Audit Logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const db = loadDb();
    const { limit = 100, actionType, userId } = req.query;

    let logs = [...db.auditLogs];

    if (actionType && actionType !== 'all') {
      logs = logs.filter((l) => l.actionType === actionType);
    }
    if (userId && userId !== 'all') {
      logs = logs.filter((l) => l.userId === userId);
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(logs.slice(0, Number(limit)));
  });

  // 6. Statistics
  app.get('/api/stats', (req: Request, res: Response) => {
    const db = loadDb();
    const { range, employeeId } = req.query;

    let receipts = [...db.receipts];

    // Filter by date range if provided
    if (range === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      receipts = receipts.filter((r) => r.createdAt.startsWith(todayStr));
    } else if (range === 'week') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      receipts = receipts.filter((r) => r.createdAt >= sevenDaysAgo);
    } else if (range === 'month') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      receipts = receipts.filter((r) => r.createdAt.startsWith(currentMonth));
    }

    if (employeeId && employeeId !== 'all') {
      receipts = receipts.filter((r) => r.employeeId === employeeId);
    }

    const stats = computeStats(receipts);
    res.json(stats);
  });

  // 7. Backup & Restore
  app.get('/api/backup/export', (req: Request, res: Response) => {
    const db = loadDb();
    res.json(db);
  });

  app.post('/api/backup/restore', (req: Request, res: Response) => {
    const { backupData, currentUserId, currentUserName, currentUserRole } = req.body;
    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: 'استرجاع النسخة الاحتياطية مخصص للمدير فقط' });
    }

    if (!backupData || !Array.isArray(backupData.receipts) || !Array.isArray(backupData.users)) {
      return res.status(400).json({ error: 'صيغة ملف النسخة الاحتياطية غير صالحة' });
    }

    const db: DatabaseSchema = {
      users: backupData.users,
      receipts: backupData.receipts,
      auditLogs: backupData.auditLogs || [],
      nextReceiptSeq: backupData.nextReceiptSeq || backupData.receipts.length + 1,
    };

    recordAuditLog(
      db,
      currentUserId,
      currentUserName,
      currentUserRole,
      'backup_restore',
      'استعادة نسخة احتياطية',
      `تم استعادة النسخة الاحتياطية بنجاح (${db.receipts.length} مقبوضات و ${db.users.length} مستخدمين).`
    );

    saveDb(db);
    res.json({ success: true, count: db.receipts.length });
  });

  // Vite Integration
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
