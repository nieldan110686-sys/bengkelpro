import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.commissionRate.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  const password = await bcrypt.hash("password123", 12);

  // Branch
  const branch = await prisma.branch.create({
    data: { name: "Pusat", address: "Jl. Raya Bengkel No. 1, Jakarta", phone: "021-555-1234" },
  });

  // Users
  const owner = await prisma.user.create({
    data: { name: "Budi Santoso", email: "owner@bengkelpro.com", password, role: "OWNER", branchId: branch.id },
  });

  const admin = await prisma.user.create({
    data: { name: "Ani Wijaya", email: "admin@bengkelpro.com", password, role: "ADMIN", branchId: branch.id },
  });

  const mekanik1 = await prisma.user.create({
    data: { name: "Dodi Hermawan", email: "dodi@bengkelpro.com", password, role: "MECHANIC", phone: "0812-1111-2222", branchId: branch.id },
  });

  const mekanik2 = await prisma.user.create({
    data: { name: "Eko Prasetyo", email: "eko@bengkelpro.com", password, role: "MECHANIC", phone: "0812-3333-4444", branchId: branch.id },
  });

  const kasir = await prisma.user.create({
    data: { name: "Siti Rahayu", email: "kasir@bengkelpro.com", password, role: "CASHIER", branchId: branch.id },
  });

  // Commission
  await prisma.commissionRate.createMany({
    data: [
      { userId: mekanik1.id, type: "PERCENTAGE", servicePercent: 20, partPercent: 5 },
      { userId: mekanik2.id, type: "PERCENTAGE", servicePercent: 20, partPercent: 5 },
    ],
  });

  // Customers
  const customer1 = await prisma.customer.create({
    data: { name: "Rudi Hartono", phone: "0812-9876-5432", email: "rudi@email.com", address: "Jl. Melati No. 5, Jakarta" },
  });

  const customer2 = await prisma.customer.create({
    data: { name: "Dewi Lestari", phone: "0813-1111-2222", address: "Jl. Anggrek No. 10, Jakarta" },
  });

  const customer3 = await prisma.customer.create({
    data: { name: "Ahmad Fauzi", phone: "0856-5555-6666", email: "ahmad@email.com", address: "Jl. Mawar No. 3, Jakarta" },
  });

  // Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: { customerId: customer1.id, brand: "Toyota", model: "Avanza", year: 2020, plateNumber: "B 1234 ABC", color: "Silver" },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: { customerId: customer2.id, brand: "Honda", model: "Civic", year: 2022, plateNumber: "B 5678 DEF", color: "White" },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: { customerId: customer3.id, brand: "Daihatsu", model: "Xenia", year: 2019, plateNumber: "B 9012 GHI", color: "Black" },
  });

  // Inventory
  const items = await Promise.all([
    prisma.inventory.create({ data: { code: "SP-001", name: "Oli Mesin 10W-40", category: "Oli", brand: "Castrol", unit: "liter", stock: 50, minStock: 10, buyPrice: 45000, sellPrice: 65000, branchId: branch.id } }),
    prisma.inventory.create({ data: { code: "SP-002", name: "Filter Oli", category: "Filter", brand: "Sakura", unit: "pcs", stock: 30, minStock: 5, buyPrice: 25000, sellPrice: 40000, branchId: branch.id } }),
    prisma.inventory.create({ data: { code: "SP-003", name: "Kampas Rem Depan", category: "Rem", brand: "Akebono", unit: "set", stock: 15, minStock: 3, buyPrice: 120000, sellPrice: 180000, branchId: branch.id } }),
    prisma.inventory.create({ data: { code: "SP-004", name: "Filter Udara", category: "Filter", brand: "Sakura", unit: "pcs", stock: 20, minStock: 5, buyPrice: 35000, sellPrice: 55000, branchId: branch.id } }),
    prisma.inventory.create({ data: { code: "SP-005", name: "Busi NGK", category: "Electrical", brand: "NGK", unit: "pcs", stock: 40, minStock: 8, buyPrice: 30000, sellPrice: 45000, branchId: branch.id } }),
    prisma.inventory.create({ data: { code: "SP-006", name: "Aki Kering 12V", category: "Electrical", brand: "GS", unit: "pcs", stock: 8, minStock: 3, buyPrice: 450000, sellPrice: 600000, branchId: branch.id } }),
    prisma.inventory.create({ data: { code: "SP-007", name: "Oli Gardan", category: "Oli", brand: "TOP 1", unit: "liter", stock: 3, minStock: 5, buyPrice: 38000, sellPrice: 55000, branchId: branch.id } }),
  ]);

  // Work Orders
  const wo1 = await prisma.workOrder.create({
    data: {
      orderNumber: "WO-240714-001", vehicleId: vehicle1.id, customerName: customer1.name, customerPhone: customer1.phone,
      mechanicId: mekanik1.id, createdById: admin.id, branchId: branch.id, status: "COMPLETED",
      description: "Ganti oli rutin & tune-up", startedAt: new Date("2024-07-14T09:00:00Z"), completedAt: new Date("2024-07-14T11:30:00Z"),
    },
  });

  await prisma.workOrderItem.createMany({
    data: [
      { workOrderId: wo1.id, type: "SERVICE", name: "Jasa Tune-up", quantity: 1, unitPrice: 150000, totalPrice: 150000, mechanicId: mekanik1.id },
      { workOrderId: wo1.id, type: "PART", name: "Oli Mesin 10W-40", quantity: 4, unitPrice: 65000, totalPrice: 260000, inventoryId: items[0].id },
      { workOrderId: wo1.id, type: "PART", name: "Filter Oli", quantity: 1, unitPrice: 40000, totalPrice: 40000, inventoryId: items[1].id },
    ],
  });

  // Update stock after WO
  await prisma.inventory.update({ where: { id: items[0].id }, data: { stock: 46 } });
  await prisma.inventory.update({ where: { id: items[1].id }, data: { stock: 29 } });

  // Invoice WO1
  const total1 = 150000 + 260000 + 40000;
  await prisma.invoice.create({
    data: { workOrderId: wo1.id, invoiceNumber: "INV-240714-001", status: "PAID", subtotal: total1, total: total1, paid: total1 },
  });

  await prisma.payment.create({
    data: { workOrderId: wo1.id, amount: total1, method: "CASH" },
  });

  // WO2 - In Progress
  const wo2 = await prisma.workOrder.create({
    data: {
      orderNumber: "WO-240714-002", vehicleId: vehicle2.id, customerName: customer2.name, customerPhone: customer2.phone,
      mechanicId: mekanik2.id, createdById: kasir.id, branchId: branch.id, status: "IN_PROGRESS",
      description: "Ganti kampas rem depan & cek AC", startedAt: new Date(),
    },
  });

  await prisma.workOrderItem.createMany({
    data: [
      { workOrderId: wo2.id, type: "SERVICE", name: "Jasa Ganti Kampas Rem", quantity: 1, unitPrice: 100000, totalPrice: 100000, mechanicId: mekanik2.id },
      { workOrderId: wo2.id, type: "PART", name: "Kampas Rem Depan", quantity: 1, unitPrice: 180000, totalPrice: 180000, inventoryId: items[2].id },
    ],
  });

  await prisma.inventory.update({ where: { id: items[2].id }, data: { stock: 14 } });

  const total2 = 100000 + 180000;
  await prisma.invoice.create({
    data: { workOrderId: wo2.id, invoiceNumber: "INV-240714-002", status: "UNPAID", subtotal: total2, total: total2 },
  });

  // WO3 - New
  await prisma.workOrder.create({
    data: {
      orderNumber: "WO-240714-003", vehicleId: vehicle3.id, customerName: customer3.name, customerPhone: customer3.phone,
      createdById: admin.id, branchId: branch.id, status: "NEW",
      description: "Ganti aki & service AC",
    },
  });

  // Booking
  await prisma.booking.create({
    data: { customerId: customer3.id, vehicleInfo: `${vehicle3.brand} ${vehicle3.model} (${vehicle3.plateNumber})`, date: new Date("2026-07-15T09:00:00+07:00"), timeSlot: "09:00-11:00", description: "Servis rutin 40.000 km", status: "CONFIRMED" },
  });

  // Inventory logs
  await prisma.inventoryLog.createMany({
    data: [
      { inventoryId: items[0].id, type: "IN", quantity: 60, beforeStock: 0, afterStock: 60, reference: "Pembelian awal", userId: admin.id },
      { inventoryId: items[0].id, type: "OUT", quantity: 4, beforeStock: 50, afterStock: 46, reference: `WO-${wo1.id}`, userId: admin.id },
      { inventoryId: items[1].id, type: "IN", quantity: 40, beforeStock: 0, afterStock: 40, reference: "Pembelian awal", userId: admin.id },
      { inventoryId: items[1].id, type: "OUT", quantity: 1, beforeStock: 30, afterStock: 29, reference: `WO-${wo1.id}`, userId: admin.id },
    ],
  });

  console.log("✅ Seed completed!");
  console.log("");
  console.log("📧 Login credentials:");
  console.log("   Owner:  owner@bengkelpro.com / password123");
  console.log("   Admin:  admin@bengkelpro.com / password123");
  console.log("   Kasir:  kasir@bengkelpro.com / password123");
  console.log("   Mekanik: dodi@bengkelpro.com / password123");
  console.log("   Mekanik: eko@bengkelpro.com / password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
