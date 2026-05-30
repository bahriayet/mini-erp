# 🚀 Nexus ERP - Sistem Manajemen Inventaris & Logistik Multi-Cabang

**Nexus ERP** adalah sistem manajemen inventaris (*Inventory Management System*) dan logistik terpadu tingkat lanjut yang dirancang khusus untuk operasional bisnis skala multi-cabang secara real-time. Aplikasi ini dibangun dengan standar rekayasa perangkat lunak modern untuk menghasilkan kecepatan performa luar biasa, keamanan ketat, dan antarmuka premium yang sangat memanjakan pengguna.

---

## 🌟 Fitur Premium Unggulan

### 1. 🛡️ Modul Master Data Management (CRUD Terproteksi)
* **CRUD Dinamis Lengkap**: Super Admin dapat mengelola penuh data master Produk (SKU), Cabang Gudang, dan Pendaftaran Akun Karyawan langsung dari antarmuka web.
* **Auto-Sync Kuantitas Database**: Sistem secara cerdas menyuntikkan baris inventaris bernilai `0` untuk seluruh relasi produk dan cabang saat entitas baru didaftarkan agar data relasional selalu stabil.
* **Soft Archiving (Pengarsipan Aman)**: Cabang gudang yang dinonaktifkan (diarsipkan) akan disembunyikan dari transaksi baru namun sejarah log mutasi masa lalunya tetap utuh 100% demi kebutuhan kepatuhan audit.

### 2. 🔄 Alur Logistik Transfer Terstruktur & Stock Locking
* **Transaksi 3 Tahap Aman**: Pengiriman barang antar gudang cabang diatur lewat alur ketat: **Ajukan (Pending)** ➔ **Setujui & Kirim (In Transit)** ➔ **Konfirmasi Terima (Completed)**.
* **Stock Locking (Reserved Stock)**: Saat transfer diajukan, stok di cabang pengirim otomatis dikunci (*reserved*) agar tidak dapat dijual ganda selama proses logistik di perjalanan berlangsung.
* **Verifikasi Selisih**: Sistem mendukung input kuantitas aktual yang diterima di gudang tujuan untuk memantau jika ada barang yang hilang/rusak selama pengiriman.

### 3. 🌓 Pengubah Tema Gelap/Terang (Flicker-Free)
* Terintegrasi dengan variabel warna Tailwind CSS v4 untuk transisi mulus mode gelap/terang. Dilengkapi skrip kepala SSR inline agar tema terpasang instan sebelum browser menggambar elemen layar guna menghindari efek kedipan putih (*anti-flicker*).

### 4. 🍞 Sistem Toast Kustom (Zero-Dependency)
* Notifikasi melayang bertema *glassmorphism* yang dibangun menggunakan React Context & Portal murni tanpa dependensi pihak ketiga (menghemat RAM laptop). Dilengkapi garis horizontal hitung mundur (*animated linear timer*) 5 detik yang estetik.

### 5. ⏳ Shimmer Loading Skeletons
* Navigasi halaman yang mulus dan bebas dari pergeseran tata letak (*Cumulative Layout Shift*) berkat hadirnya loading skeleton tiruan yang memantul lembut (*pulsing shimmer animation*) saat data server-side sedang dimuat.

### 6. 📊 Dashboard Analitik & Jejak Audit Visual
* **Grafik Tren CSS**: Visualisasi batang responsif untuk agregasi mutasi masuk (IN) vs keluar (OUT) per kategori produk.
* **Linimasa Audit Trail Modal**: Klik nama produk apa saja untuk membuka popup linimasa histori lengkap perjalanan produk tersebut (kapan didaftarkan, dimutasi, atau ditransfer).
* **Ekspor CSV Instan**: Satu klik tombol untuk mengonversi data inventaris dan log mutasi aktif ke format Excel (CSV).

---

## 🛠️ Stack Teknologi Modern

* **Framework Utama**: Next.js 16 (Turbopack Enabled)
* **Library UI**: React 19 (Server & Client Components)
* **Styling**: Tailwind CSS v4 & Lucide Icons (Glassmorphism design)
* **Database ORM**: Prisma ORM v7 (Prisma Client generated)
* **Database Driver**: SQLite (Embedded Serverless Database `dev.db`)
* **Enkripsi Kredensial**: Bcrypt.js (Password hashing)
* **Autentikasi Sesi**: NextAuth.js (Auth.js v5 Beta)

---

## 👥 Hak Akses Pengguna (Role-Based Access Control)

| Hak Akses / Fitur | Super Admin | Branch Manager | Staff Gudang |
| :--- | :---: | :---: | :---: |
| **Melihat Dashboard & Tren Grafik** | ✔ (Semua) | ✔ (Cabang Sendiri) | ✔ (Cabang Sendiri) |
| **Mencatat Mutasi (IN/OUT)** | ✔ | ✔ | ✔ |
| **Mengajukan Request Transfer** | ✔ | ✔ | ✔ |
| **Menyetujui & Memproses Transfer** | ✔ | ✔ (Cabang Sendiri) | ❌ |
| **Ekspor Laporan CSV** | ✔ | ✔ | ✔ |
| **CRUD Data Master (Produk/Cabang/Karyawan)** | ✔ | ❌ | ❌ |

---

## ⚙️ Cara Menjalankan Proyek secara Lokal

Ikuti panduan berikut untuk menginstal dan menjalankan Nexus ERP di komputer Anda:

### 1. Persiapan Awal
Kloning repositori ini dan masuk ke dalam folder proyek:
```bash
git clone https://github.com/USERNAME_ANDA/nexus-erp.git
cd nexus-erp
```

### 2. Install Dependensi
Pasang semua package node modules yang diperlukan:
```bash
npm install
```

### 3. Konfigurasi Environment File
Buat berkas bernama **`.env`** di folder root proyek, lalu isi dengan baris koneksi database berikut:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="buat-kode-rahasia-random-anda-disini-minimal-32-karakter"
```

### 4. Setup Database & Sinkronisasi Tabel
Perintahkan Prisma untuk membuat database SQLite lokal `dev.db` dan menyelaraskan seluruh tabel secara otomatis:
```bash
npx prisma db push
```

### 5. Lakukan Pengisian Data Awal (Seeding)
Isi database Anda dengan data tiruan terstruktur (akun Super Admin, Manager, Staff, list produk, dan cabang default):
```bash
npx tsx prisma/seed.ts
```

### 6. Jalankan Aplikasi
Jalankan server pembangunan Next.js Anda secara lokal:
```bash
npm run dev -- --turbo
```
Aplikasi Anda kini sudah aktif dan bisa diakses di browser pada alamat: **`http://localhost:3000`**

### 🔑 Akun Demo Pengujian Bawaan:
* **Super Admin**: `admin@nexus.com` (Sandi: `admin123`)
* **Jakarta Manager**: `jakarta.manager@nexus.com` (Sandi: `manager123`)
* **Bandung Staff**: `bandung.staff@nexus.com` (Sandi: `staff123`)

---

## 📊 Visualisasi Visual Database (Prisma Studio)
Untuk melihat dan mengelola isi tabel database SQLite Anda secara grafis, jalankan perintah ini di tab terminal baru:
```bash
npx prisma studio
```
Layanan akan berjalan di peramban browser Anda pada alamat: **`http://localhost:5555`**
