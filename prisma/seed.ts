import prisma from "../src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  console.log("Menjalankan Seeding Database...")

  // Bersihkan data lama agar bersih saat re-run
  await prisma.inventory.deleteMany()
  await prisma.stockMovementItem.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.stockTransferItem.deleteMany()
  await prisma.stockTransfer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.product.deleteMany()
  await prisma.branch.deleteMany()

  // 1. Seed Cabang/Warehouse
  const jakarta = await prisma.branch.create({
    data: {
      name: "Jakarta Main Warehouse",
      address: "Jl. Industri Raya No. 45, Jakarta Pusat",
      type: "WAREHOUSE" as any
    }
  })

  const bandung = await prisma.branch.create({
    data: {
      name: "Bandung Distribution Center",
      address: "Jl. Soekarno-Hatta No. 120, Bandung",
      type: "TRANSIT_HUB" as any
    }
  })

  console.log("✔ Cabang berhasil ditambahkan.")

  // 2. Seed Master Produk
  const steelPipe = await prisma.product.create({
    data: {
      sku: "SKU-STL-001",
      name: "Premium Galvanized Steel Pipe 2 Inch",
      category: "Bahan Bangunan",
      basePrice: 250000.00,
      minStock: 10
    }
  })

  const copperCable = await prisma.product.create({
    data: {
      sku: "SKU-COP-002",
      name: "Industrial Copper Cable 4-Core 10m",
      category: "Kelistrikan",
      basePrice: 450000.00,
      minStock: 5
    }
  })

  const concreteBar = await prisma.product.create({
    data: {
      sku: "SKU-CON-003",
      name: "Reinforced Concrete Iron Bar 12mm",
      category: "Bahan Bangunan",
      basePrice: 85000.00,
      minStock: 20
    }
  })

  console.log("✔ Master Produk berhasil ditambahkan.")

  // 3. Hash password pengguna
  const hashedPassword = await bcrypt.hash("admin123", 10)
  const managerPassword = await bcrypt.hash("manager123", 10)
  const staffPassword = await bcrypt.hash("staff123", 10)

  // Seed Super Admin (Tanpa terikat cabang)
  const adminUser = await prisma.user.create({
    data: {
      name: "Alexander Admin",
      email: "admin@nexus.com",
      password: hashedPassword,
      role: "SUPER_ADMIN"
    }
  })

  // Seed Branch Manager (Terkait cabang Jakarta)
  const managerUser = await prisma.user.create({
    data: {
      name: "Budi Manager",
      email: "jakarta.manager@nexus.com",
      password: managerPassword,
      role: "BRANCH_MANAGER",
      branchId: jakarta.id
    }
  })

  // Seed Staff Gudang (Terkait cabang Bandung)
  const staffUser = await prisma.user.create({
    data: {
      name: "Citra Staff",
      email: "bandung.staff@nexus.com",
      password: staffPassword,
      role: "STAFF",
      branchId: bandung.id
    }
  })

  console.log("✔ Data pengguna (Admin, Manager, Staff) berhasil ditambahkan.")

  // 4. Seed Stok Aktual Awal di Cabang (Inventaris)
  await prisma.inventory.createMany({
    data: [
      { branchId: jakarta.id, productId: steelPipe.id, quantity: 150, reserved: 0 },
      { branchId: jakarta.id, productId: copperCable.id, quantity: 80, reserved: 0 },
      { branchId: jakarta.id, productId: concreteBar.id, quantity: 500, reserved: 0 },
      { branchId: bandung.id, productId: steelPipe.id, quantity: 30, reserved: 0 },
      { branchId: bandung.id, productId: copperCable.id, quantity: 15, reserved: 0 },
      { branchId: bandung.id, productId: concreteBar.id, quantity: 100, reserved: 0 }
    ]
  })

  console.log("✔ Stok awal inventaris cabang berhasil dimasukkan.")
  console.log("=== SEEDING BERHASIL DISELESAIKAN ===")
}

main()
  .catch((e) => {
    console.error("Terjadi error saat seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
