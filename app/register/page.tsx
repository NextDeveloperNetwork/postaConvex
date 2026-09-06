'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { useI18n } from '@/lib/i18n';
import { useAppState } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Package, UserPlus, Lock, Mail, User, Building, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useI18n();
  const { registerUser } = useAppState();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('SELLER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    setIsSubmitting(true);
    setError('');

    const newUser = await registerUser({
      name: `${fullName} (${businessName || requestedRole})`,
      email,
      role: 'PENDING',
    });

    if (newUser) {
      router.push('/pending');
    } else {
      setError('Ndodhi një gabim gjatë regjistrimit. Emaili mund të jetë tashmë i regjistruar.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#f6d55c] rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-[#f6d55c]/30 border border-amber-300">
            <UserPlus className="w-9 h-9 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">{t.auth.registerTitle}</h1>
          <p className="text-xs font-semibold text-slate-600">{t.auth.registerSubtitle}</p>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
          
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            
            <div>
              <label className="block text-xs font-bold text-slate-950 mb-1">{t.auth.fullNameLabel}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatmir Berisha"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] focus:ring-2 focus:ring-[#f6d55c]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-950 mb-1">{t.auth.businessNameLabel}</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Sartorial Albania"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] focus:ring-2 focus:ring-[#f6d55c]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-950 mb-1">{t.auth.emailLabel}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="fatmir@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] focus:ring-2 focus:ring-[#f6d55c]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-950 mb-1">{t.auth.passwordLabel}</label>
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

            <div>
              <label className="block text-xs font-bold text-slate-950 mb-1">{t.auth.requestedRoleLabel}</label>
              <select
                value={requestedRole}
                onChange={e => setRequestedRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-950 font-bold focus:outline-none focus:border-[#f6d55c] focus:ring-2 focus:ring-[#f6d55c]/50 transition"
              >
                <option value="SELLER">{t.roles.SELLER}</option>
                <option value="COURIER">{t.roles.COURIER}</option>
                <option value="OFFICE_STAFF">{t.roles.OFFICE_STAFF}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#f6d55c] hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-300/40 border border-amber-300 transition active:scale-95 mt-2"
            >
              {isSubmitting ? (
                <span>Duke regjistruar...</span>
              ) : (
                <>
                  <span>{t.auth.registerBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {error && (
              <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
                {error}
              </p>
            )}
          </form>

          {/* Link to Login */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-semibold">
              {t.auth.hasAccountText}{' '}
              <Link href="/login" className="font-extrabold text-slate-950 underline underline-offset-4 hover:text-amber-600 transition">
                {t.nav.login}
              </Link>
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}
