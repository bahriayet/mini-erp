# 📘 Panduan Praktis: SQLite & Prisma ORM
### *Panduan Lengkap untuk Memulai Proyek Database Baru tanpa XAMPP*

Dokumen ini adalah panduan referensi cepat bagi Anda jika suatu saat ingin membuat proyek baru menggunakan kombinasi **SQLite** (database lokal tanpa server) dan **Prisma ORM** (pengelola database modern).

---

## 🌟 1. Apa itu SQLite & Prisma?

* **SQLite**: Database relasional SQL yang disimpan dalam bentuk **satu file tunggal** (contoh: `dev.db`) di dalam folder proyek Anda. Tidak memerlukan instalasi server latar belakang (seperti XAMPP/MySQL).
* **Prisma ORM**: Jembatan modern antara kode pemrograman (JavaScript/TypeScript) dengan database SQL. Prisma membaca struktur tabel dari file teks sederhana (`schema.prisma`) lalu otomatis menyuntikkan instruksi tabel ke database SQLite Anda.

---

## 🚀 2. Cara Memulai Proyek Baru (Langkah demi Langkah)

Jika Anda ingin membuat proyek baru dari nol, ikuti langkah berikut:

### Langkah 1: Siapkan Folder Proyek
Buka terminal Anda, buat folder proyek baru, lalu masuk ke dalamnya:
```bash
mkdir proyek-baru-saya
cd proyek-baru-saya
```
*(Inisialisasi Next.js atau Node.js jika diperlukan sebelum melanjutkan).*

### Langkah 2: Install Modul Prisma
Jalankan perintah berikut untuk memasang alat CLI Prisma dan client runtime:
```bash
# Memasang CLI Prisma di area development
npm install prisma --save-dev

# Memasang Client Prisma untuk diakses di kode program
npm install @prisma/client
```

### Langkah 3: Inisialisasi Prisma & SQLite
Jalankan perintah ajaib ini untuk memerintahkan Prisma menyiapkan database SQLite:
```bash
npx prisma init --datasource-provider sqlite
```
Perintah ini secara otomatis akan membuatkan:
1. **Folder `prisma/`** di root proyek Anda.
2. **Berkas `prisma/schema.prisma`** (tempat mendesain tabel).
3. **Berkas `.env`** yang berisi alamat lokasi database: `DATABASE_URL="file:./dev.db"`.

---

## 📐 3. Cara Menulis Skema Tabel (`schema.prisma`)

Buka berkas `prisma/schema.prisma`. Di bawah blok `datasource` dan `generator`, Anda bisa langsung menuliskan rancangan tabel database Anda menggunakan format deklaratif:

```prisma
model User {
  id        String   @id @default(uuid()) // UUID unik otomatis
  name      String
  email     String   @unique
  role      String   @default("USER")
  createdAt DateTime @default(now())
  posts     Post[]   // Hubungan Relasi (Satu User memiliki banyak Post)
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
```

> [!TIP]
> * `@id` menandakan kolom tersebut adalah *Primary Key*.
> * `@default(uuid())` otomatis menghasilkan kode UUID acak yang sangat aman dan unik secara global saat baris baru dibuat.
> * Tanda tanya (`?`) pada tipe data (misal: `content String?`) menandakan kolom tersebut bersifat opsional (boleh kosong / `null`).

---

## 💾 4. Lembar Contekan Perintah Penting Prisma (Cheat Sheet)

Simpan daftar perintah CLI Prisma berikut untuk kebutuhan manajemen database:

| Perintah Terminal | Kegunaan | Kapan Harus Dijalankan? |
| :--- | :--- | :--- |
| **`npx prisma db push`** | Membuat file database `dev.db` dan memperbarui/membuat seluruh struktur tabel di dalamnya agar sinkron dengan file `schema.prisma`. | **Jalankan setiap kali** Anda baru saja menambah, mengedit, atau menghapus kolom/tabel di `schema.prisma`. |
| **`npx prisma generate`** | Memperbarui tipe data internal `@prisma/client` agar editor koding Anda mengenali kolom-kolom baru secara otomatis. | Jalankan jika editor koding Anda menunjukkan garis merah tanda error palsu setelah melakukan perubahan skema. |
| **`npx prisma studio`** | Membuka antarmuka panel admin berbasis web di alamat `http://localhost:5555` untuk melihat, menambah, mengedit, dan menghapus data secara visual. | **Kapan saja** Anda ingin memeriksa atau menguji isi database secara grafis (pengganti phpMyAdmin). |
| **`npx tsx prisma/seed.ts`** | Menjalankan skrip seeding untuk mengisi database dengan akun demo atau data bawaan secara instan. | Dijalankan saat pertama kali setup proyek di laptop baru. |

