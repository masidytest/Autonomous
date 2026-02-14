import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'upgrade' | 'friendly' | 'achievement' | 'suggestion';
  title?: string;
  message: string;
  duration?: number; // ms, 0 = no auto-dismiss
  action?: {
    label: string;
    icon?: 'gift' | 'sparkles' | 'zap';
    onClick: () => void;
  };
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = uuidv4();
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { ...toast, id }], // Keep max 5 toasts
    }));
    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));

// ── Convenience helpers ──

export function toast(message: string, type: ToastItem['type'] = 'info', duration = 5000) {
  return useToastStore.getState().addToast({ type, message, duration });
}

export function toastSuccess(message: string, title?: string) {
  return useToastStore.getState().addToast({ type: 'success', title, message, duration: 4000 });
}

export function toastError(message: string, title?: string) {
  return useToastStore.getState().addToast({ type: 'error', title, message, duration: 8000 });
}

export function toastFriendly(message: string, title?: string) {
  return useToastStore.getState().addToast({ type: 'friendly', title, message, duration: 6000 });
}

export function toastUpgrade(message: string, onUpgrade: () => void) {
  return useToastStore.getState().addToast({
    type: 'upgrade',
    title: 'Unlock Premium',
    message,
    duration: 0, // Don't auto-dismiss
    action: { label: 'Start Free Trial', icon: 'gift', onClick: onUpgrade },
  });
}

export function toastAchievement(title: string, message: string) {
  return useToastStore.getState().addToast({ type: 'achievement', title, message, duration: 6000 });
}

export function toastSuggestion(message: string, onAction?: () => void) {
  return useToastStore.getState().addToast({
    type: 'suggestion',
    title: 'Pro Tip',
    message,
    duration: 8000,
    action: onAction ? { label: 'Try it', icon: 'sparkles', onClick: onAction } : undefined,
  });
}
