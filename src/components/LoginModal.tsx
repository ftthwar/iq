import React, { useState } from 'react';
import {
  ShieldCheck,
  User as UserIcon,
  X,
  AlertCircle,
  LogIn,
  Users,
} from 'lucide-react';
import { User } from '../types';

interface LoginModalProps {
  currentUser: User | null;
  employees: User[];
  onLogin: (username: string, pass: string) => Promise<void>;
  onSelectUserDirectly: (user: User) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  employees,
  onLogin,
  onSelectUserDirectly,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await onLogin(username.trim(), password.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <LogIn className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {isAdmin ? 'تبديل الحساب (خاص بالمدير)' : 'تسجيل الدخول'}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold">
                الحالي: {currentUser?.fullName || 'غير مسجل'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick User Switcher: ONLY VISIBLE IF LOGGED IN USER IS ADMIN */}
        {isAdmin && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>تبديل الحساب الفوري (صلاحية المدير فقط):</span>
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {employees.map((emp) => {
                const isSelected = emp.id === currentUser?.id;
                const isEmpAdmin = emp.role === 'admin';

                return (
                  <button
                    key={emp.id}
                    onClick={() => {
                      onSelectUserDirectly(emp);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-right flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                          isEmpAdmin ? 'bg-purple-600' : 'bg-emerald-600'
                        }`}
                      >
                        {isEmpAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {emp.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">@{emp.username}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        isEmpAdmin
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isEmpAdmin ? 'مدير' : 'موظف جابي'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form
          onSubmit={handleSubmit}
          className={`space-y-3 ${isAdmin ? 'pt-3 border-t border-slate-100 dark:border-slate-800' : ''}`}
        >
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              اسم المستخدم
            </label>
            <input
              type="text"
              required
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};