---

## 💻 5. Cara Melakukan CRUD Data di Kode Program

Gunakan contoh kode berikut sebagai referensi penulisan query database menggunakan Prisma Client di dalam file JavaScript atau TypeScript Anda:

### Inisialisasi Klien Prisma
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
```

### 1. Create (Menambah Data Baru)
```typescript
const newUser = await prisma.user.create({
  data: {
    name: "Ahmad Wijaya",
    email: "ahmad@gmail.com",
    role: "STAFF"
  }
})
```

### 2. Read (Membaca & Menyaring Data)
```typescript
// Ambil SEMUA data user
const allUsers = await prisma.user.findMany()

// Ambil SATU user berdasarkan Email unik
const singleUser = await prisma.user.findUnique({
  where: { email: "ahmad@gmail.com" }
})

// Ambil data user yang memiliki nama mengandung kata "Wijaya"
const filteredUsers = await prisma.user.findMany({
  where: {
    name: {
      contains: "Wijaya"
    }
  }
})
```

### 3. Update (Memperbarui Data)
```typescript
const updatedUser = await prisma.user.update({
  where: { email: "ahmad@gmail.com" },
  data: {
    name: "Ahmad Wijaya Kusuma"
  }
})
```

### 4. Delete (Menghapus Data)
```typescript
const deletedUser = await prisma.user.delete({
  where: { email: "ahmad@gmail.com" }
})
```

---

## 🌍 6. Tips Migrasi ke Database Produksi (PostgreSQL)

Salah satu keunggulan terbesar menggunakan Prisma adalah skalabilitasnya. Jika suatu saat proyek Anda siap diunggah ke internet (*production*) dan membutuhkan database skala industri besar (seperti **PostgreSQL**):

1. Anda **tidak perlu mengubah satu baris pun kode CRUD** di aplikasi Anda!
2. Buka `prisma/schema.prisma` Anda, lalu ganti blok `datasource` menjadi:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Ubah alamat koneksi `DATABASE_URL` di file `.env` Anda menjadi alamat database PostgreSQL cloud Anda (misal dari Supabase, Neon, atau AWS):
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```
4. Jalankan perintah `npx prisma db push` kembali, dan seluruh database Anda otomatis telah bermigrasi ke database PostgreSQL cloud dengan aman!

---

## 🌱 7. Cara Mengatur Data Awal Bawaan (Database Seeding)

Jika Anda ingin mengisi database baru Anda dengan data bawaan (seperti membuat akun admin default, list kategori produk, dll.) secara otomatis saat pertama kali setup:

1. Buat berkas baru bernama `prisma/seed.ts`. Tulis skrip data awal Anda di sana:
   ```typescript
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()

   async function main() {
     const admin = await prisma.user.create({
       data: {
         name: "Super Admin",
         email: "admin@proyek.com",
         role: "ADMIN"
       }
     })
     console.log("Seeding sukses! Akun admin dibuat:", admin.email)
   }

   main()
     .catch((e) => { console.error(e); process.exit(1); })
     .finally(async () => { await prisma.$disconnect(); })
   ```

2. Daftarkan konfigurasi seed di dalam file `package.json` Anda di bagian paling bawah:
   ```json
   "prisma": {
     "seed": "tsx prisma/seed.ts"
   }
   ```

3. Jalankan perintah berikut di terminal Anda untuk mengeksekusi pengisian data awal secara otomatis:
   ```bash
   npx prisma db seed
   ```
   *(Atau jalankan manual menggunakan `npx tsx prisma/seed.ts` jika Anda belum mendaftarkannya di package.json).*

