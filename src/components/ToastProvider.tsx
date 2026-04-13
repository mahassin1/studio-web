"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Toast = {
  id: number;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);

    setToasts((prev) => [...prev, { id, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#2d211b] shadow-lg ring-1 ring-black/10"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}