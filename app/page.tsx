'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { useI18n } from '@/lib/i18n';
import { useAppState } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Package, LogIn, Lock, Mail, UserCheck, Shield } from 'lucide-react';

export default function HomePage() {
  const { t } = useI18n();
  const { users, setCurrentUser, registerUser } = useAppState();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Look for existing user in DB (already synced into state)
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      router.push(roleRoutes[existing.role] || '/pending');
    } else {
      // New user: register to DB then redirect to pending
      const newUser = await registerUser({
        name: email.split('@')[0],
        email,
        role: 'PENDING',
      });
      if (newUser) {
        router.push('/pending');
      } else {
        alert('Ndodhi një gabim gjatë regjistrimit. Ju lutem provoni përsëri.');
      }
    }
  };

  const handleDemoRoleClick = (user: typeof users[0]) => {
    setCurrentUser(user);
    const roleRouteMap: Record<UserRole, string> = {
      ADMIN: '/admin',
      COURIER: '/courier',
      COURIER_TRANSPORT: '/courier',
      COURIER_DELIVERY: '/delivery-courier',
      SELLER: '/seller',
      OFFICE_STAFF: '/office',
      FINANCE_ADMIN: '/finance',
      PENDING: '/pending',
    };
    if (user.role === 'FINANCE_ADMIN') {
      router.push('/admin');
    } else {
      router.push(roleRouteMap[user.role] || '/pending');
    }
  };

  // Demo users (marked isDemoUser=true in Admin)
  const demoUsers = users.filter(u => u.isDemoUser);

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
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold uppercase text-slate-400">{t.auth.orContinueWith}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 flex items-center justify-center gap-2 transition"
            >
              <span>Google OAuth</span>
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <span>GitHub OAuth</span>
            </button>
          </div>

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

        {/* Quick Demo Fast Login Selector — only shown when there are isDemoUser=true accounts in DB */}
        {demoUsers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-700" />
                <h3 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">{t.auth.quickDemoLogin}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {demoUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleDemoRoleClick(u)}
                  className={`p-2.5 bg-white border border-amber-300 rounded-2xl text-slate-950 hover:bg-[#f6d55c] transition text-left shadow-sm ${
                    u.role === 'FINANCE_ADMIN' ? 'col-span-2' : ''
                  }`}
                >
                  <p className="font-black text-slate-950 truncate">{u.name}</p>
                  <p className="text-[10px] text-slate-600 font-medium">{t.roles[u.role]}</p>
                </button>
              ))}

              {/* Explicit Admin Button */}
              <button
                onClick={() => router.push('/admin')}
                className="col-span-2 p-2.5 bg-[#f6d55c] border border-amber-400 rounded-2xl text-slate-950 hover:bg-amber-300 transition text-center shadow-md flex items-center justify-center gap-2 font-black"
              >
                <Shield className="w-4 h-4 text-slate-950" />
                <span>{t.nav.admin} (Admin Portal)</span>
              </button>
            </div>
          </div>
        )}

        {/* When no demo users exist yet */}
        {demoUsers.length === 0 && (
          <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4 text-center space-y-2">
            <Shield className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Nuk ka llogari demo të konfiguruar ende.</p>
            <button
              onClick={() => router.push('/admin')}
              className="text-xs font-black text-slate-950 underline"
            >
              Shko te Admin Portal
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
