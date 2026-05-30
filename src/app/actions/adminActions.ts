"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { Role, BranchType } from "@prisma/client"

/**
 * Helper to enforce Super Admin role guard server-side.
 */
async function enforceSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Otorisasi gagal: Hanya Super Admin yang diizinkan mengelola data master.")
  }
  return session
}

// ==========================================
// 📦 PRODUCT ACTIONS (CRUD PRODUK)
// ==========================================

export async function createProduct(data: {
  sku: string
  name: string
  category: string
  basePrice: number
  minStock: number
}) {
  await enforceSuperAdmin()

  // Format SKU to uppercase
  const formattedSku = data.sku.trim().toUpperCase()

  // Check unique SKU
  const existingProduct = await prisma.product.findUnique({
    where: { sku: formattedSku }
  })
  if (existingProduct) {
    throw new Error(`SKU "${formattedSku}" sudah terdaftar di sistem. Gunakan SKU lain.`)
  }

  // Create Product in Transaction
  const newProduct = await prisma.$transaction(async (tx) => {
    const prod = await tx.product.create({
      data: {
        sku: formattedSku,
        name: data.name.trim(),
        category: data.category.trim(),
        basePrice: data.basePrice,
        minStock: data.minStock,
      }
    })

    // Auto-sync: Create 0 physical inventory for all existing branches
    const branches = await tx.branch.findMany({ select: { id: true } })
    if (branches.length > 0) {
      await tx.inventory.createMany({
        data: branches.map((b) => ({
          branchId: b.id,
          productId: prod.id,
          quantity: 0,
          reserved: 0,
        }))
      })
    }

    return prod
  })

  revalidatePath("/")
  return { success: true, product: newProduct }
}

export async function updateProduct(
  id: string,
  data: {
    name: string
    category: string
    basePrice: number
    minStock: number
  }
) {
  await enforceSuperAdmin()

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name: data.name.trim(),
      category: data.category.trim(),
      basePrice: data.basePrice,
      minStock: data.minStock,
    }
  })

  revalidatePath("/")
  return { success: true, product: updatedProduct }
}

export async function deleteProduct(id: string) {
  await enforceSuperAdmin()

  // Guard database reference constraints: check if referenced in movements or transfers
  const isReferencedInMovement = await prisma.stockMovementItem.findFirst({
    where: { productId: id }
  })
  const isReferencedInTransfer = await prisma.stockTransferItem.findFirst({
    where: { productId: id }
  })

  if (isReferencedInMovement || isReferencedInTransfer) {
    throw new Error(
      "Produk tidak dapat dihapus karena sudah memiliki riwayat mutasi / pengiriman logistik aktif di database."
    )
  }

  // Safe to delete inventories and the product in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.inventory.deleteMany({ where: { productId: id } })
    await tx.product.delete({ where: { id } })
  })

  revalidatePath("/")
  return { success: true }
}

// ==========================================
// 🏢 BRANCH ACTIONS (CRUD CABANG)
// ==========================================

export async function createBranch(data: { name: string; address: string; type: BranchType }) {
  await enforceSuperAdmin()

  const trimmedName = data.name.trim()

  // Check unique branch name
  const existingBranch = await prisma.branch.findUnique({
    where: { name: trimmedName }
  })
  if (existingBranch) {
    throw new Error(`Nama Cabang "${trimmedName}" sudah terdaftar di sistem.`)
  }

  // Create Branch in Transaction
  const newBranch = await prisma.$transaction(async (tx) => {
    const branch = await tx.branch.create({
      data: {
        name: trimmedName,
        address: data.address.trim(),
        type: data.type,
      }
    })

    // Auto-sync: Create 0 inventory for all existing products in this branch
    const products = await tx.product.findMany({ select: { id: true } })
    if (products.length > 0) {
      await tx.inventory.createMany({
        data: products.map((p) => ({
          branchId: branch.id,
          productId: p.id,
          quantity: 0,
          reserved: 0,
        }))
      })
    }

    return branch
  })

  revalidatePath("/")
  return { success: true, branch: newBranch }
}

