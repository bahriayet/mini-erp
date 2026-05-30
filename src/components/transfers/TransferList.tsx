"use client"

import React, { useState, useTransition } from "react"
import { processTransferStatus } from "@/app/actions/transferActions"
import { 
  ArrowRight, 
  Check, 
  X, 
  Truck, 
  PackageCheck, 
  AlertTriangle,
  Clock
} from "lucide-react"
import { useToast } from "@/components/providers/ToastProvider"

// Types matching database relation shape
interface TransferItem {
  id: string
  productId: string
  quantitySent: number
  quantityRecv: number | null
  product: {
    sku: string
    name: string
  }
}

interface TransferData {
  id: string
  sourceId: string
  destId: string
  status: "PENDING" | "IN_TRANSIT" | "COMPLETED" | "REJECTED"
  notes: string | null
  createdAt: Date
  sourceBranch: { name: string }
  destBranch: { name: string }
  items: TransferItem[]
}

interface TransferListProps {
  transfers: TransferData[]
  userBranchId: string | null
  userRole: string
}

export default function TransferList({
  transfers,
  userBranchId,
  userRole,
}: TransferListProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  
  // State khusus untuk menampung kuantitas terima aktual per transfer
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({})

  const isSuperAdmin = userRole === "SUPER_ADMIN"

  const handleAction = (
    transferId: string,
    action: "APPROVE" | "REJECT" | "COMPLETE"
  ) => {
    const qty = receivedQtys[transferId]

    startTransition(async () => {
      try {
        const res = await processTransferStatus(transferId, action, qty)
        if (res.success) {
          if (action === "APPROVE") {
            toast.success("Transfer stok berhasil disetujui & berstatus IN TRANSIT.")
          } else if (action === "REJECT") {
            toast.warning("Transfer stok berhasil ditolak (REJECTED).")
          } else if (action === "COMPLETE") {
            toast.success("Konfirmasi penerimaan barang sukses dicatat!")
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal memproses transaksi.")
      }
    })
  }

  const handleQtyChange = (transferId: string, val: number, max: number) => {
    if (val < 0) val = 0
    if (val > max) val = max
    setReceivedQtys(prev => ({
      ...prev,
      [transferId]: val
    }))
  }

  return (
    <div className="space-y-4">

      {transfers.length === 0 ? (
        <div className="py-16 text-center border border-border bg-card/25 rounded-2xl space-y-3">
          <Truck className="w-10 h-10 text-muted-foreground/60 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">
            Tidak Ada Logistik Aktif
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Belum ada pengiriman barang masuk atau keluar yang tercatat di sistem saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {transfers.map((t) => {
            const item = t.items[0]
            if (!item) return null

            // Kroscek otoritas pengguna terhadap tiket ini
            const isDestinationBranch = userBranchId === t.destId
            const canApproveOrReject = (isSuperAdmin || isDestinationBranch) && t.status === "PENDING"
            const canConfirmReceipt = (isSuperAdmin || isDestinationBranch) && t.status === "IN_TRANSIT"

            // Default kuantitas terima ke kuantitas kirim jika belum diubah
            const currentRecvQty = receivedQtys[t.id] !== undefined ? receivedQtys[t.id] : item.quantitySent

            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Info Produk & Cabang */}
                <div className="space-y-3 flex-1">
                  <header className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ID: {t.id.slice(0, 8).toUpperCase()}...
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      • {new Date(t.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    
                    {/* Status Badge */}
                    <span className={`ml-auto md:ml-0 inline-flex items-center gap-1 text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                      t.status === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                      t.status === "IN_TRANSIT" ? "bg-sky-500/10 text-sky-500 animate-pulse" :
                      t.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {t.status === "IN_TRANSIT" && <Truck className="w-2.5 h-2.5" />}
                      {t.status === "COMPLETED" && <PackageCheck className="w-2.5 h-2.5" />}
                      {t.status === "PENDING" && <Clock className="w-2.5 h-2.5" />}
                      {t.status}
                    </span>
                  </header>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">
                      {item.product.name}
                    </h4>
                    <span className="text-[10px] text-muted-foreground tracking-wider font-semibold uppercase">
                      SKU: {item.product.sku}
                    </span>
                  </div>

                  {/* Alur Pengiriman */}
                  <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground pt-1">
                    <span className="text-foreground">{t.sourceBranch.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground">{t.destBranch.name}</span>
                  </div>

                  {t.notes && (
                    <p className="text-[10px] italic text-muted-foreground bg-secondary/20 p-2 rounded-lg border border-border/40">
                      Catatan: "{t.notes}"
                    </p>
                  )}
                </div>

                {/* Kuantitas & Aksi */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-5">
                  
                  {/* Info Jumlah Barang */}
                  <div className="text-left md:text-right space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Jumlah Transfer
                    </span>
                    <div className="text-sm font-bold text-foreground">
                      {t.status === "COMPLETED" ? (
                        <>
                          Diterima: <span className="text-emerald-500 font-black">{item.quantityRecv}</span>
                          <span className="text-xs text-muted-foreground font-normal"> / dari {item.quantitySent} pcs</span>
                        </>
                      ) : (
                        <span className="text-primary font-black">{item.quantitySent} <span className="text-xs text-muted-foreground font-normal">pcs</span></span>
                      )}
                    </div>
                  </div>

                  {/* Tombol Aksi Reaktif (RBAC Guarded) */}
                  <div className="flex items-center gap-2">
                    {/* Aksi PENDING: Setujui & Kirim / Tolak */}
                    {canApproveOrReject && (
                      <>
                        <button
                          disabled={isPending}
                          onClick={() => handleAction(t.id, "REJECT")}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 text-xs font-bold rounded-xl active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Tolak
                        </button>

                        <button
                          disabled={isPending}
                          onClick={() => handleAction(t.id, "APPROVE")}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl active:scale-95 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Setujui & Kirim
                        </button>
                      </>
                    )}

                    {/* Aksi IN_TRANSIT: Konfirmasi Terima dengan Input Selisih */}
                    {canConfirmReceipt && (
                      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase shrink-0">
                            Diterima:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantitySent}
                            value={currentRecvQty}
                            disabled={isPending}
                            onChange={(e) => handleQtyChange(t.id, Number(e.target.value), item.quantitySent)}
                            className="w-16 bg-secondary/50 border border-border rounded-lg px-2 py-1 text-xs font-bold text-center outline-none focus:border-primary"
                          />
                        </div>

                        <button
                          disabled={isPending}
                          onClick={() => handleAction(t.id, "COMPLETE")}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl active:scale-95 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          Konfirmasi Terima
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
