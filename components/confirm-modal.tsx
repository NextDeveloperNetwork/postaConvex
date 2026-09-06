'use client';

import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Info, X, Loader2 } from 'lucide-react';

type Variant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  isLoading?: boolean;
}

const variantConfig: Record<Variant, {
  iconBg: string;
  iconColor: string;
  confirmBg: string;
  confirmHover: string;
  confirmText: string;
  Icon: React.ElementType;
}> = {
  danger: {
    iconBg: 'bg-red-100 border border-red-200',
    iconColor: 'text-red-600',
    confirmBg: 'bg-red-600',
    confirmHover: 'hover:bg-red-500',
    confirmText: 'text-white',
    Icon: Trash2,
  },
  warning: {
    iconBg: 'bg-amber-100 border border-amber-200',
    iconColor: 'text-amber-700',
    confirmBg: 'bg-amber-500',
    confirmHover: 'hover:bg-amber-400',
    confirmText: 'text-slate-950',
    Icon: AlertTriangle,
  },
  success: {
    iconBg: 'bg-emerald-100 border border-emerald-200',
    iconColor: 'text-emerald-600',
    confirmBg: 'bg-emerald-600',
    confirmHover: 'hover:bg-emerald-500',
    confirmText: 'text-white',
    Icon: CheckCircle2,
  },
  info: {
    iconBg: 'bg-indigo-100 border border-indigo-200',
    iconColor: 'text-indigo-600',
    confirmBg: 'bg-indigo-600',
    confirmHover: 'hover:bg-indigo-500',
    confirmText: 'text-white',
    Icon: Info,
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Konfirmo',
  cancelLabel = 'Anulo',
  variant = 'warning',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const cfg = variantConfig[variant];
  const { Icon } = cfg;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Close */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
            <Icon className={`w-6 h-6 ${cfg.iconColor}`} />
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="font-black text-slate-950 text-base">{title}</h3>
          <div className="text-xs text-slate-600 font-semibold leading-relaxed">
            {description}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-2xl font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 ${cfg.confirmBg} ${cfg.confirmHover} ${cfg.confirmText} disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Duke u procesuar...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
