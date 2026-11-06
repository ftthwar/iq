import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuditLog, Receipt, User } from '../types';

const RECEIPTS_COL = 'receipts';
const USERS_COL = 'users';
const AUDIT_COL = 'auditLogs';

export const firebaseDb = {
  // --- REAL-TIME SUBSCRIPTIONS ---
  subscribeReceipts(callback: (receipts: Receipt[]) => void, onError?: (err: any) => void) {
    const q = query(collection(db, RECEIPTS_COL), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Receipt[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Receipt);
        });
        callback(list);
      },
      (error) => {
        console.error('Firestore receipts error:', error);
        if (onError) onError(error);
      }
    );
  },

  subscribeUsers(callback: (users: User[]) => void, onError?: (err: any) => void) {
    const q = query(collection(db, USERS_COL), orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: User[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as User);
        });
        callback(list);
      },
      (error) => {
        console.error('Firestore users error:', error);
        if (onError) onError(error);
      }
    );
  },

  subscribeAuditLogs(callback: (logs: AuditLog[]) => void, onError?: (err: any) => void) {
    const q = query(collection(db, AUDIT_COL), orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as AuditLog);
        });
        callback(list.slice(0, 300));
      },
      (error) => {
        console.error('Firestore audit error:', error);
        if (onError) onError(error);
      }
    );
  },

  // --- RECEIPTS CRUD ---
  async createReceipt(
    data: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'updatedAt'>,
    receiptCount = 0
  ): Promise<Receipt> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const year = new Date().getFullYear();
    const receiptNumber = `REC-${year}-${String(receiptCount + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const receipt: Receipt = {
      ...data,
      id,
      receiptNumber,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, RECEIPTS_COL, id), receipt);

    // Audit log
    await this.addAuditLog({
      userId: receipt.employeeId,
      userName: receipt.employeeName,
      userRole: 'employee',
      actionType: 'create_receipt',
      title: 'تسجيل مقبوض جديد',
      details: `سند رقم ${receiptNumber} للمشترك ${receipt.subscriberName} (${receipt.selectedOptionText})`,
      targetId: id,
    });

    return receipt;
  },

  async updateReceipt(
    id: string,
    updateData: Partial<Receipt>,
    editorUser: { id: string; fullName: string; role: 'admin' | 'employee' }
  ): Promise<void> {
    const ref = doc(db, RECEIPTS_COL, id);
    const updated = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(ref, updated);

    // Audit log
    await this.addAuditLog({
      userId: editorUser.id,
      userName: editorUser.fullName,
      userRole: editorUser.role,
      actionType: 'update_receipt',
      title: 'تعديل سند مقبوض',
      details: `قام ${editorUser.fullName} بتعديل بيانات السند`,
      targetId: id,
    });
  },

  async deleteReceipt(
    id: string,
    receiptNumber: string,
    subscriberName: string,
    adminUser: { id: string; fullName: string; role: 'admin' | 'employee' }
  ): Promise<void> {
    if (adminUser.role !== 'admin') {
      throw new Error('الحذف مخصص للمدير فقط');
    }
    await deleteDoc(doc(db, RECEIPTS_COL, id));

    await this.addAuditLog({
      userId: adminUser.id,
      userName: adminUser.fullName,
      userRole: 'admin',
      actionType: 'delete_receipt',
      title: 'حذف سند مقبوض',
      details: `حذف السند ${receiptNumber} للمشترك ${subscriberName}`,
      targetId: id,
    });
  },

  // --- USERS CRUD ---
  async createUser(
    userData: {
      username: string;
      password: string;
      fullName: string;
      role: 'admin' | 'employee';
      phone?: string;
    },
    adminUser: { id: string; fullName: string }
  ): Promise<User> {
    const id = `usr_${Date.now()}`;
    const user: User = {
      ...userData,
      id,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, USERS_COL, id), user);

    await this.addAuditLog({
      userId: adminUser.id,
      userName: adminUser.fullName,
      userRole: 'admin',
      actionType: 'create_user',
      title: 'إضافة حساب موظف',
      details: `تم إنشاء حساب ${user.fullName} (${user.role === 'admin' ? 'مدير' : 'موظف'})`,
      targetId: id,
    });

    return user;
  },

  async updateUser(
    id: string,
    updateData: Partial<User>,
    adminUser: { id: string; fullName: string }
  ): Promise<void> {
    await updateDoc(doc(db, USERS_COL, id), updateData);

    await this.addAuditLog({
      userId: adminUser.id,
      userName: adminUser.fullName,
      userRole: 'admin',
      actionType: 'update_user',
      title: 'تعديل بيانات موظف',
      details: `تم تحديث حساب الموظف معرف ${id}`,
      targetId: id,
    });
  },

  async deleteUser(
    id: string,
    userName: string,
    adminUser: { id: string; fullName: string }
  ): Promise<void> {
    await deleteDoc(doc(db, USERS_COL, id));

    await this.addAuditLog({
      userId: adminUser.id,
      userName: adminUser.fullName,
      userRole: 'admin',
      actionType: 'delete_user',
      title: 'حذف حساب موظف',
      details: `تم حذف حساب ${userName}`,
      targetId: id,
    });
  },

  // --- AUDIT LOG ---
  async addAuditLog(
    logData: Omit<AuditLog, 'id' | 'timestamp'>
  ): Promise<void> {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const log: AuditLog = {
      ...logData,
      id,
      timestamp: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, AUDIT_COL, id), log);
    } catch (e) {
      console.warn('Audit log write error:', e);
    }
  },

  // --- BACKUP & RESTORE DIRECT TO FIRESTORE ---
  async exportFullBackup(): Promise<{
    version: string;
    exportedAt: string;
    receipts: Receipt[];
    users: User[];
    auditLogs: AuditLog[];
  }> {
    const [recSnap, usrSnap, logSnap] = await Promise.all([
      getDocs(collection(db, RECEIPTS_COL)),
      getDocs(collection(db, USERS_COL)),
      getDocs(collection(db, AUDIT_COL)),
    ]);

    const receipts: Receipt[] = [];
    recSnap.forEach((d) => receipts.push(d.data() as Receipt));

    const users: User[] = [];
    usrSnap.forEach((d) => users.push(d.data() as User));

    const auditLogs: AuditLog[] = [];
    logSnap.forEach((d) => auditLogs.push(d.data() as AuditLog));

    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      receipts,
      users,
      auditLogs,
    };
  },

  async restoreBackup(
    backupData: { receipts?: Receipt[]; users?: User[]; auditLogs?: AuditLog[] },
    adminUser: { id: string; fullName: string }
  ): Promise<{ restoredCount: number }> {
    const batch = writeBatch(db);
    let count = 0;

    if (Array.isArray(backupData.receipts)) {
      for (const rec of backupData.receipts) {
        if (rec.id) {
          batch.set(doc(db, RECEIPTS_COL, rec.id), rec, { merge: true });
          count++;
        }
      }
    }

    if (Array.isArray(backupData.users)) {
      for (const u of backupData.users) {
        if (u.id) {
          batch.set(doc(db, USERS_COL, u.id), u, { merge: true });
        }
      }
    }

    if (Array.isArray(backupData.auditLogs)) {
      for (const a of backupData.auditLogs) {
        if (a.id) {
          batch.set(doc(db, AUDIT_COL, a.id), a, { merge: true });
        }
      }
    }

    await batch.commit();

    await this.addAuditLog({
      userId: adminUser.id,
      userName: adminUser.fullName,
      userRole: 'admin',
      actionType: 'backup_restore',
      title: 'استعادة نسخة احتياطية',
      details: `تمت استعادة ومزامنة ${count} سند مقبوض في قاعدة بيانات فايربيس بنجاح`,
    });

    return { restoredCount: count };
  },

  // --- SEED INITIAL ADMIN IF DATABASE IS EMPTY ---
  async seedIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, USERS_COL));
      if (snap.empty) {
        const admin: User = {
          id: 'usr_admin_main',
          username: 'admin',
          password: '123',
          fullName: 'مدير المنظومة (مسؤول النظام)',
          role: 'admin',
          phone: '07701234567',
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        const emp1: User = {
          id: 'usr_emp_ahmed',
          username: 'ahmed',
          password: '123',
          fullName: 'أحمد جاسم (جابي)',
          role: 'employee',
          phone: '07809876543',
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, USERS_COL, admin.id), admin);
        await setDoc(doc(db, USERS_COL, emp1.id), emp1);
      }
    } catch (err) {
      console.warn('Seeding check:', err);
    }
  },
};
