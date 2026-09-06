'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { useI18n } from '@/lib/i18n';
import { useAppState } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Package, LogIn, Lock, Mail, UserCheck, Shield } from 'lucide-react';

export default function LoginPage() {
  const { t } = useI18n();
  const { users, setCurrentUser } = useAppState();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const roleRoutes: Record<UserRole, string> = {
    ADMIN: '/admin',
    COURIER: '/courier',
    COURIER_TRANSPORT: '/courier',
    COURIER_DELIVERY: '/delivery-courier',
    SELLER: '/seller',
    OFFICE_STAFF: '/office',
    FINANCE_ADMIN: '/finance',
    PENDING: '/pending',
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoginError('');

    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      router.push(roleRoutes[existing.role] || '/pending');
    } else {
      // Not found in DB — prompt to register
      setLoginError('Emaili nuk u gjet në sistem. Ju lutem regjistrohuni ose kontrolloni adresën.');
    }
  };

  const demoUsers = users.filter(u => u.isDemoUser);

  const handleDemoUserLogin = (user: typeof users[0]) => {
    setCurrentUser(user);
    if (user.role === 'FINANCE_ADMIN') {
      router.push('/admin');
    } else {
      router.push(roleRoutes[user.role] || '/pending');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        
        {/* Top Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#f6d55c] rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-[#f6d55c]/30 border border-amber-300">
            <Package className="w-9 h-9 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">{t.auth.loginTitle}</h1>
          <p className="text-xs font-bold text-slate-600">{t.auth.loginSubtitle}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5">
          
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-950 mb-1.5">{t.auth.emailLabel}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. arben@posta.al"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] focus:ring-2 focus:ring-[#f6d55c]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-950 mb-1.5">{t.auth.passwordLabel}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] focus:ring-2 focus:ring-[#f6d55c]/50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#f6d55c] hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-300/40 border border-amber-300 transition active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.auth.loginBtn}</span>
            </button>

            {loginError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
                {loginError}
              </p>
            )}
          </form>

          {/* Link to Register */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-semibold">
              {t.auth.noAccountText}{' '}
              <Link href="/register" className="font-extrabold text-slate-950 underline underline-offset-4 hover:text-amber-600 transition">
                {t.nav.register}
              </Link>
            </p>
          </div>

        </div>

        {/* Quick Demo Fast Login Selector (Only shows users marked as isDemoUser === true by Admin) */}
        {demoUsers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-700" />
                <h3 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">Hyrje e Shpejtë (Përdoruesit Demo)</h3>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#f6d55c] text-slate-950 border border-amber-300">
                {demoUsers.length} Demo Users
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
              {demoUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleDemoUserLogin(u)}
                  className="p-3 bg-white hover:bg-[#f6d55c] border border-amber-300 rounded-2xl text-slate-950 transition text-left shadow-xs flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-black text-slate-950 truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-600 font-semibold truncate">{t.roles[u.role]}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 group-hover:bg-slate-950 group-hover:text-[#f6d55c] text-amber-900 border border-amber-300 transition flex-shrink-0">
                    {u.role.replace('_STAFF', '').replace('_ADMIN', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
