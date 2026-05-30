"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell, ShieldAlert, Truck, Check } from "lucide-react"

export interface NotificationItem {
  id: string
  type: "low_stock" | "pending_transfer"
  title: string
  description: string
  href: string
  timestamp: Date | string
}

interface NotificationBellProps {
  initialNotifications: NotificationItem[]
}

export default function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sembunyikan dropdown ketika mengklik di luar area komponen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fungsi untuk menandai semua notifikasi sebagai dibaca (dibersihkan di client-side)
  const handleMarkAllRead = () => {
    setNotifications([])
  }

  // Hapus satu notifikasi tertentu
  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border border-border bg-card/40 backdrop-blur-sm hover:bg-secondary/40 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none ${
          notifications.length > 0 ? "text-primary" : "text-muted-foreground"
        }`}
        aria-label="Pusat Notifikasi"
      >
        <Bell className={`w-5 h-5 ${notifications.length > 0 ? "animate-[bounce_2s_infinite]" : ""}`} />
        
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-pulse shadow-sm">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 glass rounded-2xl shadow-xl border border-border/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-border/60 flex items-center justify-between bg-card/60 backdrop-blur-md">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Notifikasi Sistem
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-md">
                  {notifications.length} Baru
                </span>
              )}
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Bersihkan Semua
              </button>
            )}
          </div>

          {/* List Notifikasi */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">Semua Beres! 🎉</p>
                <p className="text-[10px] text-muted-foreground">Tidak ada peringatan atau pengiriman pending.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3.5 hover:bg-secondary/30 transition-colors relative group"
                >
                  <div className="flex gap-3">
                    {/* Icon Indikator */}
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 ${
                        item.type === "low_stock"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {item.type === "low_stock" ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>

                    {/* Deskripsi Teks */}
                    <div className="space-y-0.5 pr-4">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        {item.title}
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.type === "low_stock" ? "bg-destructive" : "bg-amber-500"
                        }`} />
                      </h4>
                      <p className="text-[11px] leading-relaxed text-muted-foreground pr-2">
                        {item.description}
                      </p>
                      <span className="inline-block text-[9px] text-muted-foreground pt-1">
                        {new Date(item.timestamp).toLocaleDateString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    {/* Tombol Dismiss */}
                    <button
                      onClick={(e) => handleDismiss(item.id, e)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary/60 rounded-md cursor-pointer"
                      title="Sembunyikan"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
