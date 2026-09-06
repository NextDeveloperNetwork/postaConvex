'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useAppState } from '@/lib/store';
import { 
  Shield, 
  Users, 
  Clock,
  Building2, 
  DollarSign, 
  Settings, 
  LogOut, 
  Home,
  Menu,
  X,
  MapPin,
  Award,
  Package
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { t } = useI18n();
  const { currentUser, setCurrentUser, users } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return null;

  const pendingCount = users.filter(u => u.role === 'PENDING').length;

  const navItems = [
    { label: 'Perdoruesit & Rolet', href: '/admin', icon: Users },
    { label: 'Të Gjitha Dërgesat', href: '/office/shipments', icon: Package },
    { label: 'Fitimi i Administratorit', href: '/admin/revenue', icon: Award },
    { label: 'Kerkesat ne Pritje', href: '/admin/pending', icon: Clock, badge: pendingCount },
    { label: 'Zyrat Postare', href: '/admin/offices', icon: Building2 },
    { label: 'Qytetet e Destinacionit', href: '/admin/cities', icon: MapPin },
    { label: 'Cilesimet e Sistemit', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    const seller = users.find(u => u.role === 'SELLER') || users[0];
    setCurrentUser(seller);
    setMobileOpen(false);
    router.push('/login');
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE TOPBAR WITH HAMBURGER MENU (< 768px) */}
      {/* ========================================================================= */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm px-4 py-3 flex items-center justify-between">
        
        {/* Hamburger Menu Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2.5 rounded-2xl bg-amber-100 hover:bg-[#f6d55c] border border-amber-300 text-slate-950 transition active:scale-95 shadow-xs relative"
            aria-label="Open Sidebar Menu"
          >
            <Menu className="w-5 h-5 text-slate-950" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#f6d55c] flex items-center justify-center border border-amber-300 shadow-sm">
              <Shield className="w-4.5 h-4.5 text-slate-950" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-950">POSTA</span>
              <span className="ml-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-950 text-[#f6d55c]">
                ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* User Avatar Badge */}
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER SIDEBAR & BACKDROP (< 768px) */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          
          {/* Backdrop Overlay */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Sidebar Container */}
          <aside className="fixed top-0 bottom-0 left-0 w-72 bg-white p-5 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              
              {/* Drawer Header: Brand + Close Icon */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#f6d55c] flex items-center justify-center shadow-md shadow-[#f6d55c]/30 border border-amber-300">
                    <Shield className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-base tracking-tight text-slate-950">POSTA</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-950 text-[#f6d55c]">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-600">Paneli i Menaxhimit</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold border border-slate-200 transition"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5 text-slate-950" />
                </button>
              </div>

              {/* User Info Badge */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">I kyçur si Admin</p>
                <p className="text-xs font-black text-slate-950 truncate">{currentUser.name}</p>
                <p className="text-[10px] font-bold text-slate-600 truncate">{currentUser.email}</p>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="space-y-1.5">
                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Menuja Administrative</p>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition
                        ${isActive 
                          ? 'bg-[#f6d55c] text-slate-950 border border-amber-300 shadow-md' 
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions inside Mobile Drawer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition"
              >
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-700" />
                  <span>Faqja Kryesore</span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs transition"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Dil nga Admini</span>
                </div>
              </button>
            </div>

          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR - Permanent Left Sidebar for Desktop Monitors (≥ 768px) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 flex-col justify-between shadow-none">
        <div className="space-y-6">
          
          {/* Admin Brand Badge */}
          <div className="flex items-center gap-3 px-2 py-1 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#f6d55c] flex items-center justify-center shadow-md shadow-[#f6d55c]/30 border border-amber-300">
              <Shield className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-slate-950">POSTA</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-950 text-[#f6d55c]">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-600">Paneli i Menaxhimit</p>
            </div>
          </div>

          {/* User Info Badge */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">I kyçur si Admin</p>
            <p className="text-xs font-black text-slate-950 truncate">{currentUser.name}</p>
            <p className="text-[10px] font-bold text-slate-600 truncate">{currentUser.email}</p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Menuja Administrative</p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition
                    ${isActive 
                      ? 'bg-[#f6d55c] text-slate-950 border border-amber-300 shadow-md shadow-amber-300/30' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition"
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-slate-700" />
              <span>Faqja Kryesore</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs transition"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Dil nga Admini</span>
            </div>
          </button>
        </div>

      </aside>
    </>
  );
};
