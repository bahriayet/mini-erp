"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Warehouse, ArrowLeftRight, Truck, Sliders } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarNavProps {
  userRole?: string
}

export default function SidebarNav({ userRole }: SidebarNavProps) {
  const pathname = usePathname()

  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/inventory",
      label: "Inventaris Stok",
      icon: Warehouse,
    },
    {
      href: "/mutations",
      label: "Mutasi Barang",
      icon: ArrowLeftRight,
    },
    {
      href: "/transfers",
      label: "Transfer Cabang",
      icon: Truck,
    },
  ]

  // Tambahkan menu Admin jika penggunanya adalah Super Admin
  if (userRole === "SUPER_ADMIN") {
    links.push({
      href: "/admin",
      label: "Kelola Data Master",
      icon: Sliders,
    })
  }

  return (
    <nav className="space-y-1.5 px-3">
      {links.map((link) => {
        const isActive = pathname === link.href
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden",
              isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary/55 hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
              isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
            )} />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
