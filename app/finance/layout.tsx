'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';
import { FinanceSidebar } from '@/components/finance-sidebar';

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['FINANCE_ADMIN', 'ADMIN']}>
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col md:flex-row">
        {/* Finance Navigation: Sticky Topbar on Mobile (<768px), Left Sidebar on Desktop (≥768px) */}
        <FinanceSidebar />

        {/* Main Content Container */}
        <div className="flex-1 md:ml-64 min-w-0 w-full px-4 md:px-8 py-4 md:py-6">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
