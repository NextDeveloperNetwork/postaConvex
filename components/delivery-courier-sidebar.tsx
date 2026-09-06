'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppState } from '@/lib/store';
import {
  Truck,
  PackageCheck,
  LogOut,
  MapPin,
  Menu,
  X,
  Banknote,
} from 'lucide-react';

export const DeliveryCourierSidebar: React.FC = () => {
  const { currentUser, setCurrentUser, users, shipments, handovers, payoutBatches } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return null;

  const myDeliveries = shipments.filter(s =>
    s.courierId === currentUser.id && s.status === 'OUT_FOR_DELIVERY'
  ).length;

  const myDeliveredToday = shipments.filter(s =>
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
      title: 'DORËZIMET NË ADRESË',
      items: [
        { label: 'Dorëzime Lokale', href: '/delivery-courier', icon: Truck, badge: myDeliveries > 0 ? myDeliveries : undefined },
      ],
    },
    {
      title: 'TRANSPORTI I PARAVE & CASH',
      items: [
        { label: 'Transporti i Parave', href: '/courier/money-transport', icon: Banknote, badge: pendingMoneyTransfers > 0 ? pendingMoneyTransfers : undefined },
      ],
    },
    {
      title: 'HISTORIKU & COD',
      items: [
        { label: 'Historiku i Dorëzimeve', href: '/delivery-courier/history', icon: PackageCheck, badge: myDeliveredToday > 0 ? myDeliveredToday : undefined },
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
        className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition ${
          isActive
            ? 'bg-[#f6d55c] text-slate-950 shadow-md shadow-amber-300/30 border border-amber-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
          <span>{item.label}</span>
        </div>
        {item.badge !== undefined && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              isActive
                ? 'bg-slate-950 text-[#f6d55c]'
                : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile top header bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-950 text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#f6d55c] flex items-center justify-center text-slate-950 font-black text-xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-black text-xs text-[#f6d55c]">POSTA SHQIPTARE</p>
            <p className="text-[10px] text-slate-400 font-bold truncate max-w-[160px]">
              Kurier Dorëzimi &bull; {currentUser.name.split(' ')[0]}
            </p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-800 text-[#f6d55c] focus:outline-none"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-950">Kurier Dorëzimi</p>
                    <p className="text-[10px] text-slate-500 font-bold">{currentUser.officeName || 'Zyra Postare'}</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {navCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">{cat.title}</p>
                  <div className="space-y-1">
                    {cat.items.map((item, itemIdx) => (
                      <NavLink key={itemIdx} item={item} onClick={() => setMobileOpen(false)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">
                <p className="font-black text-slate-950">{currentUser.name}</p>
                <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Roli: Kurier Dorëzimi Lokal</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 font-black text-xs rounded-2xl border border-red-200 hover:bg-red-100 transition"
              >
                <LogOut className="w-4 h-4" /> Dalje
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] p-4 justify-between shadow-xs sticky top-16">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-3xl p-4 shadow-md space-y-1">
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
              Kurier Dorëzimi Lokal
            </span>
            <p className="font-black text-base leading-tight mt-1">{currentUser.name}</p>
            <p className="text-xs text-indigo-200 font-semibold">{currentUser.officeName || 'Zyra Postare'}</p>
          </div>

          {navCategories.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">{cat.title}</p>
              <div className="space-y-1">
                {cat.items.map((item, itemIdx) => (
                  <NavLink key={itemIdx} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 font-black text-xs rounded-2xl border border-red-200 hover:bg-red-100 transition active:scale-95 shadow-xs"
          >
            <LogOut className="w-4 h-4" /> Dalje
          </button>
        </div>
      </aside>
    </>
  );
};
