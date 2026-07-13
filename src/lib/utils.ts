import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateOrderNumber(prefix: string): string {
  const today = new Date();
  const y = today.getFullYear().toString().slice(-2);
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${y}${m}${d}-${r}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    ESTIMATED: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-green-100 text-green-800",
    DELIVERED: "bg-teal-100 text-teal-800",
    CANCELLED: "bg-red-100 text-red-800",
    UNPAID: "bg-red-100 text-red-800",
    PARTIAL: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    ARRIVED: "bg-purple-100 text-purple-800",
    IN: "bg-green-100 text-green-800",
    OUT: "bg-orange-100 text-orange-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    NEW: "Baru Masuk",
    ESTIMATED: "Estimasi",
    IN_PROGRESS: "Dalam Proses",
    COMPLETED: "Selesai",
    DELIVERED: "Diambil",
    CANCELLED: "Dibatalkan",
    UNPAID: "Belum Dibayar",
    PARTIAL: "Dibayar Sebagian",
    PAID: "Lunas",
    PENDING: "Menunggu",
    CONFIRMED: "Dikonfirmasi",
    ARRIVED: "Tiba",
  };
  return map[status] || status;
}
