import React from "react"
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import SidebarNav from "@/components/layouts/SidebarNav"
import { LogOut, User as UserIcon, Building2 } from "lucide-react"
import NotificationBell, { NotificationItem } from "@/components/layouts/NotificationBell"
import ThemeToggle from "@/components/layouts/ThemeToggle"

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Guard routing server-side
  if (!session?.user) {
    redirect("/login")
  }

  // Ambil nama cabang jika user terikat ke cabang tertentu
  let branchName = "Semua Cabang (Super Admin)"
  if (session.user.branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: session.user.branchId },
      select: { name: true }
    })
    if (branch) branchName = branch.name
  }

  // 1. Fetch low stock notifications in application memory (Prisma 7 cross-table limitation workaround)
  const allInventories = await prisma.inventory.findMany({
    where: session.user.branchId ? { branchId: session.user.branchId } : undefined,
    include: {
      product: { select: { name: true, sku: true, minStock: true } },
      branch: { select: { name: true } },
    },
  })

  const lowStockNotifications: NotificationItem[] = allInventories
    .filter((inv) => inv.quantity < inv.product.minStock)
    .map((inv) => ({
      id: inv.id,
      type: "low_stock",
      title: "Stok Menipis!",
      description: `${inv.product.name} (${inv.product.sku}) di ${inv.branch.name} tersisa ${inv.quantity} pcs (Min: ${inv.product.minStock}).`,
      href: "/inventory",
      timestamp: inv.updatedAt.toISOString(),
    }))

  // 2. Fetch pending transfer requests
  const pendingTransfers = await prisma.stockTransfer.findMany({
    where: {
      status: "PENDING",
      ...(session.user.role !== "SUPER_ADMIN" && session.user.branchId
        ? { destId: session.user.branchId }
        : {}),
    },
    include: {
      sourceBranch: { select: { name: true } },
      destBranch: { select: { name: true } },
    },
  })

  const transferNotifications: NotificationItem[] = pendingTransfers.map((t) => ({
    id: t.id,
    type: "pending_transfer",
    title: "Request Transfer Baru",
    description: `Request pengiriman barang dari ${t.sourceBranch.name} ke ${t.destBranch.name} memerlukan persetujuan Anda.`,
    href: "/transfers",
    timestamp: t.createdAt.toISOString(),
  }))

  const initialNotifications = [...lowStockNotifications, ...transferNotifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* SIDEBAR - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-md z-20">
        {/* Header Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
              N
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              Nexus ERP
            </span>
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {session.user.name}
              </h4>
              <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase mt-0.5">
                {session.user.role.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 px-2 text-xs text-muted-foreground">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            <span className="truncate font-medium">{branchName}</span>
          </div>
        </div>

        {/* Navigation Sidebar */}
        <div className="flex-1 py-4">
          <SidebarNav userRole={session.user.role} />
        </div>

        {/* Sign Out Button (Form Action Server-Side) */}
        <div className="p-4 border-t border-border">
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/10 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Keluar Sistem
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/20 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold">
              N
            </div>
            <span className="font-bold tracking-tight">Nexus ERP</span>
          </div>

          {/* Desktop/Mobile Info */}
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell initialNotifications={initialNotifications} />
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-foreground">
                {session.user.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {branchName}
              </span>
            </div>
          </div>
        </header>

        {/* CONTENT VIEW */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

