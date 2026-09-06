'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const variantConfig: Record<ToastVariant, {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  Icon: React.ElementType;
}> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    iconColor: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-950',
    iconColor: 'text-red-600',
    Icon: XCircle,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-950',
    iconColor: 'text-amber-700',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    text: 'text-indigo-950',
    iconColor: 'text-indigo-600',
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    counterRef.current += 1;
    const id = `toast-${Date.now()}-${counterRef.current}`;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => {
          const cfg = variantConfig[toast.variant];
          const { Icon } = cfg;
          return (
            <div
              key={toast.id}
              className={`${cfg.bg} ${cfg.border} border rounded-2xl px-4 py-3.5 shadow-xl flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right-5 duration-300`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
              <p className={`text-xs font-bold flex-1 leading-relaxed ${cfg.text}`}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className={`flex-shrink-0 p-0.5 rounded-lg hover:bg-black/10 transition ${cfg.iconColor} opacity-70 hover:opacity-100`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
