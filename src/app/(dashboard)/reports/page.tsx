"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatCurrency, getStatusLabel } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("revenue");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => { fetchReport(); }, [reportType, from, to]);

  async function fetchReport() {
    setLoading(true);
    const params = new URLSearchParams({ type: reportType });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/reports?${params}`);
    const result = await res.json();
    setData(Array.isArray(result) ? result : []);
    setLoading(false);
  }

  const reportTypes = [
    { key: "revenue", label: "Omzet" },
    { key: "services", label: "Servis" },
    { key: "inventory", label: "Stok" },
    { key: "mechanics", label: "Mekanik" },
  ];

  function renderTable() {
    switch (reportType) {
      case "revenue":
        return (
          <Table loading={loading} data={data}
            columns={[
              { key: "id", label: "No. WO", render: (p: any) => p.workOrder?.orderNumber || "-" },
              { key: "amount", label: "Jumlah", render: (p: any) => formatCurrency(p.amount) },
              { key: "method", label: "Metode" },
              { key: "createdAt", label: "Tanggal", render: (p: any) => new Date(p.createdAt).toLocaleDateString("id-ID") },
            ]}
          />
        );
      case "services":
        return (
          <Table loading={loading} data={data}
            columns={[
              { key: "orderNumber", label: "No. WO" },
              { key: "customerName", label: "Pelanggan" },
              { key: "status", label: "Status", render: (wo: any) => getStatusLabel(wo.status) },
              { key: "mechanic", label: "Mekanik", render: (wo: any) => wo.mechanic?.name || "-" },
            ]}
          />
        );
      case "inventory":
        return (
          <Table loading={loading} data={data}
            columns={[
              { key: "inventory", label: "Barang", render: (l: any) => l.inventory?.name || "-" },
              { key: "type", label: "Tipe", render: (l: any) => l.type === "IN" ? "Masuk" : "Keluar" },
              { key: "quantity", label: "Qty" },
              { key: "user", label: "User", render: (l: any) => l.user?.name || "-" },
            ]}
          />
        );
      case "mechanics":
        return (
          <Table loading={loading} data={data}
            columns={[
              { key: "name", label: "Nama" },
              { key: "email", label: "Email" },
              { key: "completedCount", label: "WO Selesai" },
            ]}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Laporan</h1><p className="text-gray-500 mt-1">Laporan bisnis bengkel</p></div>

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-2">
          {reportTypes.map((t) => (
            <Button key={t.key} variant={reportType === t.key ? "primary" : "outline"} size="sm" onClick={() => setReportType(t.key)}>
              {t.label}
            </Button>
          ))}
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm" />
        <span className="text-gray-500">-</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm" />
      </div>

      <Card>
        <CardHeader><CardTitle className="capitalize">Laporan {reportType}</CardTitle></CardHeader>
        <CardContent>
          {renderTable()}
        </CardContent>
      </Card>
    </div>
  );
}
