# Software Design Document (SDD)
## Proyek: Mini ERP - Manajemen Inventaris Multi-Cabang

### 1. Arsitektur Sistem & Teknologi
Sistem ini menggunakan arsitektur modern monolithic-hybrid yang sangat populer untuk performa tinggi dan kemudahan pemeliharaan:

- **Framework:** Next.js 15+ (App Router) untuk rendering optimal (SSR untuk dashboard, CSR untuk form interaktif).
- **Bahasa Pemrograman:** TypeScript untuk keandalan pengetikan kode.
- **Database:** PostgreSQL (pilihan industri untuk integritas data tinggi dan transaksi ACID).
- **ORM:** Prisma untuk manajemen skema relasional yang aman.
- **Autentikasi:** NextAuth.js v5 untuk proteksi rute halaman dan sesi.
- **State Management:** Zustand untuk menangani form mutasi multi-item di sisi klien.

---

### 2. Skema Database Prisma Rinci (`schema.prisma`)

Berikut adalah draf skema Prisma yang mengimplementasikan keamanan integritas data dengan relasi Many-to-Many terkelola dan indeks unik.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  SUPER_ADMIN
  BRANCH_MANAGER
  STAFF
}

enum MovementType {
  IN
  OUT
  TRANSFER
  DAMAGED_IN_TRANSIT
}

enum TransferStatus {
  PENDING
  IN_TRANSIT
  COMPLETED
  REJECTED
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(STAFF)
  branchId  String?  // Nullable jika Super Admin
  branch    Branch?  @relation(fields: [branchId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  movements StockMovement[]
}

model Branch {
  id        String   @id @default(uuid())
  name      String   @unique
  address   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users             User[]
  inventories       Inventory[]
  sourceTransfers   StockTransfer[] @relation("SourceBranch")
  destTransfers     StockTransfer[] @relation("DestBranch")
}

model Product {
  id         String   @id @default(uuid())
  sku        String   @unique
  name       String
  category   String
  basePrice  Decimal  @db.Decimal(12, 2)
  minStock   Int      @default(5) // Limit low stock alert
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  inventories    Inventory[]
  movementItems  StockMovementItem[]
  transferItems  StockTransferItem[]
}

// Junction Table untuk stok aktual per cabang
model Inventory {
  id         String   @id @default(uuid())
  branchId   String
  productId  String
  quantity   Int      @default(0)
  reserved   Int      @default(0) // Stok terkunci saat transfer berstatus PENDING/IN_TRANSIT
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  branch     Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([branchId, productId]) // Mencegah duplikasi data stok produk di cabang yang sama
  @@index([branchId])
  @@index([productId])
}

model StockMovement {
  id           String       @id @default(uuid())
  type         MovementType
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  notes        String?
  timestamp    DateTime     @default(now())

  items        StockMovementItem[]
}

model StockMovementItem {
  id         String   @id @default(uuid())
  movementId String
  productId  String
  quantity   Int

  movement   StockMovement @relation(fields: [movementId], references: [id], onDelete: Cascade)
  product    Product       @relation(fields: [productId], references: [id])
}

model StockTransfer {
  id           String         @id @default(uuid())
  sourceId     String
  destId       String
  status       TransferStatus @default(PENDING)
  notes        String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  sourceBranch Branch         @relation("SourceBranch", fields: [sourceId], references: [id])
  destBranch   Branch         @relation("DestBranch", fields: [destId], references: [id])
  items        StockTransferItem[]
}

model StockTransferItem {
  id             String        @id @default(uuid())
  transferId     String
  productId      String
  quantitySent   Int
  quantityRecv   Int?          // Nullable sampai status COMPLETED untuk verifikasi selisih

  transfer       StockTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  product        Product       @relation(fields: [productId], references: [id])
}
```

---

### 3. Penanganan Transaksi & Konkurensi Database
Untuk memastikan integritas mutasi stok (terutama transfer antar cabang), semua operasi manipulasi stok harus menggunakan **Prisma Database Transactions**.

#### Contoh Implementasi Server Action untuk Persetujuan Transfer:
```typescript
// app/actions/transferActions.ts

export async function approveTransfer(transferId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Ambil detail transfer beserta itemnya
    const transfer = await tx.stockTransfer.findUnique({
      where: { id: transferId },
      include: { items: true }
    });

    if (!transfer || transfer.status !== 'PENDING') {
      throw new Error("Transfer tidak valid atau sudah diproses.");
    }

    // 2. Kunci stok (Move dari 'reserved' ke 'IN_TRANSIT' secara fisik)
    for (const item of transfer.items) {
      // Ambil record stok di cabang asal
      const sourceInv = await tx.inventory.findUnique({
        where: {
          branchId_productId: {
            branchId: transfer.sourceId,
            productId: item.productId
          }
        }
      });

      if (!sourceInv || sourceInv.quantity < item.quantitySent) {
        throw new Error(`Stok produk tidak mencukupi untuk transfer.`);
      }

      // Kurangi stok riil dan juga kurangi reserved di cabang asal
      await tx.inventory.update({
        where: { id: sourceInv.id },
        data: {
          quantity: { decrement: item.quantitySent }
          // Kuantitas riil dikurangi karena barang resmi keluar dari gudang asal
        }
      });
    }

    // 3. Update status transfer menjadi IN_TRANSIT
    await tx.stockTransfer.update({
      where: { id: transferId },
      data: { status: 'IN_TRANSIT' }
    });

    return { success: true };
  });
}
```

---

### 4. Struktur Folder Proyek (Next.js App Router)
Struktur diatur menggunakan arsitektur modular berbasis fitur guna mempermudah pencarian berkas:

```text
d:/mini-erp/
├── docs/                 # Dokumentasi PRD & SDD
├── prisma/
│   └── schema.prisma     # Skema database relasional
└── src/
    ├── app/              # Folder Utama Next.js App Router
    │   ├── (auth)/       # Grup rute login/register
    │   ├── dashboard/    # Halaman dashboard analitik
    │   ├── inventory/    # Halaman inventaris cabang
    │   ├── mutations/    # Halaman input stok masuk/keluar
    │   └── transfers/    # Halaman manajemen transfer stok
    ├── components/       # Komponen UI global (Reusable)
    │   ├── ui/           # Komponen UI Atomik (Button, Input, dll)
    │   └── layouts/      # Sidebar, Navbar, Page Wrapper
    ├── hooks/            # Custom React Hooks
    ├── lib/              # Konfigurasi Prisma client & NextAuth
    └── types/            # Type definition TypeScript
```
