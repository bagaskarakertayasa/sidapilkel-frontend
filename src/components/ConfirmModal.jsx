import React from 'react';
import { AlertTriangle, LogOut, Trash2, X, Loader2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger', // 'danger' | 'primary' | 'warning'
  loading = false,
}) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isLogout = type === 'logout';

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-fade-in relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 size-8 rounded-full bg-[#EFF2F7] text-[#6A7686] hover:text-[#080C1A] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div
            className={`size-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
              isLogout
                ? 'bg-[#165DFF]/10 text-[#165DFF] shadow-[#165DFF]/15'
                : isDanger
                ? 'bg-[#ED6B60]/10 text-[#ED6B60] shadow-[#ED6B60]/15'
                : 'bg-[#FED71F]/15 text-[#D6A000] shadow-[#FED71F]/20'
            }`}
          >
            {isLogout ? (
              <LogOut className="size-7" />
            ) : isDanger ? (
              <Trash2 className="size-7" />
            ) : (
              <AlertTriangle className="size-7" />
            )}
          </div>

          <h3 className="font-bold text-lg text-[#080C1A] tracking-tight">{title}</h3>
          <p className="text-xs text-[#6A7686] mt-2 leading-relaxed max-w-xs">{message}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-[#F3F4F3] text-xs font-semibold text-[#6A7686] bg-[#EFF2F7] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isLogout
                ? 'bg-[#165DFF] hover:bg-[#0E4BD9] shadow-[#165DFF]/20'
                : isDanger
                ? 'bg-[#ED6B60] hover:bg-[#D9554A] shadow-[#ED6B60]/20'
                : 'bg-[#165DFF] hover:bg-[#0E4BD9]'
            }`}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
