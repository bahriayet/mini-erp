import React from "react"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import TransferForm from "@/components/transfers/TransferForm"
import TransferList from "@/components/transfers/TransferList"

export default async function TransfersPage() {
  const session = await auth()
  const user = session?.user

  if (!user) {
    redirect("/login")
  }

  // 1. Ambil daftar produk aktif untuk pengisian opsi dropdown
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
    },
    orderBy: {
      sku: "asc",
    },
  })

  // 2. Ambil daftar cabang (Otorisasi: Super Admin mendapatkan semua, Staff terisolasi ke cabang sendiri)
  const isSuperAdmin = user.role === "SUPER_ADMIN"
  const branches = isSuperAdmin
    ? await prisma.branch.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      })
    : await prisma.branch.findMany({
        where: {
          id: user.branchId || undefined,
          isActive: true
        },
        select: {
          id: true,
          name: true,
        },
      })

  // 3. Query daftar tiket transfer (Otorisasi: Hanya tampilkan transfer terkait cabang pengguna jika bukan Admin)
  const transfers = await prisma.stockTransfer.findMany({
    where: !isSuperAdmin && user.branchId
      ? {
          OR: [
            { sourceId: user.branchId },
            { destId: user.branchId }
          ]
        }
      : undefined,
    include: {
      sourceBranch: { select: { name: true } },
      destBranch: { select: { name: true } },
      items: {
        include: {
          product: { select: { sku: true, name: true } }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Logistik & Transfer Cabang
        </h1>
        <p className="text-xs text-muted-foreground">
          Kelola sirkulasi perpindahan stok antar cabang gudang dengan alur persetujuan terstruktur dan jejak audit aman.
        </p>
      </header>

      {/* Grid Layout Layout Dua Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom Kiri: Daftar Transfer Aktif (Mengambil 2/3 ruang) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider text-muted-foreground">
            Daftar Tiket Pengiriman
          </h3>
          <TransferList 
            transfers={transfers as any} 
            userBranchId={user.branchId} 
            userRole={user.role} 
          />
        </div>

        {/* Kolom Kanan: Form Pengajuan Pengiriman (Mengambil 1/3 ruang) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider text-muted-foreground">
            Buat Pengiriman Baru
          </h3>
          <TransferForm 
            products={products}
            branches={branches}
            userBranchId={user.branchId}
            isSuperAdmin={isSuperAdmin}
          />
        </div>
      </div>
    </div>
  )
}
