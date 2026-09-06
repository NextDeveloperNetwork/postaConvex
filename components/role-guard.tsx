'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentUser, isLoading } = useAppState();
  const { t } = useI18n();
  const router = useRouter();

  const isAllowed = currentUser ? (currentUser.role === 'ADMIN' || allowedRoles.includes(currentUser.role)) : false;

  useEffect(() => {
    // Not loaded yet — wait
    if (isLoading) return;

    // Not logged in → redirect to login
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!isAllowed) {
      const targetMap: Record<UserRole, string> = {
        ADMIN: '/admin',
        COURIER: '/courier',
        COURIER_TRANSPORT: '/courier',
        COURIER_DELIVERY: '/delivery-courier',
        SELLER: '/seller',
        OFFICE_STAFF: '/office',
        FINANCE_ADMIN: '/finance',
        PENDING: '/pending',
      };
      const redirectPath = targetMap[currentUser.role] || '/pending';
      const timer = setTimeout(() => {
        router.push(redirectPath);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isAllowed, currentUser, isLoading, router]);

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

  // Not logged in
  if (!currentUser) {
    return null;
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

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white border border-amber-300 rounded-3xl p-6 max-w-sm text-center shadow-xl space-y-4">
          <div className="w-14 h-14 bg-red-100 border border-red-300 rounded-2xl flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Akses i Kufizuar (Access Denied)</h2>
            <p className="text-xs font-semibold text-slate-700 mt-2">
              Nuk keni leje të hyni në këtë faqe. Roli juaj i caktuar është:{' '}
              <span className="font-extrabold text-slate-950 bg-[#f6d55c] px-1.5 py-0.5 rounded border border-amber-300">
                {t.roles[currentUser.role]}
              </span>.
            </p>
          </div>
          
          <button
            onClick={() => router.push(myPath)}
            className="w-full py-3 px-4 rounded-2xl bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md border border-amber-300 transition"
          >
            <span>Kthehu te Paneli Juaj</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
