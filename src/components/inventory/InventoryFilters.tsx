"use client"

import React, { useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal } from "lucide-react"

interface BranchOption {
  id: string
  name: string
}

interface InventoryFiltersProps {
  branches?: BranchOption[]
  showBranchFilter: boolean
}

export default function InventoryFilters({
  branches = [],
  showBranchFilter,
}: InventoryFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // State local untuk input pencarian
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams("search", searchValue)
  }

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams("branchId", e.target.value)
  }

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="p-4 rounded-2xl border border-border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md relative group">
        <input
          type="text"
          placeholder="Cari SKU atau Nama Produk..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-10 pr-16 py-2.5 bg-secondary/30 border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all cursor-pointer"
        >
          {isPending ? "Mencari..." : "Cari"}
        </button>
      </form>

      {/* Select Filters */}
      <div className="flex items-center gap-3">
        {showBranchFilter && branches.length > 0 && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <select
              value={searchParams.get("branchId") || ""}
              onChange={handleBranchChange}
              className="bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="">Semua Lokasi Gudang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
