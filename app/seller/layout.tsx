'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';
import { SellerSidebar } from '@/components/seller-sidebar';

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['SELLER', 'ADMIN', 'FINANCE_ADMIN']}>
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col md:flex-row">
        {/* Seller Sidebar & Mobile Topbar */}
        <SellerSidebar />

        {/* Main Content Area */}
        <div className="flex-1 md:ml-64 min-w-0 w-full px-4 md:px-8 py-4 md:py-6">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
