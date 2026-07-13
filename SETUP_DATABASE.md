# ============================================
# BENGKELPRO — Database Setup Guide
# ============================================
# 
# Cara setup setelah database Neon/Supabase sudah dibuat:
#
# STEP 1: Copy .env.example → .env lalu edit DATABASE_URL & JWT_SECRET
# STEP 2: Jalankan perintah di bawah secara berurutan:
# ============================================

# 1. Push schema Prisma ke database
npx prisma db push

# 2. Seed data demo
npm run db:seed

# 3. Buka Prisma Studio (GUI cek data)
npx prisma studio
