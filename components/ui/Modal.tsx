'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  actions?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function PremiumModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  actions,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${sizeClasses[size]} w-full mx-4 z-50`}
          >
            <div className="rounded-3xl border border-border bg-card shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Header */}
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-card rounded-lg transition-all text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {actions && (
                <div className="border-t border-border px-6 py-4 flex gap-3 justify-end">
                  {actions}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  dangerous = false,
}: ConfirmModalProps) {
  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      actions={
        <>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border hover:bg-card transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
              dangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:shadow-lg'
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-foreground">{message}</p>
    </PremiumModal>
  );
}
