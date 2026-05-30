import React from "react"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Package, Truck, ShieldAlert, TrendingUp, History } from "lucide-react"
import AnalyticsChart from "@/components/dashboard/AnalyticsChart"
import RecentMovementsList from "@/components/dashboard/RecentMovementsList"

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user

  // 1. Dapatkan Branch ID user jika terikat cabang
  const branchId = user?.branchId || undefined

  // 2. Query data real-time berbasis Role-Based Data Isolation
  // A. Total SKU Produk yang ada di cabang terkait (atau seluruh jika Super Admin)
  const productCount = await prisma.inventory.count({
    where: branchId ? { branchId } : undefined,
  })

  // B. Total Kuantitas Barang saat ini
  const inventoryAggregate = await prisma.inventory.aggregate({
    where: branchId ? { branchId } : undefined,
    _sum: {
      quantity: true,
    },
  })
  const totalStock = inventoryAggregate._sum.quantity || 0

  // C. Peringatan Stok Menipis (stok < minStock produk)
  const lowStockCount = (
    await prisma.inventory.findMany({
      where: branchId ? { branchId } : undefined,
      select: {
        quantity: true,
        product: {
          select: {
            minStock: true,
          },
        },
      },
    })
  ).filter((inv) => inv.quantity < inv.product.minStock).length

  // D. Pengiriman/Transfer Aktif (PENDING / IN_TRANSIT)
  const activeTransfersCount = await prisma.stockTransfer.count({
    where: {
      status: {
        in: ["PENDING", "IN_TRANSIT"],
      },
      OR: branchId
        ? [{ sourceId: branchId }, { destId: branchId }]
        : undefined,
    },
  })

  // E. Ambil Mutasi Stok Terakhir (Audit Logs)
  const recentMovements = await prisma.stockMovementItem.findMany({
    take: 5,
    orderBy: {
      movement: {
        timestamp: "desc",
      },
    },
    include: {
      product: true,
      movement: {
        include: {
          user: {
            include: {
              branch: true,
            },
          },
        },
      },
    },
  })

  // F. Ambil data agregasi mutasi per kategori produk untuk grafik analitik
  const allMovementItems = await prisma.stockMovementItem.findMany({
    take: 100,
    orderBy: {
      movement: {
        timestamp: "desc",
      },
    },
    include: {
      product: {
        select: {
          category: true,
        },
      },
      movement: {
        select: {
          type: true,
        },
      },
    },
  })

  // Agregasikan IN vs OUT berdasarkan kategori
  const categoryStatsMap: Record<string, { category: string; in: number; out: number }> = {}
  for (const item of allMovementItems) {
    const category = item.product.category || "Umum"
    if (!categoryStatsMap[category]) {
      categoryStatsMap[category] = { category, in: 0, out: 0 }
    }
    if (item.movement.type === "IN") {
      categoryStatsMap[category].in += item.quantity
    } else if (item.movement.type === "OUT") {
      categoryStatsMap[category].out += item.quantity
    }
  }
  const chartData = Object.values(categoryStatsMap).slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Halo, {user?.name}! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Berikut adalah ringkasan inventaris dan pergerakan logistik gudang saat ini.
        </p>
      </header>

      {/* METRIC CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total SKU */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Produk Aktif (SKU)
            </span>
            <h3 className="text-3xl font-bold text-foreground">
              {productCount}
            </h3>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Kuantitas */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Total Fisik Stok
            </span>
            <h3 className="text-3xl font-bold text-foreground">
              {totalStock} <span className="text-xs text-muted-foreground font-medium">pcs</span>
            </h3>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Transfer Aktif */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Pengiriman Aktif
            </span>
            <h3 className="text-3xl font-bold text-foreground">
              {activeTransfersCount}
            </h3>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Low Stock Warnings */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Peringatan Stok Menipis
            </span>
            <h3 className="text-3xl font-bold text-destructive">
              {lowStockCount}
            </h3>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 text-destructive animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* LOG MUTASI / RECENT MOVEMENTS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log Table (dengan Ekspor CSV) */}
        <RecentMovementsList recentMovements={JSON.parse(JSON.stringify(recentMovements))} />

        {/* Visual Analytics Chart */}
        <div className="lg:col-span-1">
          <AnalyticsChart data={chartData} />
        </div>
      </section>
    </div>
  )
}
