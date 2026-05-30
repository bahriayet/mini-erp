"use client"

import React, { useState, useTransition } from "react"
import { createStockMutation } from "@/app/actions/stockActions"
import { PlusCircle, MinusCircle, Loader2, ArrowRight } from "lucide-react"
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

interface MutationFormProps {
  products: ProductOption[]
  branches: BranchOption[]
  userBranchId: string | null
  isSuperAdmin: boolean
}

export default function MutationForm({
  products,
  branches,
  userBranchId,
  isSuperAdmin,
}: MutationFormProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // State Form
  const [productId, setProductId] = useState("")
  const [branchId, setBranchId] = useState(isSuperAdmin ? "" : (userBranchId || ""))
  const [type, setType] = useState<"IN" | "OUT">("IN")
  const [quantity, setQuantity] = useState<number>(0)
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId) {
      toast.warning("Silakan pilih produk terlebih dahulu.")
      return
    }

    if (!branchId) {
      toast.warning("Silakan pilih lokasi gudang.")
      return
    }

    if (quantity <= 0) {
      toast.warning("Kuantitas barang harus lebih dari 0.")
      return
    }

    startTransition(async () => {
      try {
        const res = await createStockMutation({
          productId,
          branchId,
          type,
          quantity,
          notes,
        })

        if (res.success) {
          toast.success(`Berhasil mencatat mutasi stok ${type} sebanyak ${quantity} pcs.`)
          // Reset beberapa field form
          setQuantity(0)
          setNotes("")
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal mencatat mutasi stok.")
      }
    })
  }

  return (
    <div className="max-w-xl mx-auto p-6 md:p-8 rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-xl space-y-6">
      <header className="text-center space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Form Input Mutasi Stok
        </h2>
        <p className="text-xs text-muted-foreground">
          Masukkan detail stok masuk (Restok) atau stok keluar (Penjualan/Kerusakan) secara akurat.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pilihan Gudang Cabang (Hanya Super Admin yang bisa pilih) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            Lokasi Gudang / Cabang
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={!isSuperAdmin || isPending}
            className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-75 cursor-pointer"
          >
            {isSuperAdmin && <option value="">Pilih Gudang Cabang...</option>}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pilihan Produk */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            Produk (SKU)
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={isPending}
            className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value="">Pilih Produk...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.sku}] - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipe Mutasi Grid */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            Tipe Pergerakan Stok
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* Tipe IN */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => setType("IN")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                type === "IN"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-md shadow-emerald-500/5"
                  : "border-border bg-transparent text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Stok Masuk (IN)
            </button>

            {/* Tipe OUT */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => setType("OUT")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                type === "OUT"
                  ? "border-destructive bg-destructive/10 text-destructive shadow-md shadow-destructive/5"
                  : "border-border bg-transparent text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Stok Keluar (OUT)
            </button>
          </div>
        </div>

        {/* Kuantitas Barang */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            Jumlah Kuantitas (pcs)
          </label>
          <input
            type="number"
            min="1"
            value={quantity === 0 ? "" : quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={isPending}
            placeholder="Contoh: 50"
            className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Catatan / Keterangan */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            Catatan / Alasan Mutasi
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            placeholder="Contoh: Barang restok dari Supplier A / Penjualan retail harian..."
            className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses Transaksi...
            </>
          ) : (
            <>
              Catat Mutasi Stok
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
