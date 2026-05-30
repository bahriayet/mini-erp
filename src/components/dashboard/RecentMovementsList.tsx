"use client"

import React from "react"
import { Download, History } from "lucide-react"

export interface MovementItem {
  id: string
  quantity: number
  product: {
    sku: string
    name: string
  }
  movement: {
    type: string
    timestamp: string
    user: {
      name: string
      branch: {
        name: string
      } | null
    }
  }
}

interface RecentMovementsListProps {
  recentMovements: MovementItem[]
}

export default function RecentMovementsList({ recentMovements }: RecentMovementsListProps) {
  
  const handleExportCSV = () => {
    if (recentMovements.length === 0) return

    // Header CSV
    const headers = ["Waktu", "SKU", "Nama Produk", "Tipe", "Jumlah", "User", "Cabang"]
    
    // Baris data CSV
    const rows = recentMovements.map((item) => {
      const type = item.movement.type
      const sign = type === "OUT" ? "-" : "+"
      const date = new Date(item.movement.timestamp).toLocaleString("id-ID", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })

      return [
        `"${date}"`,
        item.product.sku,
        `"${item.product.name.replace(/"/g, '""')}"`,
        type,
        `${sign}${item.quantity}`,
        `"${item.movement.user.name.replace(/"/g, '""')}"`,
        `"${item.movement.user.branch?.name || "Pusat"}"`
      ]
    })

    // Gabungkan header dan baris
    const csvContent = [headers, ...rows]
      .map((e) => e.join(","))
      .join("\n")

    // Buat Blob dan unduh otomatis di browser
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `riwayat_mutasi_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-sm space-y-6">
      {/* Header Log Mutasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-foreground">
            Aktivitas Mutasi Terkini (Audit Log)
          </h2>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={recentMovements.length === 0}
          className="flex items-center gap-2 px-3.5 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl border border-border shadow-sm hover:bg-secondary/80 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer w-fit"
        >
          <Download className="w-3.5 h-3.5 text-indigo-500" />
          Ekspor Mutasi (CSV)
        </button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        {recentMovements.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Belum ada aktivitas mutasi tercatat. Jalankan seeding database untuk melihat demo data mutasi.
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-xs font-bold text-muted-foreground uppercase">
                <th className="pb-3">Waktu</th>
                <th className="pb-3">Produk</th>
                <th className="pb-3 text-center">Tipe</th>
                <th className="pb-3 text-right">Jumlah</th>
                <th className="pb-3 text-right">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recentMovements.map((item) => (
                <tr key={item.id} className="text-foreground/95 hover:bg-secondary/20 transition-colors">
                  <td className="py-3.5 text-xs text-muted-foreground">
                    {new Date(item.movement.timestamp).toLocaleDateString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="py-3.5 font-semibold">
                    <div className="flex flex-col">
                      <span>{item.product.name}</span>
                      <span className="text-[10px] text-muted-foreground tracking-wider">{item.product.sku}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.movement.type === "IN" ? "bg-emerald-500/10 text-emerald-500" :
                      item.movement.type === "OUT" ? "bg-destructive/10 text-destructive" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>
                      {item.movement.type}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-bold">
                    {item.movement.type === "OUT" ? "-" : "+"}{item.quantity}
                  </td>
                  <td className="py-3.5 text-right text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.movement.user.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.movement.user.branch?.name || "Pusat"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
