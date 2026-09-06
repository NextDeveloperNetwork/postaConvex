'use client';

import React, { useState } from 'react';
import { XCircle, X, Loader2 } from 'lucide-react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  title?: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export default function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Arsyeja e Refuzimit',
  description = 'Ju lutem shkruani arsyen e refuzimit. Kjo do të regjistrohet në sistem.',
  placeholder = 'Arsyeja e refuzimit...',
  confirmLabel = 'Refuzo',
  isLoading = false,
}: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setReason('');
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Arsyeja e refuzimit është e detyrueshme.');
      return;
    }
    setError('');
    await onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          {!isLoading && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="font-black text-slate-950 text-base">{title}</h3>
          <p className="text-xs text-slate-600 font-semibold">{description}</p>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            placeholder={placeholder}
            disabled={isLoading}
            className={`w-full bg-slate-50 border rounded-2xl px-4 py-3 text-xs font-semibold text-slate-950 resize-none focus:outline-none transition ${
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-red-400'
            } disabled:opacity-50`}
          />
          {error && (
            <p className="text-xs text-red-600 font-bold">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition disabled:opacity-40"
          >
            Anulo
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Duke procesuar...</span>
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
