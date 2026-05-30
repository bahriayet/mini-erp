"use client"

import React, { useState } from "react"
import { ShieldAlert, PackageCheck, Download, X, Loader2, Calendar, User, Building, Info } from "lucide-react"
import { getProductMutations } from "@/app/actions/stockActions"

export interface InventoryItem {
  id: string
  branchId: string
  productId: string
  quantity: number
  reserved: number
  product: {
    id: string
    sku: string
    name: string
    category: string
    minStock: number
  }
  branch: {
    id: string
    name: string
  }
}

interface InventoryTableProps {
  inventoryList: InventoryItem[]
  isSuperAdmin: boolean
}

interface MutationAudit {
  id: string
  type: string
  quantity: number
  notes: string | null
  timestamp: string
  userName: string
  branchName: string
}

export default function InventoryTable({ inventoryList }: InventoryTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null)
  const [mutations, setMutations] = useState<MutationAudit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Fungsi Ekspor ke CSV
  const handleExportCSV = () => {
    if (inventoryList.length === 0) return

    // Header CSV
    const headers = ["SKU", "Nama Produk", "Kategori", "Gudang Cabang", "Limit Min", "Stok Fisik", "Reserved", "Tersedia", "Status"]
    
    // Baris data CSV
    const rows = inventoryList.map((item) => {
      const available = item.quantity - item.reserved
      const isLowStock = item.quantity <= item.product.minStock
      const status = isLowStock ? "Low Stock" : "Aman"

      return [
        item.product.sku,
        `"${item.product.name.replace(/"/g, '""')}"`, // Bungkus dengan kutip dua jika nama mengandung koma
        item.product.category,
        item.branch.name,
        item.product.minStock,
        item.quantity,
        item.reserved,
        available,
        status
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
    link.setAttribute("download", `laporan_inventaris_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 2. Fungsi Mengambil Riwayat Mutasi (Server Action) & Membuka Modal
  const handleOpenAuditTrail = async (productId: string, productName: string) => {
    setSelectedProduct({ id: productId, name: productName })
    setLoading(true)
    setError(null)
    setMutations([])

    try {
      const data = await getProductMutations(productId)
      setMutations(data)
    } catch (err) {
      setError("Gagal mengambil jejak audit produk.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tombol Aksi Laporan */}
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          disabled={inventoryList.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Ekspor Laporan (CSV)
        </button>
      </div>

      {/* Tabel Inventaris */}
      <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
        {inventoryList.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-xs text-muted-foreground">Tidak ada data stok inventaris saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-bold text-muted-foreground uppercase">
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Nama Produk (Klik untuk Audit)</th>
                  <th className="pb-3">Gudang Cabang</th>
                  <th className="pb-3 text-center">Limit Min</th>
                  <th className="pb-3 text-right">Stok Fisik</th>
                  <th className="pb-3 text-right">Reserved</th>
                  <th className="pb-3 text-right">Tersedia</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {inventoryList.map((item) => {
                  const available = item.quantity - item.reserved
                  const isLowStock = item.quantity <= item.product.minStock

                  return (
                    <tr key={item.id} className="text-foreground/95 hover:bg-secondary/15 transition-colors group">
                      <td className="py-4 font-mono text-xs tracking-wider text-muted-foreground">
                        {item.product.sku}
                      </td>
                      <td className="py-4 font-semibold">
                        <button
                          onClick={() => handleOpenAuditTrail(item.product.id, item.product.name)}
                          className="flex flex-col text-left hover:text-primary transition-colors cursor-pointer focus:outline-none group/btn"
                        >
                          <span className="group-hover/btn:underline">{item.product.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal mt-0.5 flex items-center gap-1">
                            Kategori: {item.product.category}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold text-[9px] ml-1 flex items-center gap-0.5">
                              <Info className="w-2.5 h-2.5" /> Lihat Audit
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="py-4 text-xs font-medium text-muted-foreground">
                        {item.branch.name}
                      </td>
                      <td className="py-4 text-center font-semibold text-muted-foreground">
                        {item.product.minStock}
                      </td>
                      <td className="py-4 text-right font-bold">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right font-semibold text-amber-500">
                        {item.reserved}
                      </td>
                      <td className={`py-4 text-right font-black ${
                        isLowStock ? "text-destructive" : "text-emerald-500"
                      }`}>
                        {available}
                      </td>
                      <td className="py-4 text-right">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                            <ShieldAlert className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                            <PackageCheck className="w-3 h-3" />
                            Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Audit Trail Jejak Perjalanan Produk */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl glass rounded-2xl shadow-2xl border border-border/80 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-card/45 backdrop-blur-sm">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  Jejak Audit & Histori Produk
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Modal */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loading ? (
                <div className="py-24 text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground font-semibold">Mengambil data audit trail...</p>
                </div>
              ) : error ? (
                <div className="py-12 text-center text-xs text-destructive font-semibold">
                  {error}
                </div>
              ) : mutations.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs font-bold text-foreground">Jejak Audit Bersih</p>
                  <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                    Belum ada riwayat mutasi masuk/keluar terdaftar untuk produk ini pada filter otorisasi Anda.
                  </p>
                </div>
              ) : (
                <div className="relative border-l border-border/80 pl-6 ml-3 space-y-8 py-2">
                  {mutations.map((item) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background ${
                        item.type === "IN" ? "bg-emerald-500" :
                        item.type === "OUT" ? "bg-rose-500" : "bg-amber-500"
                      }`} />

                      <div className="space-y-2">
                        {/* Judul Mutasi */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.type === "IN" ? "bg-emerald-500/10 text-emerald-500" :
                              item.type === "OUT" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {item.type}
                            </span>
                            Jumlah: {item.type === "OUT" ? "-" : "+"}{item.quantity} pcs
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(item.timestamp).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {/* Detail Aktor / Cabang */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-semibold">
                            <User className="w-3.5 h-3.5 text-indigo-500" /> {item.userName}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Building className="w-3.5 h-3.5 text-indigo-500" /> {item.branchName}
                          </span>
                        </div>

                        {/* Catatan (Jika ada) */}
                        {item.notes && (
                          <div className="p-3 bg-secondary/35 rounded-xl border border-border/40 text-[11px] leading-relaxed text-foreground/90 italic">
                            Catatan: "{item.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-border/60 bg-card/30 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl border border-border shadow-sm hover:bg-secondary/80 transition-all duration-200 cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
