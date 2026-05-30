import React from "react"

export default function PrivateLoading() {
  return (
    <div className="space-y-8 select-none pointer-events-none">
      {/* Header Halaman Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-secondary/80 rounded-2xl animate-pulse" />
        <div className="h-4 w-80 bg-secondary/40 rounded-xl animate-pulse mt-1" />
      </div>

      {/* METRIC CARDS SKELETON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="p-6 rounded-2xl border border-border bg-card/25 backdrop-blur-sm flex items-center justify-between shadow-sm animate-pulse"
          >
            <div className="space-y-3 flex-1">
              <div className="h-3.5 w-24 bg-secondary/60 rounded-md" />
              <div className="h-8 w-16 bg-secondary/80 rounded-xl" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/50 shrink-0 ml-4" />
          </div>
        ))}
      </div>

      {/* MAIN CONTENT / TABLES GRID SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Kolom Kiri: Tabel Tiruan (2/3 lebar) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card/25 backdrop-blur-sm shadow-sm space-y-6 animate-pulse">
          <div className="flex items-center justify-between pb-2">
            <div className="h-5 w-44 bg-secondary/70 rounded-lg" />
            <div className="h-8 w-32 bg-secondary/55 rounded-xl" />
          </div>
          
          <div className="space-y-4">
            {/* Header Kolom Palsu */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="h-3 w-16 bg-secondary/65 rounded" />
              <div className="h-3 w-32 bg-secondary/65 rounded" />
              <div className="h-3 w-12 bg-secondary/65 rounded" />
              <div className="h-3 w-20 bg-secondary/65 rounded" />
            </div>

            {/* Baris-baris Data Palsu */}
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border/10">
                <div className="h-3.5 w-20 bg-secondary/50 rounded" />
                <div className="space-y-1.5 flex-1 max-w-[200px] mx-8">
                  <div className="h-3.5 w-full bg-secondary/70 rounded-md" />
                  <div className="h-2.5 w-2/3 bg-secondary/45 rounded-sm" />
                </div>
                <div className="h-3.5 w-10 bg-secondary/55 rounded" />
                <div className="h-3.5 w-24 bg-secondary/50 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Detail Tiruan / Form Palsu (1/3 lebar) */}
        <div className="p-6 rounded-2xl border border-border bg-card/25 backdrop-blur-sm shadow-sm space-y-6 animate-pulse">
          <div className="space-y-2 pb-2">
            <div className="h-5 w-36 bg-secondary/70 rounded-lg" />
            <div className="h-3 w-48 bg-secondary/40 rounded-sm" />
          </div>

          <div className="space-y-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-secondary/65 rounded" />
                <div className="h-10 w-full bg-secondary/50 rounded-xl" />
              </div>
            ))}
            <div className="h-11 w-full bg-secondary/70 rounded-xl pt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
