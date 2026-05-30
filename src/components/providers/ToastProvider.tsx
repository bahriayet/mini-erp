"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    warning: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toastHelpers = React.useMemo(
    () => ({
      success: (msg: string, dur?: number) => addToast(msg, "success", dur),
      error: (msg: string, dur?: number) => addToast(msg, "error", dur),
      warning: (msg: string, dur?: number) => addToast(msg, "warning", dur),
      info: (msg: string, dur?: number) => addToast(msg, "info", dur),
    }),
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ toast: toastHelpers }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose(toast.id)
    }, 300) // Match transition duration
  }, [onClose, toast.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.duration, handleClose])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  }

  const borders = {
    success: "border-emerald-500/20 shadow-emerald-500/5",
    error: "border-rose-500/20 shadow-rose-500/5",
    warning: "border-amber-500/20 shadow-amber-500/5",
    info: "border-sky-500/20 shadow-sky-500/5",
  }

  const progressColors = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-sky-500",
  }

  return (
    <div
      className={cn(
        "w-full bg-card/85 backdrop-blur-md border rounded-2xl p-4 flex items-start gap-3 shadow-xl pointer-events-auto transition-all duration-300 relative overflow-hidden",
        borders[toast.type],
        isClosing 
          ? "opacity-0 translate-y-[-10px] scale-95" 
          : "animate-in slide-in-from-right-12 fade-in-0 duration-300"
      )}
      style={{ contentVisibility: "auto" }}
    >
      {/* Icon */}
      {icons[toast.type]}

      {/* Message */}
      <div className="flex-1 text-xs font-semibold text-foreground leading-relaxed pt-0.5">
        {toast.message}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:scale-95 transition-all shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Linear Decreasing Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/35">
        <div 
          className={cn("h-full rounded-r-full transition-all ease-linear", progressColors[toast.type])}
          style={{
            animation: `shrink-progress ${toast.duration || 5000}ms linear forwards`
          }}
        />
      </div>

      {/* Style Tag to support the keyframe animation easily without modifying global tailwind configs */}
      <style jsx global>{`
        @keyframes shrink-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}
