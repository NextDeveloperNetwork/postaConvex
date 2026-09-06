'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppState } from '@/lib/store';
import {
  Truck as TruckIcon,
  Archive as BagIcon,
  PackageCheck as HistoryIcon,
  LogOut as LogoutIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  MapPin as DeliveryIcon,
  Banknote as BanknoteIcon,
} from 'lucide-react';

export const CourierSidebar: React.FC = () => {
  const { currentUser, setCurrentUser, users, shipments, bags, handovers, payoutBatches } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return null;

  const myBags = bags.filter(b => b.courierId === currentUser.id);
  const pendingBags = myBags.filter(b => b.status === 'PENDING_APPROVAL').length;
  const myDeliveries = shipments.filter(s =>
    s.courierId === currentUser.id && s.status === 'OUT_FOR_DELIVERY'
  ).length;
  const myDone = shipments.filter(s =>
    s.courierId === currentUser.id &&
    (s.status === 'DELIVERED_PENDING_SETTLEMENT' || s.status === 'CLOSED')
  ).length;

  const pendingMoneyTransfers = (handovers || []).filter(
    h => (h.courierId === currentUser.id || h.courierName === currentUser.name) &&
      (h.status === 'PENDING_COURIER_PICKUP' || h.status === 'PENDING_APPROVAL')
  ).length + (payoutBatches || []).filter(
    b => (b.courierId === currentUser.id || b.courierName === currentUser.name) &&
      b.status === 'PENDING_COURIER_PICKUP'
  ).length;

  const navCategories = [
    {
      title: 'DETYRAT & THASËT',
      items: [
        { label: 'Paneli i Kurierit', href: '/courier', icon: TruckIcon, badge: undefined as number | undefined },
        { label: 'Thasët e Caktuara', href: '/courier/bags', icon: BagIcon, badge: pendingBags > 0 ? pendingBags : undefined },
      ],
    },
    {
      title: 'TRANSPORTI I PARAVE & CASH',
      items: [
        {
          label: 'Transporti i Parave',
          href: '/courier/money-transport',
          icon: BanknoteIcon,
          badge: pendingMoneyTransfers > 0 ? pendingMoneyTransfers : undefined
        },
      ],
    },
    {
      title: 'HISTORIKU & RAPORTET',
      items: [
        { label: 'Historiku i Dërgimeve', href: '/courier/history', icon: HistoryIcon, badge: myDone > 0 ? myDone : undefined },
      ],
    },
  ];

  const handleLogout = () => {
    const defaultUser = users[0];
    setCurrentUser(defaultUser);
    setMobileOpen(false);
    router.push('/login');
  };

  const NavLink = ({ item, onClick }: { item: typeof navCategories[0]['items'][0]; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition
          ${isActive
            ? 'bg-indigo-600 text-white border border-indigo-700 shadow-md shadow-indigo-300/30'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
          }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
          <span>{item.label}</span>
        </div>
        {item.badge !== undefined && item.badge > 0 && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-indigo-700' : 'bg-slate-950 text-[#f6d55c]'}`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ── MOBILE TOPBAR ───────────────────────────────────── */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2.5 rounded-2xl bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 text-indigo-700 transition active:scale-95 shadow-xs relative"
            aria-label="Open Courier Menu"
          >
            <MenuIcon className="w-5 h-5" />
            {pendingBags > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-white">
                {pendingBags}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center border border-indigo-700 shadow-sm">
              <TruckIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-950">POSTA</span>
              <span className="ml-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                KURIER
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
        </div>
      </div>

      {/* ── MOBILE DRAWER ───────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" />
          <aside className="fixed top-0 bottom-0 left-0 w-72 bg-white p-5 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-300/30 border border-indigo-700">
                    <TruckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-base tracking-tight text-slate-950">POSTA</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">KURIER</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-600">{currentUser.officeName || 'Kurier i Lire'}</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold border border-slate-200 transition">
                  <CloseIcon className="w-5 h-5 text-slate-950" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                <p className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">I kycur si Kurier</p>
                <p className="text-xs font-black text-slate-950 truncate">{currentUser.name}</p>
                <p className="text-[10px] font-bold text-slate-600 truncate">{currentUser.email}</p>
              </div>

              <nav className="space-y-4">
                {navCategories.map((category) => (
                  <div key={category.title} className="space-y-1">
                    <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      {category.title}
                    </p>
                    {category.items.map((item) => (
                      <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
                    ))}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link href="/" onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition">
                <div className="flex items-center gap-2">
                  <HomeIcon className="w-4 h-4 text-slate-700" />
                  <span>Faqja Kryesore</span>
                </div>
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs transition">
                <div className="flex items-center gap-2">
                  <LogoutIcon className="w-4 h-4 text-red-600" />
                  <span>Dil nga Paneli</span>
                </div>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside className="hidden md:flex fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 flex-col justify-between shadow-none">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-1 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-300/30 border border-indigo-700">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-slate-950">POSTA</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">KURIER</span>
              </div>
              <p className="text-[10px] font-bold text-slate-600">{currentUser.officeName || 'Kurier i Lire'}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
            <p className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">I kycur si Kurier</p>
            <p className="text-xs font-black text-slate-950 truncate">{currentUser.name}</p>
            <p className="text-[10px] font-bold text-slate-600 truncate">{currentUser.email}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Aktive', value: myDeliveries, color: 'text-indigo-600' },
              { label: 'Thasë', value: pendingBags, color: 'text-amber-600' },
              { label: 'Bere', value: myDone, color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-2 text-center">
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] font-bold text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <nav className="space-y-4">
            {navCategories.map((category) => (
              <div key={category.title} className="space-y-1">
                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  {category.title}
                </p>
                {category.items.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <Link href="/"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 font-extrabold text-xs transition">
            <div className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4 text-slate-700" />
              <span>Faqja Kryesore</span>
            </div>
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs transition">
            <div className="flex items-center gap-2">
              <LogoutIcon className="w-4 h-4 text-red-600" />
              <span>Dil nga Paneli</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
