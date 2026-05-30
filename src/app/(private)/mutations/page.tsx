import React from "react"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import MutationForm from "@/components/mutations/MutationForm"

export default async function MutationsPage() {
  const session = await auth()
  const user = session?.user

  if (!user) {
    redirect("/login")
  }

  // 1. Ambil daftar produk aktif untuk pengisian opsi dropdown SKU
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true
    },
    orderBy: {
      sku: "asc"
    }
  })

  // 2. Ambil daftar cabang (Super Admin mendapatkan semua cabang, user biasa terisolasi ke cabangnya sendiri)
  const isSuperAdmin = user.role === "SUPER_ADMIN"
  const branches = isSuperAdmin
    ? await prisma.branch.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: "asc"
        }
      })
    : await prisma.branch.findMany({
        where: {
          id: user.branchId || undefined,
          isActive: true
        },
        select: {
          id: true,
          name: true
        }
      })

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Mutasi Barang
        </h1>
        <p className="text-xs text-muted-foreground">
          Input transaksi penambahan stok masuk (IN) atau pencatatan barang terjual/rusak (OUT) langsung ke sistem database.
        </p>
      </header>

      {/* Render Component Form Mutasi */}
      <MutationForm 
        products={products}
        branches={branches}
        userBranchId={user.branchId}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}