export async function updateBranch(
  id: string,
  data: { name: string; address: string; type: BranchType; isActive: boolean }
) {
  await enforceSuperAdmin()

  const updatedBranch = await prisma.branch.update({
    where: { id },
    data: {
      name: data.name.trim(),
      address: data.address.trim(),
      type: data.type,
      isActive: data.isActive,
    }
  })

  revalidatePath("/")
  return { success: true, branch: updatedBranch }
}

export async function deleteBranch(id: string) {
  await enforceSuperAdmin()

  // Guard database reference constraints:
  // 1. Check if employees are assigned to the branch
  const userCount = await prisma.user.count({ where: { branchId: id } })
  if (userCount > 0) {
    throw new Error("Cabang tidak dapat dihapus karena masih memiliki staf/karyawan yang terikat.")
  }

  // 2. Check if active transfers refer to the branch
  const hasTransfers = await prisma.stockTransfer.findFirst({
    where: {
      OR: [{ sourceId: id }, { destId: id }]
    }
  })
  if (hasTransfers) {
    throw new Error("Cabang tidak dapat dihapus karena memiliki riwayat tiket pengiriman logistik.")
  }

  // Safe to delete in transaction
  await prisma.$transaction(async (tx) => {
    await tx.inventory.deleteMany({ where: { branchId: id } })
    await tx.branch.delete({ where: { id } })
  })

  revalidatePath("/")
  return { success: true }
}

// ==========================================
// 👥 USER ACTIONS (CRUD KARYAWAN)
// ==========================================

export async function createUser(data: {
  name: string
  email: string
  password?: string
  role: Role
  branchId?: string | null
}) {
  const session = await enforceSuperAdmin()

  const trimmedEmail = data.email.trim().toLowerCase()

  // Check unique email
  const existingUser = await prisma.user.findUnique({
    where: { email: trimmedEmail }
  })
  if (existingUser) {
    throw new Error(`Email "${trimmedEmail}" sudah digunakan oleh pengguna lain.`)
  }

  // Password hashing
  const defaultPassword = data.password || "karyawan123"
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  const newUser = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role: data.role,
      branchId: data.role === "SUPER_ADMIN" ? null : (data.branchId || null),
    }
  })

  revalidatePath("/")
  return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } }
}

export async function updateUser(
  id: string,
  data: {
    name: string
    email: string
    password?: string
    role: Role
    branchId?: string | null
  }
) {
  await enforceSuperAdmin()

  const trimmedEmail = data.email.trim().toLowerCase()

  // Check unique email
  const existingUser = await prisma.user.findFirst({
    where: {
      email: trimmedEmail,
      NOT: { id }
    }
  })
  if (existingUser) {
    throw new Error(`Email "${trimmedEmail}" sudah digunakan oleh pengguna lain.`)
  }

  // Prepare database updates
  const updateData: any = {
    name: data.name.trim(),
    email: trimmedEmail,
    role: data.role,
    branchId: data.role === "SUPER_ADMIN" ? null : (data.branchId || null),
  }

  // If password is changed, hash it
  if (data.password && data.password.trim() !== "") {
    updateData.password = await bcrypt.hash(data.password, 10)
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData
  })

  revalidatePath("/")
  return { success: true, user: { id: updatedUser.id, name: updatedUser.name } }
}

export async function deleteUser(id: string) {
  const session = await enforceSuperAdmin()

  // Guard: Current Super Admin cannot delete their own active login account
  if (session.user.id === id) {
    throw new Error("Anda tidak diizinkan menghapus akun Anda sendiri yang sedang aktif digunakan.")
  }

  // Guard database reference constraint: Check if user has logged movements
  const loggedMovementCount = await prisma.stockMovement.count({
    where: { userId: id }
  })
  if (loggedMovementCount > 0) {
    throw new Error(
      "Karyawan ini memiliki jejak audit transaksi mutasi barang dan tidak dapat dihapus demi kepatuhan riwayat audit."
    )
  }

  await prisma.user.delete({
    where: { id }
  })

  revalidatePath("/")
  return { success: true }
}
