"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MovementType } from "@prisma/client"

export interface MutationInput {
  productId: string
  branchId: string
  type: "IN" | "OUT"
  quantity: number
  notes?: string
}

export async function createStockMutation(input: MutationInput) {
  const session = await auth()
  const user = session?.user

  if (!user) {
    throw new Error("Anda harus login untuk melakukan transaksi mutasi.")
  }

  const { productId, branchId, type, quantity, notes } = input

  // 1. Otorisasi Keamanan: Non-Admin tidak boleh memanipulasi cabang lain
  if (user.role !== "SUPER_ADMIN" && user.branchId !== branchId) {
    throw new Error("Anda tidak memiliki akses untuk mengubah stok cabang ini.")
  }

  if (quantity <= 0) {
    throw new Error("Jumlah kuantitas harus lebih besar dari 0.")
  }

  // 2. Bungkus proses dalam Database Transaction untuk mencegah inkonsistensi
  return await prisma.$transaction(async (tx) => {
    // A. Cari atau buat record stok inventaris di cabang terkait
    const inventory = await tx.inventory.findUnique({
      where: {
        branchId_productId: {
          branchId,
          productId,
        },
      },
    })

    if (type === "OUT") {
      // Validasi Stok Keluar
      if (!inventory) {
        throw new Error("Stok produk tidak ditemukan di cabang ini.")
      }

      const availableStock = inventory.quantity - inventory.reserved
      if (availableStock < quantity) {
        throw new Error(
          `Stok tidak mencukupi. Stok fisik: ${inventory.quantity}, Terkunci: ${inventory.reserved}, Tersedia: ${availableStock}.`
        );
      }

      // Kurangi stok riil
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { decrement: quantity },
        },
      })
    } else {
      // Proses Stok Masuk (IN)
      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: { increment: quantity },
          },
        })
      } else {
        // Jika produk belum pernah dimasukkan di cabang ini, buat entri baru
        await tx.inventory.create({
          data: {
            branchId,
            productId,
            quantity,
            reserved: 0,
          },
        })
      }
    }

    // B. Buat Record Audit Trail pada StockMovement
    const movement = await tx.stockMovement.create({
      data: {
        type: type === "IN" ? MovementType.IN : MovementType.OUT,
        userId: user.id,
        notes: notes || null,
        items: {
          create: {
            productId,
            quantity,
          },
        },
      },
    })

    // C. Revalidasi halaman agar perubahan stok langsung ter-render di Dashboard & Inventaris
    revalidatePath("/dashboard")
    revalidatePath("/inventory")

    return { success: true, movementId: movement.id }
  })
}

export async function getProductMutations(productId: string) {
  const session = await auth()
  const user = session?.user

  if (!user) {
    throw new Error("Anda harus login untuk mengakses data ini.")
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN"
  const branchId = user.branchId

  const mutations = await prisma.stockMovementItem.findMany({
    where: {
      productId,
      movement: {
        user: isSuperAdmin ? undefined : {
          branchId: branchId || null
        }
      }
    },
    include: {
      movement: {
        include: {
          user: {
            include: {
              branch: { select: { name: true } }
            }
          }
        }
      }
    },
    orderBy: {
      movement: {
        timestamp: "desc"
      }
    }
  })

  return mutations.map(item => ({
    id: item.id,
    type: item.movement.type as string,
    quantity: item.quantity,
    notes: item.movement.notes,
    timestamp: item.movement.timestamp.toISOString(),
    userName: item.movement.user.name,
    branchName: item.movement.user.branch?.name || "Pusat"
  }))
}
