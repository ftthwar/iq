import React from 'react';
import {
  FileText,
  PlusCircle,
  BarChart3,
  History,
  Users,
} from 'lucide-react';
import { User } from '../types';

export type TabType = 'receipts' | 'new' | 'stats' | 'logs' | 'users';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: User | null;
  receiptsCount: number;
  pendingNanoCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  receiptsCount,
  pendingNanoCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-colors shadow-lg">
      <div className="max-w-md sm:max-w-xl mx-auto px-3 py-1.5 flex items-center justify-around">
        {/* 1. المقبوضات */}
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
            activeTab === 'receipts'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5 mb-0.5" />
            {receiptsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-full px-1.5">
                {receiptsCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">المقبوضات</span>
        </button>

        {/* 2. الإحصائيات */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'stats'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">الإحصائيات</span>
        </button>

        {/* 3. Center New Receipt Button */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={() => setActiveTab('new')}
            className={`w-13 h-13 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 ${
              activeTab === 'new'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 dark:ring-emerald-900 shadow-emerald-600/40'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'
            }`}
          >
            <PlusCircle className="w-7 h-7" />
          </button>
        </div>

        {/* 4. العمليات */}
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
            activeTab === 'logs'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <History className="w-5 h-5 mb-0.5" />
            {pendingNanoCount > 0 && (
              <span
                className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
              >
                {pendingNanoCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">العمليات</span>
        </button>

        {/* 5. الموظفين */}
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'users'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5 mb-0.5" />
            {currentUser?.role === 'admin' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500"></span>
            )}
          </div>
          <span className="text-[11px]">الموظفين</span>
        </button>
      </div>
    </nav>
  );
};
