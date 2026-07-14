"use client";

import { useState } from "react";
import { Search, Wrench, Car, ArrowLeft, ChevronRight, Phone, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusLabel, getStatusColor, formatDate } from "@/lib/utils";

interface SearchResult {
  results: any[];
  total: number;
  source: string;
  customer?: any;
}

const STATUS_STEPS = [
  { key: "NEW", label: "Baru", index: 0 },
  { key: "ESTIMATED", label: "Estimasi", index: 1 },
  { key: "IN_PROGRESS", label: "Proses", index: 2 },
  { key: "COMPLETED", label: "Selesai", index: 3 },
  { key: "DELIVERED", label: "Diambil", index: 4 },
];

const INVOICE_STATUS: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PARTIAL: "Dibayar Sebagian",
  PAID: "Lunas",
};

export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [selectedWO, setSelectedWO] = useState<any>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3) {
      setError("Masukkan minimal 3 karakter");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSelectedWO(null);

    try {
      const res = await fetch(`/api/tracking?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mencari data");
        setLoading(false);
        return;
      }

      if (data.total === 0) {
        setError("Data tidak ditemukan. Periksa kembali nomor plat, HP, atau WO Anda.");
        setLoading(false);
        return;
      }

      setResult(data);
      if (data.results.length === 1) {
        setSelectedWO(data.results[0]);
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setSelectedWO(null);
    setError("");
    setQuery("");
  }

  const currentStepIndex = selectedWO
    ? STATUS_STEPS.find((s) => s.key === selectedWO.status)?.index ?? 0
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-950 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-80 h-80 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600 rounded-full blur-3xl" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
          <Car className="w-16 h-16 text-primary-400 mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Lacak Servis Anda
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Cek status service kendaraan Anda kapan saja. Cukup masukkan nomor polisi, nomor HP, atau nomor Work Order.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 focus-within:border-primary-500 transition-colors">
              <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(""); }}
                placeholder="B 1234 XYZ / 08123456789 / WO-240714-001"
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm sm:text-base outline-none py-2"
                autoComplete="off"
              />
              <Button type="submit" disabled={loading} className="rounded-xl">
                {loading ? "Mencari..." : "Cek Status"}
              </Button>
            </div>
            {error && !result && (
              <p className="text-red-400 text-sm mt-3 text-left ml-2">{error}</p>
            )}
          </form>

          <div className="flex justify-center gap-6 mt-8 text-gray-500 text-xs">
            <div className="flex items-center gap-1.5">
              <Car className="w-4 h-4" /> No. Plat
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> No. HP
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> No. WO
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-10 px-4">
        {result && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Back button */}
            <button onClick={reset} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <ArrowLeft className="w-4 h-4" /> Cek Kembali
            </button>

            {/* Customer info */}
            {result.customer && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 dark:text-primary-400 font-bold text-lg">
                      {result.customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{result.customer.name}</h3>
                    <p className="text-sm text-gray-500">{result.customer.phone}</p>
                  </div>
                  <div className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                    {result.total} Work Order ditemukan
                  </div>
                </div>
              </div>
            )}

            {/* Multiple WO list */}
            {result.results.length > 1 && !selectedWO && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Pilih Work Order:</h3>
                {result.results.map((wo: any) => (
                  <button
                    key={wo.id}
                    onClick={() => setSelectedWO(wo)}
                    className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left"
                  >
                    <div>
                      <p className="font-bold text-primary-600">{wo.orderNumber}</p>
                      <p className="text-sm text-gray-500">{wo.vehicle?.plateNumber || "-"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(wo.status)}>{getStatusLabel(wo.status)}</Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected WO Detail */}
            {selectedWO && (
              <div className="space-y-6">
                {/* WO Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Work Order</p>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{selectedWO.orderNumber}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Dibuat: {formatDate(selectedWO.createdAt)}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(selectedWO.status)} text-sm px-4 py-2`}>
                      {getStatusLabel(selectedWO.status)}
                    </Badge>
                  </div>

                  {/* Vehicle info */}
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500">Kendaraan</p>
                      <p className="font-semibold text-sm">
                        {selectedWO.vehicle?.brand} {selectedWO.vehicle?.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">No. Plat</p>
                      <p className="font-bold text-sm">{selectedWO.vehicle?.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tahun</p>
                      <p className="text-sm">{selectedWO.vehicle?.year}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mekanik</p>
                      <p className="text-sm">{selectedWO.mechanic?.name || "Belum ditugaskan"}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold mb-5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600" /> Progress Servis
                  </h3>

                  <div className="relative">
                    {/* Connecting line */}
                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div
                      className="absolute top-5 left-0 h-1 bg-primary-500 rounded-full transition-all duration-700"
                      style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                    />

                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= currentStepIndex;
                        const current = i === currentStepIndex;
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-2">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                                done
                                  ? current
                                    ? "bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-800 scale-110"
                                    : "bg-primary-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                              }`}
                            >
                              {done ? "✓" : i + 1}
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                current ? "text-primary-600 dark:text-primary-400" : done ? "text-gray-700 dark:text-gray-300" : "text-gray-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cancelled status */}
                  {selectedWO.status === "CANCELLED" && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                      <p className="text-red-700 dark:text-red-400 font-semibold">Work Order Dibatalkan</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold mb-3">Deskripsi / Keluhan</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedWO.description}</p>
                  {selectedWO.notes && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Catatan Teknisi:</p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">{selectedWO.notes}</p>
                    </div>
                  )}
                </div>

                {/* Items / Sparepart */}
                {selectedWO.items?.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 pb-2">
                      <h3 className="font-semibold">Detail Pekerjaan & Sparepart</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-xs font-semibold text-gray-500 uppercase">
                            <th className="px-6 py-3">Item</th>
                            <th className="px-6 py-3">Tipe</th>
                            <th className="px-6 py-3 text-center">Qty</th>
                            <th className="px-6 py-3 text-right">Harga</th>
                            <th className="px-6 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {selectedWO.items.map((item: any, i: number) => (
                            <tr key={i} className="text-sm">
                              <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                              <td className="px-6 py-3">
                                <Badge className={item.type === "SERVICE" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                                  {item.type === "SERVICE" ? "Jasa" : "Part"}
                                </Badge>
                              </td>
                              <td className="px-6 py-3 text-center">{item.quantity}</td>
                              <td className="px-6 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-6 py-3 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Invoice & Payment */}
                {selectedWO.invoice && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold mb-4">Ringkasan Biaya</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">No. Invoice</span><span className="font-bold text-primary-600">{selectedWO.invoice.invoiceNumber}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(selectedWO.invoice.subtotal)}</span></div>
                      {selectedWO.invoice.discount > 0 && (
                        <div className="flex justify-between"><span className="text-gray-500">Diskon</span><span className="text-green-600">-{formatCurrency(selectedWO.invoice.discount)}</span></div>
                      )}
                      <hr className="dark:border-gray-700" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary-600">{formatCurrency(selectedWO.invoice.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Terbayar</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(selectedWO.invoice.paid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sisa</span>
                        <span className={selectedWO.invoice.total - selectedWO.invoice.paid > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                          {formatCurrency(selectedWO.invoice.total - selectedWO.invoice.paid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-500">Status</span>
                        <Badge className={getStatusColor(selectedWO.invoice.status)}>
                          {INVOICE_STATUS[selectedWO.invoice.status] || selectedWO.invoice.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Past service history */}
                {selectedWO.vehicle?.workOrders?.length > 1 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold mb-4">Riwayat Servis Sebelumnya</h3>
                    <div className="space-y-3">
                      {selectedWO.vehicle.workOrders
                        .filter((h: any) => h.id !== selectedWO.id)
                        .slice(0, 5)
                        .map((h: any) => (
                          <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                            <div>
                              <p className="font-bold text-sm text-primary-600">{h.orderNumber}</p>
                              <p className="text-xs text-gray-500">{formatDate(h.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(h.status)}>{getStatusLabel(h.status)}</Badge>
                              {h.invoice && (
                                <p className="text-xs text-gray-500 mt-1">{formatCurrency(h.invoice.total)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 py-6 px-4 text-center text-sm border-t border-gray-800">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Wrench className="w-4 h-4" /> BengkelPro
        </div>
        <p>© {new Date().getFullYear()} BengkelPro — Sistem Manajemen Bengkel</p>
      </footer>
    </div>
  );
}
