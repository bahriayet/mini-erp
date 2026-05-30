import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import AdminDashboard from "@/components/admin/AdminDashboard"

export default async function AdminPage() {
  const session = await auth()
  const user = session?.user

  // Keamanan server-side: Hanya boleh dimasuki oleh Super Admin
  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  // 1. Fetch seluruh data master untuk dikelola
  const products = await prisma.product.findMany({
    orderBy: {
      sku: "asc",
    },
  })

  const branches = await prisma.branch.findMany({
    orderBy: {
      name: "asc",
    },
  })

  const users = await prisma.user.findMany({
    include: {
      branch: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Serialisasi data agar aman dari hydration/Decimal serialization errors pada Client Component
  const serializedProducts = JSON.parse(JSON.stringify(products))
  const serializedBranches = JSON.parse(JSON.stringify(branches))
  const serializedUsers = JSON.parse(JSON.stringify(users))

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Pengaturan Data Master
        </h1>
        <p className="text-xs text-muted-foreground">
          Kelola entitas inti gudang, penyesuaian SKU produk, alamat cabang, registrasi akun karyawan, dan pembagian otoritas RBAC.
        </p>
      </header>

      {/* Rander Dashboard Master Panel */}
      <AdminDashboard
        products={serializedProducts}
        branches={serializedBranches}
        users={serializedUsers}
        currentUserId={user.id}
      />
    </div>
  )
}
