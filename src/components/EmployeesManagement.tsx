import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  Phone,
  Key,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types';

interface EmployeesManagementProps {
  currentUser: User | null;
  employees: User[];
  onCreateEmployee: (payload: {
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'employee';
    phone?: string;
  }) => Promise<void>;
  onUpdateEmployee: (
    id: string,
    payload: {
      fullName?: string;
      password?: string;
      role?: 'admin' | 'employee';
      phone?: string;
      isActive?: boolean;
    }
  ) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
}

export const EmployeesManagement: React.FC<EmployeesManagementProps> = ({
  currentUser,
  employees,
  onCreateEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New employee form
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setErrorMsg('الاسم، اسم المستخدم وكلمة المرور حقول مطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateEmployee({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        phone: phone.trim() || undefined,
        role,
      });

      // Reset
      setFullName('');
      setUsername('');
      setPassword('');
      setPhone('');
      setRole('employee');
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إضافة الموظف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (!isAdmin) return;
    try {
      await onUpdateEmployee(user.id, {
        isActive: !user.isActive,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (user: User) => {
    if (!isAdmin) return;
    if (user.id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الحالي');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف حساب الموظف ${user.fullName} نهائياً؟`)) {
      try {
        await onDeleteEmployee(user.id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-28 space-y-4">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              إدارة الموظفين ونظام الصلاحيات
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إضافة وتعيين صلاحيات الجباة ومدراء النظام مع التحكم بالحسابات
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => {
              setErrorMsg(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        ) : (
          <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            🔒 الإضافة والتعديل مخصصة للمدير فقط
          </div>
        )}
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {employees.map((emp) => {
          const isCurrent = emp.id === currentUser?.id;
          const isEmpAdmin = emp.role === 'admin';

          return (
            <div
              key={emp.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border transition-all space-y-3 relative overflow-hidden ${
                isCurrent
                  ? 'border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/10'
                  : 'border-slate-200/90 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs ${
                      isEmpAdmin ? 'bg-purple-600' : 'bg-emerald-600'
                    }`}
                  >
                    {isEmpAdmin ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {emp.fullName}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          أنت
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      @{emp.username}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${
                    isEmpAdmin
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200'
                  }`}
                >
                  {isEmpAdmin ? 'مدير المنظومة' : 'موظف جابي'}
                </span>
              </div>

              {/* Contact & Status */}
              <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.phone || 'بدون رقم'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      emp.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  ></span>
                  <span className="text-[11px] font-semibold">
                    {emp.isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {isAdmin && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(emp)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-colors ${
                      emp.isActive
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300'
                        : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {emp.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                  </button>

                  {!isCurrent && (
                    <button
                      onClick={() => handleDelete(emp)}
                      title="حذف الموظف نهائياً"
                      className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <span>إضافة حساب موظف / جابي جديد</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الكامل للموظف
                </label>
                <input
                  type="text"
                  placeholder="مثال: علي كريم الخفاجي"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    اسم المستخدم للدخول
                  </label>
                  <input
                    type="text"
                    placeholder="ali_collector"
                    dir="ltr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف (اختياري)
                </label>
                <input
                  type="tel"
                  placeholder="0770xxxxxxx"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  مستوى الصلاحية
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('employee')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      role === 'employee'
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    موظف جابي (تسجيل فقط)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      role === 'admin'
                        ? 'bg-purple-50 dark:bg-purple-950 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    مدير نظام (كامل الصلاحيات)
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'تأكيد إنشاء الحساب'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
