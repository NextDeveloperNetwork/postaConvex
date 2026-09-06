'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { useAppState } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { Clock, PhoneCall } from 'lucide-react';

export default function PendingPage() {
  const { currentUser, isLoading } = useAppState();
  const { t } = useI18n();

  // Show a loader while the DB sync is in progress
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#f6d55c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → send to login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950 pb-16">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
          <p className="text-sm font-bold text-slate-700">Ju lutemi identifikohuni për të parë këtë faqe.</p>
          <Link href="/login" className="inline-block px-5 py-2.5 bg-[#f6d55c] rounded-2xl font-black text-slate-950 text-xs border border-amber-300">
            Hyr
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 pb-16">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
        
        <div className="w-20 h-20 bg-[#f6d55c] border border-amber-300 rounded-3xl flex items-center justify-center mx-auto text-slate-950 shadow-xl shadow-amber-300/40">
          <Clock className="w-10 h-10 animate-pulse text-slate-950" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-slate-950 text-[#f6d55c]">
            {t.pendingView.statusBadge}
          </span>
          <h1 className="text-xl font-black text-slate-950 pt-2">{t.pendingView.title}</h1>
          <p className="text-xs font-bold text-slate-700 leading-relaxed px-4">
            {t.pendingView.message}
          </p>
        </div>

        <div className="bg-white border border-amber-300 rounded-3xl p-5 text-left text-xs space-y-3 shadow-lg font-bold">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-950 text-[#f6d55c] flex items-center justify-center font-black">
              1
            </div>
            <div>
              <p className="font-black text-slate-950">Regjistrimi u Krye</p>
              <p className="text-[11px] font-semibold text-slate-600">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f6d55c] text-slate-950 flex items-center justify-center font-black border border-amber-300">
              2
            </div>
            <div>
              <p className="font-black text-slate-950">Pritja e Caktimit të Rolit</p>
              <p className="text-[11px] font-semibold text-slate-600">Administratori po kontrollon llogarinë tuaj</p>
            </div>
          </div>
        </div>

        <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 pt-4">
          <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
          <span>{t.pendingView.contactAdmin}</span>
        </p>

      </main>
    </div>
  );
}
