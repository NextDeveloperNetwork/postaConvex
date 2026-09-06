'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useAppState } from '@/lib/store';
import {
  Banknote,
  Receipt,
  Users,
  Building2,
  Send,
  LogOut,
  Menu,
  X,
  Shield,
  LayoutDashboard,
  TrendingUp,
  History,
  FileSpreadsheet,
  ArrowRight,
  Truck,
  ArrowDownLeft
} from 'lucide-react';

export const FinanceSidebar: React.FC = () => {
  const { t } = useI18n();
  const { currentUser, setCurrentUser, users, shipments } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return null;

  const unsettledCount = shipments.filter(s => s.paymentStatus === 'COD_COLLECTED').length;

  const navCategories: {
    title: string;
    items: { label: string; href: string; icon: any; badge?: number }[];
  }[] = [
    {
      title: 'PANELI I FINANCËS',
      items: [
        { label: 'Pasqyra Financiare', href: '/finance', icon: LayoutDashboard },
        { label: 'Detyrimet & Beneficiarët', href: '/finance/beneficiaries', icon: TrendingUp },
        { label: 'Arkiva e Shpërndarjeve', href: '/finance/distributions', icon: FileSpreadsheet },
        { label: 'Historiku i Transaksioneve', href: '/finance/transactions', icon: History },
      ],
    },
  ];

  const handleLogout = () => {
    const defaultUser = users[0];
    setCurrentUser(defaultUser);
    setMobileOpen(false);
    router.push('/login');
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE TOPBAR (< 768px) */}
      {/* ========================================================================= */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2.5 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700 text-emerald-300 transition active:scale-95 shadow-xs"
            aria-label="Open Finance Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center border border-emerald-400 shadow-sm text-slate-950 font-black">
              <Banknote className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white">POSTA</span>
              <span className="ml-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950">
                FINANCA
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER (< 768px) */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-100 shadow-2xl flex flex-col z-50 border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 border border-emerald-400 shadow-sm">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-white tracking-tight leading-none">POSTA EXPRESS</h2>
                  <span className="text-[9px] font-black uppercase text-emerald-400">Departamenti Financiar</span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {navCategories.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-2">
                    {cat.title}
                  </h3>
                  <div className="space-y-1">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-black transition ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-slate-950">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Profile & Switcher */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-black text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase">{currentUser.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP FIXED LEFT SIDEBAR (≥ 768px) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex md:w-64 fixed inset-y-0 left-0 z-30 bg-slate-900 border-r border-slate-800 flex-col shadow-xl text-slate-100">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 border border-emerald-300 shadow-md">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight text-white leading-none">POSTA</h1>
              <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                Financa Qendrore
              </span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="mx-4 mt-4 p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase truncate">
              {currentUser.officeName || 'Administrata Qendrore'}
            </p>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {navCategories.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-2">
                {cat.title}
              </h3>
              <div className="space-y-1">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition group ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                          isActive ? 'bg-slate-950 text-emerald-400' : 'bg-amber-400 text-slate-950'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Role Switcher & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
          {/* Quick Switcher dropdown */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase block px-1">Ndrro Rolin (Demo)</label>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const target = users.find(u => u.id === e.target.value);
                if (target) {
                  setCurrentUser(target);
                  if (target.role === 'ADMIN') router.push('/admin');
                  else if (target.role === 'SELLER') router.push('/seller');
                  else if (target.role === 'OFFICE_STAFF') router.push('/office');
                  else if (target.role === 'COURIER_DELIVERY') router.push('/delivery-courier');
                  else if (target.role === 'COURIER_TRANSPORT') router.push('/courier');
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-400"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-red-950/60 hover:text-red-300 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Dil nga Sistemi</span>
          </button>
        </div>

      </aside>
    </>
  );
};
