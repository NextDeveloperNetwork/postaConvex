'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { ShieldAlert, ArrowRight, ShieldCheck, LogIn } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentUser, setCurrentUser, users, isLoading } = useAppState();
  const { t } = useI18n();
  const router = useRouter();

  // Admin is a superuser who has access to all pages
  const isAllowed = currentUser
    ? (currentUser.role === 'ADMIN' || allowedRoles.includes(currentUser.role))
    : false;

  useEffect(() => {
    // If not loading and not logged in, auto-select admin if available
    if (!isLoading && !currentUser && users.length > 0) {
      const admin = users.find(u => u.role === 'ADMIN') || users[0];
      if (admin) {
        setCurrentUser(admin);
      }
    }
  }, [isLoading, currentUser, users, setCurrentUser]);

  // Still loading initial DB sync
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#f6d55c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Duke u lidhur me bazën e të dhënave...</p>
        </div>
      </div>
    );
  }

  // Not logged in fallback
  if (!currentUser) {
    const adminUser = users.find(u => u.role === 'ADMIN') || users[0];
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm text-center shadow-xl space-y-4">
          <div className="w-14 h-14 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center mx-auto text-amber-700">
            <LogIn className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Nevojitet Identifikimi</h2>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Ju lutem identifikohuni për të aksesuar të dhënat e sistemit.
            </p>
          </div>
          {adminUser && (
            <button
              onClick={() => setCurrentUser(adminUser)}
              className="w-full py-3 px-4 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md border border-amber-300 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Hyr si Administrator ({adminUser.name})</span>
            </button>
          )}
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
          >
            Faqja e Hyrjes
          </button>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    const rolePaths: Record<UserRole, string> = {
      ADMIN: '/admin',
      COURIER: '/courier',
      COURIER_TRANSPORT: '/courier',
      COURIER_DELIVERY: '/delivery-courier',
      SELLER: '/seller',
      OFFICE_STAFF: '/office',
      FINANCE_ADMIN: '/finance',
      PENDING: '/pending',
    };
    const myPath = rolePaths[currentUser.role] || '/pending';
    const adminUser = users.find(u => u.role === 'ADMIN');

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white border border-amber-300 rounded-3xl p-6 max-w-sm text-center shadow-xl space-y-4">
          <div className="w-14 h-14 bg-red-100 border border-red-300 rounded-2xl flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Akses i Kufizuar (Access Denied)</h2>
            <p className="text-xs font-semibold text-slate-700 mt-2">
              Nuk keni leje të hyni në këtë faqe me rolin aktual:{' '}
              <span className="font-extrabold text-slate-950 bg-[#f6d55c] px-1.5 py-0.5 rounded border border-amber-300">
                {t.roles[currentUser.role]}
              </span>.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {adminUser && (
              <button
                onClick={() => setCurrentUser(adminUser)}
                className="w-full py-3 px-4 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md border border-amber-300 transition"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Ndërro në Administrator ({adminUser.name})</span>
              </button>
            )}

            <button
              onClick={() => router.push(myPath)}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Kthehu te Paneli Juaj</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
