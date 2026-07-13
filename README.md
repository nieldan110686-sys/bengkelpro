# BengkelPro 🛠️

**Sistem Manajemen Bengkel Otomotif Modern**

BengkelPro adalah aplikasi web untuk manajemen bengkel otomotif, dibangun dengan Next.js 15, TypeScript, Tailwind CSS, Prisma ORM, dan PostgreSQL. Cocok untuk bengkel kecil hingga enterprise multi-cabang.

## ✨ Fitur

### Dashboard Owner
- Omzet harian, mingguan, bulanan, tahunan
- Grafik performa bisnis
- Notifikasi stok menipis & WO baru

### Manajemen Servis
- Work Order / Job Card digital
- Status flow: Baru → Estimasi → Proses → Selesai → Diambil
- Penugasan mekanik
- Booking servis pelanggan

### Stok Sparepart Real-time
- Stok otomatis berkurang saat digunakan di WO
- Barang masuk/keluar & log histori
- Peringatan stok minimum

### Pelanggan & Kendaraan
- Database pelanggan lengkap
- Riwayat servis per kendaraan
- Pencarian cepat (nama, HP, plat, VIN)

### Mekanik & Komisi
- Manajemen mekanik & staf
- Perhitungan komisi otomatis
- Performa & produktivitas

### Invoice & Pembayaran
- Invoice otomatis dari WO
- Multi metode: Cash, Transfer, QRIS
- Status: Unpaid, Partial, Paid

### Laporan
- Harian, bulanan, tahunan
- Filter tanggal & tipe laporan
- Omzet, servis, stok, mekanik

### Fitur Pendukung
- Dark/Light mode
- Multi-user dengan role: Owner, Admin, Mekanik, Kasir
- Responsive mobile-friendly
- Audit log

## 🛠️ Tech Stack

| Tech | Keterangan |
|------|------------|
| **Next.js 15** | App Router, Server Actions |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Prisma ORM** | Database ORM |
| **PostgreSQL** | Database |
| **JWT (jose)** | Authentication |
| **Zod** | Validasi input |
| **Recharts** | Grafik dashboard |
| **Lucide React** | Icon set |
| **react-hot-toast** | Notifikasi |

## 📦 Struktur Project

```
bengkelpro/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data demo
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/       # Halaman login
│   │   │   └── register/    # Halaman register
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/   # Dashboard owner
│   │   │   ├── customers/   # Manajemen pelanggan
│   │   │   ├── vehicles/    # Manajemen kendaraan
│   │   │   ├── work-orders/ # Work order & antrian
│   │   │   ├── inventory/   # Stok sparepart
│   │   │   ├── mechanics/   # Mekanik & staf
│   │   │   ├── invoices/    # Invoice & pembayaran
│   │   │   ├── reports/     # Laporan
│   │   │   └── settings/    # Pengaturan
│   │   ├── api/             # REST API routes
│   │   │   ├── auth/        # Login, register, signout
│   │   │   ├── customers/   # CRUD pelanggan
│   │   │   ├── vehicles/    # CRUD kendaraan
│   │   │   ├── work-orders/ # CRUD WO + items
│   │   │   ├── inventory/   # CRUD stok + log
│   │   │   ├── mechanics/   # CRUD mekanik
│   │   │   ├── invoices/    # CRUD invoice + bayar
│   │   │   ├── reports/     # Laporan
│   │   │   └── dashboard/   # Data dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/           # Card, Button, Modal, Table, Badge
│   │   ├── shared/       # ThemeProvider
│   │   └── ...
│   ├── lib/
│   │   ├── db.ts         # Prisma client
│   │   ├── auth.ts       # JWT auth utilities
│   │   ├── validations.ts # Zod schemas
│   │   ├── api-helpers.ts # Auth helper
│   │   └── utils.ts      # formatCurrency, status badge, etc.
│   └── middleware.ts      # Auth route protection
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🚀 Instalasi

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm / yarn / pnpm

### 1. Clone repository
```bash
git clone https://github.com/nieldan110686-sys/bengkelpro.git
cd bengkelpro
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment
```bash
cp .env.example .env
```

Edit `.env` dengan kredensial PostgreSQL Anda:
```
DATABASE_URL="postgresql://user:password@localhost:5432/bengkelpro?schema=public"
JWT_SECRET="ganti-dengan-secret-key-anda"
```

### 4. Setup database
```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# Seed data demo
npm run db:seed
```

### 5. Jalankan development server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🔑 Akun Demo

Setelah menjalankan seed:

| Role | Email | Password |
|------|-------|----------|
| **Owner** | owner@bengkelpro.com | password123 |
| **Admin** | admin@bengkelpro.com | password123 |
| **Kasir** | kasir@bengkelpro.com | password123 |
| **Mekanik** | dodi@bengkelpro.com | password123 |
| **Mekanik** | eko@bengkelpro.com | password123 |

## 📊 Database Schema

Schema Prisma lengkap mencakup:

- **User** - Pengguna dengan role (OWNER, ADMIN, MECHANIC, CASHIER, STAFF)
- **Branch** - Cabang bengkel (multi-cabang)
- **Customer** - Data pelanggan
- **Vehicle** - Data kendaraan pelanggan
- **WorkOrder** - Job card / work order
- **WorkOrderItem** - Item jasa & sparepart dalam WO
- **Payment** - Riwayat pembayaran
- **Invoice** - Invoice transaksi
- **Inventory** - Stok sparepart
- **InventoryLog** - Log perubahan stok
- **Booking** - Booking servis
- **CommissionRate** - Aturan komisi mekanik
- **Transaction** - Transaksi keuangan
- **AuditLog** - Log aktivitas

## 🔒 Keamanan

- Password di-hash dengan bcrypt (12 rounds)
- JWT-based authentication
- HTTP-only cookies
- Middleware proteksi route
- Zod input validation
- Prepared statements via Prisma

## 📝 Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run db:push` | Push Prisma schema ke DB |
| `npm run db:migrate` | Migration development |
| `npm run db:seed` | Seed data demo |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reset database |
| `npm run lint` | Lint code |

## 🎨 Paket Fitur

| Fitur | Basic | Professional | Enterprise |
|-------|-------|-------------|------------|
| Pelanggan & Kendaraan | ✅ | ✅ | ✅ |
| Work Order | ✅ | ✅ | ✅ |
| Booking Servis | ✅ | ✅ | ✅ |
| Laporan Sederhana | ✅ | ✅ | ✅ |
| Stok Sparepart | ❌ | ✅ | ✅ |
| Invoice Otomatis | ❌ | ✅ | ✅ |
| Dashboard Owner | ❌ | ✅ | ✅ |
| Histori Lengkap | ❌ | ✅ | ✅ |
| Multi-cabang | ❌ | ❌ | ✅ |
| Role Advanced | ❌ | ❌ | ✅ |
| Komisi Detail | ❌ | ❌ | ✅ |
| Audit Log | ❌ | ❌ | ✅ |
| Backup & Recovery | ❌ | ❌ | ✅ |

---

**BengkelPro** — Dibuat dengan ❤️ untuk bengkel Indonesia
