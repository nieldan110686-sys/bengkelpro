"use client";

import { useEffect, useState } from "react";
import { DollarSign, Wrench, Users, Car, AlertTriangle, TrendingUp, Database } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardData {
  revenue: { today: number; week: number; month: number; year: number };
  workOrders: { today: number; total: number; inProgress: number };
  customers: number;
  vehicles: number;
  alerts: { lowStock: number; pendingBookings: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Database Belum Tersambung</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          Hubungkan PostgreSQL terlebih dahulu. Atur <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">DATABASE_URL</code> di Environment Variables Vercel, lalu jalankan <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">npx prisma db push</code>.
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-2">Rekomendasi database gratis:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><a href="https://neon.tech" className="text-primary-600 underline" target="_blank">Neon</a> — PostgreSQL serverless, free tier 0.5GB</li>
            <li><a href="https://supabase.com" className="text-primary-600 underline" target="_blank">Supabase</a> — 2 project gratis, 500MB</li>
            <li><a href="https://vercel.com/storage/postgres" className="text-primary-600 underline" target="_blank">Vercel Postgres</a> — langsung dari Vercel</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Memuat...</div>;
  }

  const statCards = [
    { label: "Omzet Hari Ini", value: formatCurrency(data.revenue.today), icon: DollarSign, color: "bg-green-500" },
    { label: "Omzet Bulan Ini", value: formatCurrency(data.revenue.month), icon: TrendingUp, color: "bg-blue-500" },
    { label: "Work Order Aktif", value: data.workOrders.inProgress, icon: Wrench, color: "bg-indigo-500" },
    { label: "Total Pelanggan", value: data.customers, icon: Users, color: "bg-violet-500" },
    { label: "Total Kendaraan", value: data.vehicles, icon: Car, color: "bg-orange-500" },
    {
      label: "Stok Menipis",
      value: data.alerts.lowStock,
      icon: AlertTriangle,
      color: "bg-red-500",
      isAlert: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ringkasan bisnis bengkel Anda</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, isAlert }) => (
          <Card key={label} className={isAlert && data.alerts.lowStock > 0 ? "border-red-300 dark:border-red-800" : ""}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-xl font-bold ${isAlert && data.alerts.lowStock > 0 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-200">
        ⚠️ Dashboard menampilkan data real-time dari PostgreSQL. Grafik akan muncul setelah database tersambung.
      </div>
    </div>
  );
}
