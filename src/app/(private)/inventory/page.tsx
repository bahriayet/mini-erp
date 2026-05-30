import React from "react"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import InventoryFilters from "@/components/inventory/InventoryFilters"
import InventoryTable from "@/components/inventory/InventoryTable"

interface PageProps {
  searchParams: Promise<{
    search?: string
    branchId?: string
  }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const session = await auth()
  const user = session?.user

  if (!user) {
    redirect("/login")
  }

  // 1. Dapatkan parameter filter dari URL
  const { search, branchId: queryBranchId } = await searchParams

  // 2. Terapkan isolasi cabang berdasarkan peran
  const isSuperAdmin = user.role === "SUPER_ADMIN"
  const currentBranchId = isSuperAdmin ? (queryBranchId || undefined) : (user.branchId || undefined)

  // 3. Ambil daftar cabang jika pengguna adalah Super Admin (untuk dropdown filter)
  const branches = isSuperAdmin
    ? await prisma.branch.findMany({ select: { id: true, name: true } })
    : []

  // 4. Query data stok inventaris dengan filter dinamis
  const inventoryList = await prisma.inventory.findMany({
    where: {
      // Filter Cabang
      ...(currentBranchId ? { branchId: currentBranchId } : {}),
      // Filter Pencarian SKU / Nama Produk
      ...(search ? {
        product: {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } }
          ]
        }
      } : {})
    },
    include: {
      product: true,
      branch: true
    },
    orderBy: {
      product: {
        sku: "asc"
      }
    }
  })

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Stok Inventaris
        </h1>
        <p className="text-xs text-muted-foreground">
          Pantau stok riil, kuantitas reserved untuk logistik, dan limit minimum produk di seluruh cabang.
        </p>
      </header>

      {/* Filter Toolbar (Server Params & Client Component Sync) */}
      <InventoryFilters 
        branches={branches} 
        showBranchFilter={isSuperAdmin} 
      />

      {/* Tabel Inventaris Interaktif (Ekspor Laporan & Audit Trail) */}
      <InventoryTable 
        inventoryList={JSON.parse(JSON.stringify(inventoryList))} 
        isSuperAdmin={isSuperAdmin} 
      />
    </div>
  )
}
