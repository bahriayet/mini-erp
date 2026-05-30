"use client"

import React, { useState, useTransition } from "react"
import { requestStockTransfer } from "@/app/actions/transferActions"
import { Loader2, Truck, ArrowRight } from "lucide-react"
import { useToast } from "@/components/providers/ToastProvider"

interface ProductOption {
  id: string
  name: string
  sku: string
}

interface BranchOption {
  id: string
  name: string
}

interface TransferFormProps {
  products: ProductOption[]
  branches: BranchOption[]
  userBranchId: string | null
  isSuperAdmin: boolean
  onSuccess?: () => void
}

export default function TransferForm({
  products,
  branches,
  userBranchId,
  isSuperAdmin,
  onSuccess,
}: TransferFormProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // State Form
  const [productId, setProductId] = useState("")
  const [sourceId, setSourceId] = useState(isSuperAdmin ? "" : (userBranchId || ""))
  const [destId, setDestId] = useState("")
  const [quantity, setQuantity] = useState<number>(0)
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId) {
      toast.warning("Silakan pilih produk yang akan ditransfer.")
      return
    }

    if (!sourceId) {
      toast.warning("Silakan pilih cabang asal pengiriman.")
      return
    }

    if (!destId) {
      toast.warning("Silakan pilih cabang tujuan penerimaan.")
      return
    }

    if (sourceId === destId) {
      toast.warning("Cabang tujuan tidak boleh sama dengan cabang asal.")
      return
    }

    if (quantity <= 0) {
      toast.warning("Kuantitas barang transfer harus lebih dari 0.")
      return
    }

    startTransition(async () => {
      try {
        const res = await requestStockTransfer({
          productId,
          sourceId,
          destId,
          quantity,
          notes,
        })

        if (res.success) {
          toast.success("Request transfer stok berhasil diajukan dengan status PENDING.")
          setQuantity(0)
          setNotes("")
          setProductId("")
          if (onSuccess) onSuccess()
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal mengajukan request transfer.")
      }
    })
  }

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-xl space-y-5">
      <header className="space-y-1">
        <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          Form Permintaan Transfer Barang
        </h3>
        <p className="text-[10px] text-muted-foreground">
          Stok barang di cabang asal akan dikunci sementara (Reserved) sampai disetujui cabang penerima.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabang Asal */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
            Cabang Asal (Pengirim)
          </label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            disabled={!isSuperAdmin || isPending}
            className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-75 cursor-pointer"
          >
            {isSuperAdmin && <option value="">Pilih Cabang Asal...</option>}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cabang Tujuan */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
            Cabang Tujuan (Penerima)
          </label>
          <select
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            disabled={isPending}
            className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value="">Pilih Cabang Tujuan...</option>
            {branches
              .filter((b) => b.id !== sourceId) // Sembunyikan cabang asal agar tidak bisa dipilih
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>

        {/* Pilihan Produk */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
            Produk Terlampir
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={isPending}
            className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value="">Pilih Produk...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.sku}] - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Kuantitas Barang */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
            Jumlah Kuantitas Transfer
          </label>
          <input
            type="number"
            min="1"
            value={quantity === 0 ? "" : quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={isPending}
            placeholder="Contoh: 25"
            className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Catatan */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
            Catatan Tambahan
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            placeholder="Keterangan pengiriman barang..."
            className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengajukan Request...
            </>
          ) : (
            <>
              Ajukan Transfer Stok
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
