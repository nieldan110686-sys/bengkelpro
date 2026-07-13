"use client";

import { useEffect, useState } from "react";
import { DollarSign, Wrench, Users, Car, AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface DashboardData {
  revenue: { today: number; week: number; month: number; year: number };
  workOrders: { today: number; total: number; inProgress: number };
  customers: number;
  vehicles: number;
  alerts: { lowStock: number; pendingBookings: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-500">Memuat...</div>;

  const statCards = [
    { label: "Omzet Hari Ini", value: formatCurrency(data.revenue.today), icon: DollarSign, color: "bg-green-500" },
    { label: "Omzet Bulan Ini", value: formatCurrency(data.revenue.month), icon: TrendingUp, color: "bg-blue-500" },
    { label: "WO Aktif", value: data.workOrders.inProgress, icon: Wrench, color: "bg-indigo-500" },
    { label: "Pelanggan", value: data.customers, icon: Users, color: "bg-violet-500" },
    { label: "Kendaraan", value: data.vehicles, icon: Car, color: "bg-orange-500" },
    { label: "Stok Menipis", value: data.alerts.lowStock, icon: AlertTriangle, color: "bg-red-500", isAlert: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ringkasan bisnis bengkel Anda</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, isAlert }) => (
          <Card key={label} className={isAlert && data.alerts.lowStock > 0 ? "border-red-300 dark:border-red-800" : ""}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}><Icon className="w-6 h-6 text-white" /></div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-xl font-bold ${isAlert && data.alerts.lowStock > 0 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Omzet</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: "Hari Ini", value: data.revenue.today }, { name: "Minggu Ini", value: data.revenue.week },
                { name: "Bulan Ini", value: data.revenue.month }, { name: "Tahun Ini", value: data.revenue.year },
              ]}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#bfdbfe" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Work Order</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Hari Ini", value: data.workOrders.today }, { name: "Aktif", value: data.workOrders.inProgress },
                { name: "Total", value: data.workOrders.total },
              ]}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                <Tooltip /><Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
