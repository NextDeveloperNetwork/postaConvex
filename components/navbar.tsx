'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useAppState } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Package, Shield, User, Globe, ChevronDown, Check, LogIn, UserPlus } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { lang, setLang, t } = useI18n();
  const { currentUser, setCurrentUser, users } = useAppState();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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

  const handleRoleSwitch = (newUser: NonNullable<typeof currentUser>) => {
    setCurrentUser(newUser);
    setShowRoleMenu(false);
    const targetRoute = roleRoutes[newUser.role] || '/pending';
    router.push(targetRoute);
  };

  const handleAdminSwitch = () => {
    const adminUser = users.find(u => u.role === 'FINANCE_ADMIN' || u.role === 'ADMIN') || currentUser;
    if (adminUser) setCurrentUser(adminUser);
    setShowRoleMenu(false);
    router.push('/admin');
  };

  // Derive dashboard link — '/' when not logged in
  const dashboardHref = currentUser ? (roleRoutes[currentUser.role] || '/') : '/';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-md md:max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href={dashboardHref} className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#f6d55c] flex items-center justify-center shadow-md shadow-[#f6d55c]/30 border border-amber-300">
            <Package className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-slate-950">POSTA</span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-[#f6d55c] text-slate-950 border border-amber-300">
                AL
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-600 -mt-0.5">Courier &amp; COD System</p>
          </div>
        </Link>

        {/* Controls Header */}
        <div className="flex items-center gap-2">
          
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-900 hover:bg-slate-200 transition"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-700" />
              <span>{lang.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-slate-600" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50">
                <button
                  onClick={() => { setLang('sq'); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between ${
                    lang === 'sq' ? 'bg-[#f6d55c]/30 text-slate-950 font-black' : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>🇦🇱 Shqip (SQ)</span>
                  {lang === 'sq' && <Check className="w-3.5 h-3.5 text-slate-950" />}
                </button>
                <button
                  onClick={() => { setLang('en'); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between ${
                    lang === 'en' ? 'bg-[#f6d55c]/30 text-slate-950 font-black' : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>🇬🇧 English (EN)</span>
                  {lang === 'en' && <Check className="w-3.5 h-3.5 text-slate-950" />}
                </button>
              </div>
            )}
          </div>

          {/* When NOT logged in: show Login & Register buttons */}
          {!currentUser && (
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              <Link href="/login" className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition flex items-center gap-1">
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.login}</span>
              </Link>
              <Link href="/register" className="px-3 py-1.5 rounded-xl bg-[#f6d55c] hover:bg-amber-300 text-slate-950 border border-amber-300 transition flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.nav.register}</span>
              </Link>
            </div>
          )}

          {/* When logged in: User menu */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#f6d55c] text-slate-950 border border-amber-300 shadow-sm hover:bg-amber-300 transition"
              >
                <User className="w-3.5 h-3.5 text-slate-950" />
                <span className="max-w-[90px] truncate">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-950 opacity-80" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 text-slate-900 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{t.nav.switchRole}</p>
                    <p className="text-xs font-black text-slate-950 mt-0.5">{currentUser.name}</p>
                    <p className="text-[11px] font-semibold text-slate-600">{currentUser.email}</p>
                  </div>

                  {/* Explicit Admin Portal Button in Demo Dropdown */}
                  <button
                    onClick={handleAdminSwitch}
                    className="w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between bg-amber-100 hover:bg-[#f6d55c] border border-amber-300 text-slate-950 transition font-black"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-950" />
                      <span>{t.nav.admin} (Admin Portal)</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-slate-950 text-[#f6d55c]">
                      ADMIN
                    </span>
                  </button>

                  <div className="py-1 max-h-60 overflow-y-auto space-y-1 border-t border-slate-100">
                    {users.filter(u => u.isDemoUser).map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleRoleSwitch(u)}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                          currentUser.id === u.id
                            ? 'bg-[#f6d55c]/30 text-slate-950 font-black border border-amber-300'
                            : 'hover:bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-950 truncate">{u.name}</span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-600">{t.roles[u.role]}</p>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-slate-100 text-slate-950 border border-slate-200">
                          {u.role.replace('_STAFF', '').replace('_ADMIN', '')}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Quick Auth Links */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold px-1">
                    <Link href="/login" onClick={() => setShowRoleMenu(false)} className="text-slate-950 hover:underline flex items-center gap-1">
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{t.nav.login}</span>
                    </Link>
                    <Link href="/register" onClick={() => setShowRoleMenu(false)} className="text-amber-800 hover:underline flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t.nav.register}</span>
                    </Link>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
