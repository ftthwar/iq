import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  Download,
  Users,
} from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenUserSwitch: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  darkMode,
  setDarkMode,
  onOpenUserSwitch,
  onLogout,
  onRefresh,
  isLoading,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('لتثبيت التطبيق على هاتفك، اضغط على خيارات المتصفح (⋮ أو زر المشاركة) ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Real-time sync status bar */}
      <div className="flex justify-between items-center px-4 py-1 text-[11px] font-bold border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-700 dark:text-emerald-400">فايربيس: تزامن لحظي</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-amber-700 dark:text-amber-400">بدون إنترنت (حفظ محلي فوري)</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button
              onClick={handleInstallApp}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>تثبيت التطبيق</span>
            </button>
          )}
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0 font-extrabold text-base">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                NanoPay
              </h1>
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                فايربيس
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              المقبوضات وأجهزة النانو
            </p>
          </div>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="تحديث البيانات"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* User Account & Switcher ONLY for Admin */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 pl-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-right">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white ${
                  isAdmin ? 'bg-purple-600' : 'bg-emerald-600'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserIcon className="w-3.5 h-3.5" />}
              </div>

              <div className="text-right pr-1">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[110px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-bold leading-none">
                  {isAdmin ? 'مدير' : 'موظف جابي'}
                </div>
              </div>

              {/* ONLY ADMIN CAN SWITCH ACCOUNTS */}
              {isAdmin && (
                <button
                  onClick={onOpenUserSwitch}
                  title="تبديل الحساب (خاص بالمدير)"
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Logout button */}
              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-red-500 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenUserSwitch}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
