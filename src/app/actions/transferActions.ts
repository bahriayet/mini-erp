"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TransferStatus, MovementType } from "@prisma/client"

export interface TransferRequestInput {
  productId: string
  sourceId: string
  destId: string
  quantity: number
  notes?: string
}

/**
 * 1. AJUKAN REQUEST TRANSFER (PENDING)
 * Mengunci stok fisik di cabang asal dengan menaikkan kolom 'reserved'
 */
export async function requestStockTransfer(input: TransferRequestInput) {
  const session = await auth()
  const user = session?.user

  if (!user) {
    throw new Error("Anda harus login untuk melakukan transaksi.")
  }

  const { productId, sourceId, destId, quantity, notes } = input

  if (sourceId === destId) {
    throw new Error("Gudang cabang asal dan tujuan tidak boleh sama.")
  }

  if (quantity <= 0) {
    throw new Error("Kuantitas barang transfer harus lebih dari 0.")
  }

  // Otorisasi Keamanan: Non-Admin hanya bisa mengirim dari cabangnya sendiri
  if (user.role !== "SUPER_ADMIN" && user.branchId !== sourceId) {
    throw new Error("Anda hanya bisa mengajukan pengiriman barang dari cabang Anda sendiri.")
  }

  return await prisma.$transaction(async (tx) => {
    // A. Periksa apakah stok di cabang asal mencukupi
    const sourceInv = await tx.inventory.findUnique({
      where: {
        branchId_productId: {
          branchId: sourceId,
          productId,
        },
      },
    })

    if (!sourceInv) {
      throw new Error("Produk belum terdaftar atau tidak memiliki stok di cabang asal.")
    }

    const availableStock = sourceInv.quantity - sourceInv.reserved
    if (availableStock < quantity) {
      throw new Error(
        `Stok tersedia tidak mencukupi untuk transfer. Stok fisik: ${sourceInv.quantity}, Terkunci: ${sourceInv.reserved}, Tersedia: ${availableStock}.`
      )
    }

    // B. Kunci stok dengan menaikkan nilai 'reserved' di cabang asal
    await tx.inventory.update({
      where: { id: sourceInv.id },
      data: {
        reserved: { increment: quantity },
      },
    })

    // C. Buat tiket request transfer stok berstatus PENDING
    const transfer = await tx.stockTransfer.create({
      data: {
        sourceId,
        destId,
        status: TransferStatus.PENDING,
        notes: notes || null,
        items: {
          create: {
            productId,
            quantitySent: quantity,
          },
        },
      },
    })

    revalidatePath("/inventory")
    revalidatePath("/dashboard")
    return { success: true, transferId: transfer.id }
  })
}

/**
 * 2. PROSES UPDATE STATUS TRANSFER (APPROVE, REJECT, atau COMPLETE)
 * Menggunakan Prisma Transaction untuk menjaga konkurensi database
 */
