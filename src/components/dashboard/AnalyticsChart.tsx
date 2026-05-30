"use client"

import React, { useState } from "react"
import { BarChart3, TrendingUp, HelpCircle } from "lucide-react"

export interface ChartDataItem {
  category: string
  in: number
  out: number
}

interface AnalyticsChartProps {
  data: ChartDataItem[]
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{ category: string; type: "IN" | "OUT" } | null>(null)

  // Nilai default jika data kosong
  const displayData = data.length > 0 ? data : [
    { category: "Bahan Bangunan", in: 150, out: 90 },
    { category: "Kelistrikan", in: 220, out: 140 },
    { category: "Peralatan", in: 80, out: 110 }
  ]

  // Cari nilai maksimum untuk kalkulasi tinggi bar (skala persen)
  const maxVal = Math.max(
    ...displayData.map(item => Math.max(item.in, item.out, 10))
  )

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-sm space-y-6 flex flex-col h-full">
      {/* Header Grafik */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Tren Mutasi per Kategori
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/85" />
            <span className="text-muted-foreground">Stok Masuk (IN)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/85" />
            <span className="text-muted-foreground">Stok Keluar (OUT)</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col justify-end min-h-[220px] pt-4">
        {displayData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Tidak ada data mutasi yang cukup untuk ditampilkan.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 items-end h-full px-2">
            {displayData.map((item) => {
              // Hitung tinggi dalam persentase
              const inHeight = (item.in / maxVal) * 100
              const outHeight = (item.out / maxVal) * 100

              return (
                <div key={item.category} className="flex flex-col items-center gap-3 h-full justify-end group">
                  {/* Bars Container */}
                  <div className="flex items-end gap-2 w-full h-[180px] px-1 relative">
                    {/* Bar IN (Green) */}
                    <div 
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-600/70 to-emerald-500/90 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 transition-all duration-300 relative cursor-pointer group/bar shadow-sm shadow-emerald-500/10"
                      style={{ height: `${Math.max(inHeight, 5)}%` }}
                      onMouseEnter={() => setHoveredBar({ category: item.category, type: "IN" })}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {hoveredBar?.category === item.category && hoveredBar?.type === "IN" && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded-lg border border-border shadow-md z-30 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                          Masuk: +{item.in} pcs
                        </div>
                      )}
                    </div>

                    {/* Bar OUT (Red) */}
                    <div 
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-rose-600/70 to-rose-500/90 hover:from-rose-500 hover:to-rose-400 active:scale-95 transition-all duration-300 relative cursor-pointer group/bar shadow-sm shadow-rose-500/10"
                      style={{ height: `${Math.max(outHeight, 5)}%` }}
                      onMouseEnter={() => setHoveredBar({ category: item.category, type: "OUT" })}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {hoveredBar?.category === item.category && hoveredBar?.type === "OUT" && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded-lg border border-border shadow-md z-30 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                          Keluar: -{item.out} pcs
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Label Kategori */}
                  <span className="text-[10px] sm:text-xs font-bold text-muted-foreground group-hover:text-foreground text-center truncate w-full max-w-[80px] transition-colors" title={item.category}>
                    {item.category}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer / Insights */}
      <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground bg-secondary/10 px-4 py-2 rounded-xl">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span>Skala dinamis berbasis database riil.</span>
        </div>
        <div className="flex items-center gap-1 cursor-help" title="Arahkan kursor ke grafik batang untuk detail kuantitas.">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Detail</span>
        </div>
      </div>
    </div>
  )
}
