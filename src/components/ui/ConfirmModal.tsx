"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--overlay-strong)] backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${danger ? "bg-[var(--danger)]/10" : "bg-[var(--amber)]/10"}`}>
                <AlertTriangle className={`w-5 h-5 ${danger ? "text-[var(--danger)]" : "text-[var(--amber)]"}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-1)]">{title}</h3>
                <p className="text-xs text-[var(--text-2)] mt-1">{message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-[var(--text-2)] rounded-lg border border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  danger
                    ? "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                    : "bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