export async function processTransferStatus(
  transferId: string,
  action: "APPROVE" | "REJECT" | "COMPLETE",
  receivedQty?: number
) {
  const session = await auth()
  const user = session?.user

  if (!user) {
    throw new Error("Anda harus login untuk memproses transaksi.")
  }

  return await prisma.$transaction(async (tx) => {
    // A. Ambil detail tiket transfer beserta itemnya
    const transfer = await tx.stockTransfer.findUnique({
      where: { id: transferId },
      include: { items: true },
    })

    if (!transfer) {
      throw new Error("Data tiket transfer tidak ditemukan.")
    }

    const item = transfer.items[0] // Ambil item pertama (mini ERP single-item per transfer)
    if (!item) {
      throw new Error("Tidak ada barang terlampir di tiket transfer ini.")
    }

    // B. PROSES AKSI: REJECT (Tolak Transfer)
    if (action === "REJECT") {
      if (transfer.status !== TransferStatus.PENDING) {
        throw new Error("Hanya tiket berstatus PENDING yang bisa ditolak.")
      }

      // Otorisasi: Hanya cabang tujuan (penerima) atau Super Admin yang bisa menolak
      if (user.role !== "SUPER_ADMIN" && user.branchId !== transfer.destId) {
        throw new Error("Hanya cabang penerima barang yang berhak menolak transfer ini.")
      }

      // Kembalikan stok 'reserved' di cabang asal
      await tx.inventory.update({
        where: {
          branchId_productId: {
            branchId: transfer.sourceId,
            productId: item.productId,
          },
        },
        data: {
          reserved: { decrement: item.quantitySent },
        },
      })

      // Update status tiket ke REJECTED
      await tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: TransferStatus.REJECTED },
      })
    }

    // C. PROSES AKSI: APPROVE (Setujui & Kirim Barang)
    else if (action === "APPROVE") {
      if (transfer.status !== TransferStatus.PENDING) {
        throw new Error("Hanya tiket berstatus PENDING yang bisa disetujui.")
      }

      // Otorisasi: Hanya cabang tujuan (penerima) atau Super Admin yang bisa menyetujui
      if (user.role !== "SUPER_ADMIN" && user.branchId !== transfer.destId) {
        throw new Error("Hanya cabang penerima barang yang berhak menyetujui transfer ini.")
      }

      // Kurangi stok fisik riil dan reserved di cabang asal (barang resmi meninggalkan gudang)
      await tx.inventory.update({
        where: {
          branchId_productId: {
            branchId: transfer.sourceId,
            productId: item.productId,
          },
        },
        data: {
          quantity: { decrement: item.quantitySent },
          reserved: { decrement: item.quantitySent },
        },
      })

      // Update status tiket ke IN_TRANSIT
      await tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: TransferStatus.IN_TRANSIT },
      })
    }

    // D. PROSES AKSI: COMPLETE (Konfirmasi Barang Sampai)
    else if (action === "COMPLETE") {
      if (transfer.status !== TransferStatus.IN_TRANSIT) {
        throw new Error("Hanya tiket berstatus IN_TRANSIT yang bisa dikonfirmasi selesai.")
      }

      // Otorisasi: Hanya cabang tujuan (penerima) atau Super Admin yang bisa konfirmasi
      if (user.role !== "SUPER_ADMIN" && user.branchId !== transfer.destId) {
        throw new Error("Hanya cabang penerima barang yang berhak mengonfirmasi barang sampai.")
      }

      const finalQty = receivedQty !== undefined ? receivedQty : item.quantitySent
      if (finalQty < 0 || finalQty > item.quantitySent) {
        throw new Error("Jumlah kuantitas diterima tidak valid.")
      }

      // Tambahkan stok fisik di cabang tujuan
      const destInv = await tx.inventory.findUnique({
        where: {
          branchId_productId: {
            branchId: transfer.destId,
            productId: item.productId,
          },
        },
      })

      if (destInv) {
        await tx.inventory.update({
          where: { id: destInv.id },
          data: { quantity: { increment: finalQty } },
        })
      } else {
        // Jika belum ada stok terdaftar di cabang tujuan, buat baru
        await tx.inventory.create({
          data: {
            branchId: transfer.destId,
            productId: item.productId,
            quantity: finalQty,
            reserved: 0,
          },
        })
      }

      // Catat selisih jika barang rusak/hilang di jalan (Audit Trail)
      const discrepancy = item.quantitySent - finalQty
      if (discrepancy > 0) {
        await tx.stockMovement.create({
          data: {
            type: MovementType.DAMAGED_IN_TRANSIT,
            userId: user.id,
            notes: `Selisih transfer ${transfer.id}. Dikirim: ${item.quantitySent}, Diterima: ${finalQty}.`,
            items: {
              create: {
                productId: item.productId,
                quantity: discrepancy,
              },
            },
          },
        })
      }

      // Update kuantitas terima pada item dan ubah status tiket ke COMPLETED
      await tx.stockTransferItem.update({
        where: { id: item.id },
        data: { quantityRecv: finalQty },
      })

      await tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: TransferStatus.COMPLETED },
      })
    }

    // Revalidasi cache halaman agar UI sinkron
    revalidatePath("/inventory")
    revalidatePath("/dashboard")
    revalidatePath("/transfers")

    return { success: true }
  })
}
