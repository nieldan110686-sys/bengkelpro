import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export const customerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(10, "Nomor HP minimal 10 digit"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleSchema = z.object({
  customerId: z.string().min(1, "Pelanggan harus dipilih"),
  brand: z.string().min(1, "Merek harus diisi"),
  model: z.string().min(1, "Model harus diisi"),
  year: z.coerce.number().int().min(1990).max(2030),
  plateNumber: z.string().min(1, "Nomor polisi harus diisi"),
  vin: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

export const workOrderSchema = z.object({
  vehicleId: z.string().min(1, "Kendaraan harus dipilih"),
  customerName: z.string().min(1, "Nama pelanggan harus diisi"),
  customerPhone: z.string().optional(),
  mechanicId: z.string().optional(),
  description: z.string().min(1, "Deskripsi harus diisi"),
  notes: z.string().optional(),
  mileage: z.coerce.number().int().optional(),
});

export const workOrderItemSchema = z.object({
  workOrderId: z.string().min(1),
  type: z.enum(["SERVICE", "PART"]),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  totalPrice: z.coerce.number().min(0),
  inventoryId: z.string().optional(),
  mechanicId: z.string().optional(),
});

export const inventorySchema = z.object({
  code: z.string().min(1, "Kode barang harus diisi"),
  name: z.string().min(1, "Nama barang harus diisi"),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().default("pcs"),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(5),
  buyPrice: z.coerce.number().min(0),
  sellPrice: z.coerce.number().min(0),
  location: z.string().optional(),
  notes: z.string().optional(),
  branchId: z.string().optional(),
});

export const mechanicSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["MECHANIC", "STAFF", "CASHIER", "ADMIN"]),
  branchId: z.string().optional(),
});

export const paymentSchema = z.object({
  workOrderId: z.string().min(1),
  amount: z.coerce.number().min(0),
  method: z.enum(["CASH", "TRANSFER", "QRIS"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
