"use client"

import React, { useState, useTransition } from "react"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Package, 
  Building2, 
  Users, 
  Loader2, 
  Key, 
  Building,
  UserCheck
} from "lucide-react"
import { useToast } from "@/components/providers/ToastProvider"
import { 
  createProduct, updateProduct, deleteProduct,
  createBranch, updateBranch, deleteBranch,
  createUser, updateUser, deleteUser
} from "@/app/actions/adminActions"

// Types
interface Product {
  id: string
  sku: string
  name: string
  category: string
  basePrice: number
  minStock: number
}

interface Branch {
  id: string
  name: string
  address: string
  type: "WAREHOUSE" | "RETAIL_STORE" | "TRANSIT_HUB"
  isActive: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: "SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF"
  branchId: string | null
  branch: { name: string } | null
}

interface AdminDashboardProps {
  products: Product[]
  branches: Branch[]
  users: User[]
  currentUserId: string
}

export default function AdminDashboard({
  products,
  branches,
  users,
  currentUserId,
}: AdminDashboardProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<"products" | "branches" | "users">("products")
  
  // Search Filters
  const [prodSearch, setProdSearch] = useState("")
  const [branchSearch, setBranchSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")

  // Modal State Control
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  
  // Selected Master Items
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // 1. FORM STATES
  // Product Form
  const [prodSku, setProdSku] = useState("")
  const [prodName, setProdName] = useState("")
  const [prodCategory, setProdCategory] = useState("")
  const [prodPrice, setProdPrice] = useState<number>(0)
  const [prodMinStock, setProdMinStock] = useState<number>(5)

  // Branch Form
  const [branchName, setBranchName] = useState("")
  const [branchAddress, setBranchAddress] = useState("")
  const [branchType, setBranchType] = useState<"WAREHOUSE" | "RETAIL_STORE" | "TRANSIT_HUB">("WAREHOUSE")
  const [branchIsActive, setBranchIsActive] = useState<boolean>(true)

  // User Form
  const [uName, setUName] = useState("")
  const [uEmail, setUEmail] = useState("")
  const [uPassword, setUPassword] = useState("")
  const [uRole, setURole] = useState<"SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF">("STAFF")
  const [uBranchId, setUBranchId] = useState("")

  // Currency Formatter
  const formatIDR = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(price)
  }

  // RESET FORM FIELD HELPERS
  const resetForm = () => {
    // Products
    setProdSku("")
    setProdName("")
    setProdCategory("")
    setProdPrice(0)
    setProdMinStock(5)
    setSelectedProduct(null)

    // Branches
    setBranchName("")
    setBranchAddress("")
    setBranchType("WAREHOUSE")
    setBranchIsActive(true)
    setSelectedBranch(null)

    // Users
    setUName("")
    setUEmail("")
    setUPassword("")
    setURole("STAFF")
    setUBranchId("")
    setSelectedUser(null)
  }

  // TRIGGER MODAL FOR ADD MODE
  const triggerAddModal = () => {
    resetForm()
    setModalMode("add")
    setIsOpenModal(true)
  }

  // TRIGGER MODAL FOR EDIT MODE
  const triggerEditProduct = (p: Product) => {
    resetForm()
    setSelectedProduct(p)
    setProdSku(p.sku)
    setProdName(p.name)
    setProdCategory(p.category)
    setProdPrice(Number(p.basePrice))
    setProdMinStock(p.minStock)
    setModalMode("edit")
    setIsOpenModal(true)
  }

  const triggerEditBranch = (b: Branch) => {
    resetForm()
    setSelectedBranch(b)
    setBranchName(b.name)
    setBranchAddress(b.address)
    setBranchType(b.type)
    setBranchIsActive(b.isActive)
    setModalMode("edit")
    setIsOpenModal(true)
  }

  const triggerEditUser = (u: User) => {
    resetForm()
    setSelectedUser(u)
    setUName(u.name)
    setUEmail(u.email)
    setURole(u.role)
    setUBranchId(u.branchId || "")
    setUPassword("") // Kosong saat edit password opsional
    setModalMode("edit")
    setIsOpenModal(true)
  }

  // SUBMIT FORM DISPATCHERS
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!prodSku || !prodName || !prodCategory || prodPrice <= 0 || prodMinStock < 0) {
      toast.warning("Lengkapi seluruh kolom formulir produk dengan benar.")
      return
    }

    startTransition(async () => {
      try {
        if (modalMode === "add") {
          const res = await createProduct({
            sku: prodSku,
            name: prodName,
            category: prodCategory,
            basePrice: prodPrice,
            minStock: prodMinStock,
          })
          if (res.success) {
            toast.success(`Produk "${prodName}" berhasil ditambahkan!`)
            setIsOpenModal(false)
            resetForm()
          }
        } else if (modalMode === "edit" && selectedProduct) {
          const res = await updateProduct(selectedProduct.id, {
            name: prodName,
            category: prodCategory,
            basePrice: prodPrice,
            minStock: prodMinStock,
          })
          if (res.success) {
            toast.success(`Produk "${prodName}" berhasil diperbarui!`)
            setIsOpenModal(false)
            resetForm()
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan produk.")
      }
    })
  }

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!branchName || !branchAddress) {
      toast.warning("Lengkapi nama dan alamat gudang cabang.")
      return
    }

    startTransition(async () => {
      try {
        if (modalMode === "add") {
          const res = await createBranch({ 
            name: branchName, 
            address: branchAddress,
            type: branchType 
          })
          if (res.success) {
            toast.success(`Cabang "${branchName}" berhasil dibuka!`)
            setIsOpenModal(false)
            resetForm()
          }
        } else if (modalMode === "edit" && selectedBranch) {
          const res = await updateBranch(selectedBranch.id, {
            name: branchName,
            address: branchAddress,
            type: branchType,
            isActive: branchIsActive,
          })
          if (res.success) {
            toast.success(`Detail cabang "${branchName}" berhasil diperbarui!`)
            setIsOpenModal(false)
            resetForm()
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan cabang.")
      }
    })
  }

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!uName || !uEmail || (modalMode === "add" && !uPassword)) {
      toast.warning("Lengkapi kolom data karyawan secara lengkap.")
      return
    }

    if (uRole !== "SUPER_ADMIN" && !uBranchId) {
      toast.warning("Manajer Cabang dan Staff wajib ditautkan ke satu Cabang khusus.")
      return
    }

    startTransition(async () => {
      try {
        if (modalMode === "add") {
          const res = await createUser({
            name: uName,
            email: uEmail,
            password: uPassword,
            role: uRole,
            branchId: uRole === "SUPER_ADMIN" ? null : uBranchId,
          })
          if (res.success) {
            toast.success(`Akun karyawan "${uName}" berhasil didaftarkan!`)
            setIsOpenModal(false)
            resetForm()
          }
        } else if (modalMode === "edit" && selectedUser) {
          const res = await updateUser(selectedUser.id, {
            name: uName,
            email: uEmail,
            password: uPassword || undefined,
            role: uRole,
            branchId: uRole === "SUPER_ADMIN" ? null : uBranchId,
          })
          if (res.success) {
            toast.success(`Profil akun "${uName}" berhasil diperbarui!`)
            setIsOpenModal(false)
            resetForm()
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal memproses data pengguna.")
      }
    })
  }

  // DELETE DISPATCHERS
  const handleDeleteProduct = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"? Tindakan ini permanen.`)) return
    startTransition(async () => {
      try {
        const res = await deleteProduct(id)
        if (res.success) {
          toast.success(`Produk "${name}" berhasil dihapus dari sistem.`)
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal menghapus produk.")
      }
    })
  }

  const handleDeleteBranch = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menutup dan menghapus cabang "${name}"?`)) return
    startTransition(async () => {
      try {
        const res = await deleteBranch(id)
        if (res.success) {
          toast.success(`Cabang "${name}" berhasil dihapus dari sistem.`)
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal menutup cabang.")
      }
    })
  }

  const handleDeleteUser = (id: string, name: string) => {
    if (id === currentUserId) {
      toast.error("Anda tidak diperkenankan menghapus akun Anda sendiri.")
      return
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus akun karyawan "${name}"?`)) return
    startTransition(async () => {
      try {
        const res = await deleteUser(id)
        if (res.success) {
          toast.success(`Akun karyawan "${name}" berhasil dihapus.`)
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal menghapus karyawan.")
      }
    })
  }

  // FILTERED LISTS
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(prodSearch.toLowerCase())
  )

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.address.toLowerCase().includes(branchSearch.toLowerCase())
  )

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.branch?.name || "Pusat").toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 1. SELEKTOR TAB NAVIGASI & TOMBOL TAMBAH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/25 backdrop-blur-sm border border-border/80 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* Tab Produk */}
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Package className="w-4 h-4" />
            Master Produk ({products.length})
          </button>

          {/* Tab Cabang */}
          <button
            onClick={() => setActiveTab("branches")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === "branches"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Master Cabang ({branches.length})
          </button>

          {/* Tab Karyawan */}
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Master Karyawan ({users.length})
          </button>
        </div>

        {/* Action Button: Tambah Baru */}
        <button
          onClick={triggerAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-primary/20 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "products" && "Tambah Produk Baru"}
          {activeTab === "branches" && "Buka Cabang Baru"}
          {activeTab === "users" && "Daftarkan Karyawan"}
        </button>
      </div>

      {/* 2. AREA DATA MASTER */}
      <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-sm space-y-6">
        
        {/* PANEL: MASTER PRODUK */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari SKU, nama, atau kategori..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="w-full bg-secondary/35 border border-border rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Produk tidak ditemukan atau belum didaftarkan.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 font-bold text-muted-foreground uppercase">
                      <th className="pb-3 pl-2">SKU</th>
                      <th className="pb-3">Nama Produk</th>
                      <th className="pb-3">Kategori</th>
                      <th className="pb-3 text-right">Harga Dasar</th>
                      <th className="pb-3 text-center">Batas Minimum</th>
                      <th className="pb-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-primary">{p.sku}</td>
                        <td className="py-3 font-semibold text-foreground">{p.name}</td>
                        <td className="py-3 text-muted-foreground">{p.category}</td>
                        <td className="py-3 text-right font-bold text-foreground">{formatIDR(p.basePrice)}</td>
                        <td className="py-3 text-center font-bold text-muted-foreground">{p.minStock} pcs</td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => triggerEditProduct(p)}
                              title="Edit Detail"
                              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary/70 text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              title="Hapus Produk"
                              className="p-1.5 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive active:scale-90 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PANEL: MASTER CABANG */}
        {activeTab === "branches" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama gudang atau alamat..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                className="w-full bg-secondary/35 border border-border rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {filteredBranches.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Gudang cabang belum didaftarkan di sistem.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 font-bold text-muted-foreground uppercase">
                      <th className="pb-3 pl-2">Nama Cabang Gudang</th>
                      <th className="pb-3">Tipe Gudang</th>
                      <th className="pb-3">Alamat Operasional</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredBranches.map((b) => (
                      <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-foreground">{b.name}</td>
                        <td className="py-3.5">
                          <span className={`inline-block text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                            b.type === "WAREHOUSE" ? "bg-indigo-500/10 text-indigo-500" :
                            b.type === "RETAIL_STORE" ? "bg-teal-500/10 text-teal-600" :
                            "bg-slate-500/10 text-slate-500"
                          }`}>
                            {b.type === "WAREHOUSE" ? "GUDANG UTAMA" :
                             b.type === "RETAIL_STORE" ? "TOKO RETAIL" :
                             "PUSAT TRANSIT"}
                          </span>
                        </td>
                        <td className="py-3.5 text-muted-foreground max-w-xs truncate" title={b.address}>
                          {b.address}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-block text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                            b.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                          }`}>
                            {b.isActive ? "AKTIF" : "NON-AKTIF"}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => triggerEditBranch(b)}
                              title="Edit Cabang"
                              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary/70 text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(b.id, b.name)}
                              title="Hapus Cabang"
                              className="p-1.5 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive active:scale-90 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PANEL: MASTER KARYAWAN */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama, email, role, atau cabang..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-secondary/35 border border-border rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Akun karyawan tidak ditemukan.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 font-bold text-muted-foreground uppercase">
                      <th className="pb-3 pl-2">Nama Karyawan</th>
                      <th className="pb-3">Email Sistem</th>
                      <th className="pb-3">Role Otoritas</th>
                      <th className="pb-3">Cabang Tempat Kerja</th>
                      <th className="pb-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 pl-2 font-bold text-foreground flex items-center gap-1.5">
                          {u.name}
                          {u.id === currentUserId && (
                            <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">
                              ANDA
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3">
                          <span className={`inline-block text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                            u.role === "SUPER_ADMIN" ? "bg-primary/15 text-primary" :
                            u.role === "BRANCH_MANAGER" ? "bg-amber-500/15 text-amber-600" :
                            "bg-slate-500/15 text-slate-500"
                          }`}>
                            {u.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-foreground/90">
                          {u.role === "SUPER_ADMIN" ? (
                            <span className="text-muted-foreground italic font-normal">Semua Cabang (Pusat)</span>
                          ) : (
                            u.branch?.name || <span className="text-destructive font-bold text-[10px]">BELUM DITAUTKAN</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => triggerEditUser(u)}
                              title="Edit Profil"
                              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary/70 text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={u.id === currentUserId}
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              title="Hapus Karyawan"
                              className="p-1.5 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 3. MODAL CRUD DIALOG (GLASSMORPHISM) */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card/90 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <header className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                {activeTab === "products" && <Package className="w-5 h-5 text-primary" />}
                {activeTab === "branches" && <Building2 className="w-5 h-5 text-primary" />}
                {activeTab === "users" && <Users className="w-5 h-5 text-primary" />}
                {modalMode === "add" ? "Tambah" : "Edit"} Data {
                  activeTab === "products" ? "Produk" :
                  activeTab === "branches" ? "Cabang" : "Karyawan"
                }
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Silakan isi data master di bawah ini dengan lengkap dan teliti sebelum menyimpan.
              </p>
            </header>

            {/* MODAL FORM: MASTER PRODUK */}
            {activeTab === "products" && (
              <form onSubmit={handleProductSubmit} className="space-y-4">
                {/* SKU */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    SKU Produk (Sifat Unik)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === "edit" || isPending}
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="Contoh: SKU-CON-004"
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all disabled:opacity-65"
                  />
                </div>

                {/* Nama Produk */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPending}
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Contoh: Steel Bar 10mm"
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Kategori Barang
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPending}
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="Contoh: Bahan Bangunan / Kelistrikan"
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Grid Price & MinStock */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Harga */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Harga Dasar (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      disabled={isPending}
                      value={prodPrice === 0 ? "" : prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      placeholder="Contoh: 120000"
                      className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                    />
                  </div>

                  {/* Min Stock */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Batas Minimum Stok
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      disabled={isPending}
                      value={prodMinStock}
                      onChange={(e) => setProdMinStock(Number(e.target.value))}
                      placeholder="Contoh: 5"
                      className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 active:scale-95 disabled:opacity-50 transition-all cursor-pointer mt-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan Data...
                    </>
                  ) : (
                    "Simpan Data Produk"
                  )}
                </button>
              </form>
            )}

            {/* MODAL FORM: MASTER CABANG */}
            {activeTab === "branches" && (
              <form onSubmit={handleBranchSubmit} className="space-y-4">
                {/* Nama Cabang */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Nama Cabang Gudang
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPending}
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Contoh: Surabaya Distribution Hub"
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Tipe Cabang */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Tipe Gudang / Cabang
                  </label>
                  <select
                    value={branchType}
                    disabled={isPending}
                    onChange={(e) => setBranchType(e.target.value as any)}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="WAREHOUSE">Gudang Utama (Warehouse)</option>
                    <option value="RETAIL_STORE">Toko Retail (Retail Store)</option>
                    <option value="TRANSIT_HUB">Pusat Transit (Transit Hub)</option>
                  </select>
                </div>

                {/* Alamat Cabang */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Alamat Operasional Gudang
                  </label>
                  <textarea
                    rows={3}
                    required
                    disabled={isPending}
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    placeholder="Tulis alamat fisik gudang secara lengkap..."
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Status Cabang (Hanya saat edit) */}
                {modalMode === "edit" && (
                  <div className="flex items-center gap-2.5 py-1.5 bg-secondary/20 px-3.5 rounded-xl border border-border/40">
                    <input
                      type="checkbox"
                      id="branchIsActive"
                      checked={branchIsActive}
                      disabled={isPending}
                      onChange={(e) => setBranchIsActive(e.target.checked)}
                      className="w-4 h-4 text-primary bg-secondary/40 border-border rounded cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                    />
                    <label htmlFor="branchIsActive" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                      Gudang Cabang Aktif untuk Transaksi
                    </label>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 active:scale-95 disabled:opacity-50 transition-all cursor-pointer mt-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan Data...
                    </>
                  ) : (
                    "Simpan Data Cabang"
                  )}
                </button>
              </form>
            )}

            {/* MODAL FORM: MASTER KARYAWAN */}
            {activeTab === "users" && (
              <form onSubmit={handleUserSubmit} className="space-y-4">
                {/* Nama */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPending}
                    value={uName}
                    onChange={(e) => setUName(e.target.value)}
                    placeholder="Contoh: Andi Wijaya"
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Email Sistem
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isPending}
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                    placeholder="Contoh: andi@nexus.com"
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-muted-foreground" />
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Katasandi Akun {modalMode === "edit" && <span className="text-[9px] text-primary lowercase">(opsional jika diganti)</span>}
                    </label>
                  </div>
                  <input
                    type="password"
                    required={modalMode === "add"}
                    disabled={isPending}
                    value={uPassword}
                    onChange={(e) => setUPassword(e.target.value)}
                    placeholder={modalMode === "add" ? "Ketik katasandi minimal 6 karakter..." : "Biarkan kosong jika tidak diganti"}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Role Otoritas */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-muted-foreground" />
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Role Otoritas Sistem
                    </label>
                  </div>
                  <select
                    value={uRole}
                    disabled={isPending}
                    onChange={(e) => {
                      const role = e.target.value as any
                      setURole(role)
                      if (role === "SUPER_ADMIN") setUBranchId("")
                    }}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="STAFF">Staff Gudang</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                {/* Cabang Pengikatan (Hanya tampil jika role bukan Super Admin) */}
                {uRole !== "SUPER_ADMIN" && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-muted-foreground" />
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Cabang Tempat Kerja
                      </label>
                    </div>
                    <select
                      value={uBranchId}
                      required={true}
                      disabled={isPending}
                      onChange={(e) => setUBranchId(e.target.value)}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">Pilih Cabang Pengikatan...</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 active:scale-95 disabled:opacity-50 transition-all cursor-pointer mt-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan Data Karyawan...
                    </>
                  ) : (
                    "Simpan Data Karyawan"
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
