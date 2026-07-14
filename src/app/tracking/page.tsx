"use client";

import { useState, useCallback } from "react";
import { Search, Car, Clock, MapPin, AlertCircle, CheckCircle2, ShieldCheck, ChevronRight, ArrowLeft, Wrench as WrenchIcon, FileText, Phone, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusLabel, getStatusColor, formatDate } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────
interface SearchResult {
  results: any[];
  total: number;
  source: string;
  customer?: any;
}

// ─── Constants ──────────────────────────────────────────
const STATUS_STEPS = [
  { key: "NEW", label: "Baru", icon: FileText },
  { key: "ESTIMATED", label: "Estimasi", icon: Clock },
  { key: "IN_PROGRESS", label: "Proses", icon: WrenchIcon },
  { key: "COMPLETED", label: "Selesai", icon: CheckCircle2 },
  { key: "DELIVERED", label: "Diambil", icon: ShieldCheck },
];

const INVOICE_STATUS: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PARTIAL: "Dibayar Sebagian",
  PAID: "Lunas",
};

const VEHICLE_BRANDS: Record<string, string> = {
  toyota: "/brands/toyota.png",
  honda: "/brands/honda.png",
  daihatsu: "/brands/daihatsu.png",
  suzuki: "/brands/suzuki.png",
  mitsubishi: "/brands/mitsubishi.png",
  nissan: "/brands/nissan.png",
  wuling: "/brands/wuling.png",
  bmw: "/brands/bmw.png",
  mercedes: "/brands/mercedes.png",
};

function CarBrandIcon({ brand }: { brand: string }) {
  const key = brand?.toLowerCase();
  if (VEHICLE_BRANDS[key]) {
    return <img src={VEHICLE_BRANDS[key]} alt={brand} className="w-10 h-10 object-contain opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  return <Car className="w-10 h-10 text-gray-300" />;
}

// ─── Sub Components ─────────────────────────────────────
function SearchForm({ onSearch, loading }: { onSearch: (q: string) => void; loading: boolean }) {
  const [q, setQ] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(q); }} className="flex items-stretch gap-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition-all">
      <span className="flex items-center pl-5 text-gray-300"><Search className="w-5 h-5" /></span>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Plat kendaraan / No. HP / No. Work Order"
        className="flex-1 bg-transparent px-4 py-3.5 text-gray-800 placeholder-gray-400 text-base outline-none"
        autoComplete="off"
      />
      <button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold px-6 sm:px-8 text-sm transition-colors">
        {loading ? "Mencari..." : "Lacak"}
      </button>
    </form>
  );
}

function ProgressBar({ status }: { status: string }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center justify-between gap-1">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        const isCancelled = status === "CANCELLED";
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center">
              {/* Line before */}
              {i > 0 && (
                <div className={`absolute right-1/2 w-full h-0.5 ${done && !isCancelled ? "bg-emerald-500" : "bg-gray-200"}`} />
              )}
              {/* Circle */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isCancelled ? "bg-red-100 text-red-400" :
                  done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                {done && !isCancelled ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
            </div>
            <span className={`text-[10px] mt-1.5 font-medium ${
              active && !isCancelled ? "text-emerald-600" :
              done && !isCancelled ? "text-gray-600" :
              "text-gray-400"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function NotFoundMessage({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
      <div className="w-16 h-16 mx-auto mb-5 bg-amber-50 rounded-full flex items-center justify-center">
        <Search className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">Work Order Tidak Ditemukan</h3>
      <p className="text-gray-500 text-sm mb-6">Periksa kembali nomor plat, HP, atau WO. Pastikan minimal 3 karakter.</p>
      <button onClick={onBack} className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm">
        <ArrowLeft className="w-4 h-4" /> Cek Kembali
      </button>
    </div>
  );
}

function MultipleResults({ results, onSelect }: { results: any[]; onSelect: (wo: any) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ditemukan {results.length} Work Order</h3>
      {results.map((wo) => (
        <button key={wo.id} onClick={() => onSelect(wo)}
          className="w-full bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-amber-300 hover:shadow-md transition-all text-left group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="font-bold text-gray-800 group-hover:text-amber-600 transition-colors">{wo.orderNumber}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {wo.vehicle?.plateNumber || "-"}</span>
                <span>{formatDate(wo.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(wo.status)}>{getStatusLabel(wo.status)}</Badge>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-400 transition-colors" />
          </div>
        </button>
      ))}
    </div>
  );
}

function WODetail({ wo, onBack }: { wo: any; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Cek Kembali
      </button>

      {/* WO Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-4">
            <CarBrandIcon brand={wo.vehicle?.brand} />
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">Work Order</p>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">{wo.orderNumber}</h2>
              <p className="text-sm text-gray-400 mt-1">{formatDate(wo.createdAt)}</p>
            </div>
          </div>
          <Badge className={`${getStatusColor(wo.status)} px-3 py-1.5 text-xs font-semibold`}>
            {getStatusLabel(wo.status)}
          </Badge>
        </div>

        {/* Vehicle Info Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Kendaraan", value: `${wo.vehicle?.brand || ""} ${wo.vehicle?.model || ""} (${wo.vehicle?.year || "-"})` },
            { label: "No. Plat", value: wo.vehicle?.plateNumber || "-", highlight: true },
            { label: "Mekanik", value: wo.mechanic?.name || "Menunggu penugasan" },
            { label: "Pelanggan", value: wo.customerName },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{label}</p>
              <p className={`text-sm ${highlight ? "font-bold text-gray-900" : "text-gray-700"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">Progress</h3>
        <ProgressBar status={wo.status} />
        {wo.status === "CANCELLED" && (
          <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-600 text-sm font-semibold">Work Order Dibatalkan</p>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Keluhan</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{wo.description}</p>
        {wo.notes && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold mb-1">Catatan Teknisi</p>
            <p className="text-sm text-amber-800">{wo.notes}</p>
          </div>
        )}
      </div>

      {/* Items */}
      {wo.items?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 pb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pekerjaan & Sparepart</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3 rounded-tl-lg">Item</th>
                  <th className="px-6 py-3">Tipe</th>
                  <th className="px-6 py-3 text-center">Qty</th>
                  <th className="px-6 py-3 text-right">Harga</th>
                  <th className="px-6 py-3 text-right rounded-tr-lg">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {wo.items.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-800">{item.name}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.type === "SERVICE" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                        {item.type === "SERVICE" ? "Jasa" : "Part"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-600">{item.quantity}</td>
                    <td className="px-6 py-3.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-800">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice */}
      {wo.invoice && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Ringkasan Biaya</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">No. Invoice</span><span className="font-bold text-gray-800">{wo.invoice.invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="text-gray-700">{formatCurrency(wo.invoice.subtotal)}</span></div>
            {wo.invoice.discount > 0 && (
              <div className="flex justify-between"><span className="text-gray-400">Diskon</span><span className="text-emerald-600">-{formatCurrency(wo.invoice.discount)}</span></div>
            )}
            <div className="border-t border-gray-200 my-2" />
            <div className="flex justify-between text-base font-bold">
              <span className="text-gray-800">Total</span>
              <span className="text-gray-900">{formatCurrency(wo.invoice.total)}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-400">Terbayar</span><span className="text-emerald-600 font-semibold">{formatCurrency(wo.invoice.paid)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Sisa</span>
              <span className={wo.invoice.total - wo.invoice.paid > 0 ? "text-red-500 font-bold" : "text-emerald-600 font-semibold"}>
                {formatCurrency(wo.invoice.total - wo.invoice.paid)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-gray-400 text-xs">Status Pembayaran</span>
              <Badge className={getStatusColor(wo.invoice.status)}>{INVOICE_STATUS[wo.invoice.status] || wo.invoice.status}</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Service History */}
      {wo.vehicle?.workOrders?.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Riwayat Servis Sebelumnya
          </h3>
          <div className="divide-y divide-gray-100">
            {wo.vehicle.workOrders
              .filter((h: any) => h.id !== wo.id)
              .slice(0, 5)
              .map((h: any) => (
                <div key={h.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{h.orderNumber}</p>
                      <p className="text-xs text-gray-400">{formatDate(h.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {h.invoice && <span className="text-xs text-gray-500">{formatCurrency(h.invoice.total)}</span>}
                    <Badge className={getStatusColor(h.status)}>{getStatusLabel(h.status)}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function TrackingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [selectedWO, setSelectedWO] = useState<any>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length < 3) { setError("Masukkan minimal 3 karakter"); return; }
    setLoading(true); setError(""); setResult(null); setSelectedWO(null);

    try {
      const res = await fetch(`/api/tracking?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal mencari"); return; }
      if (data.total === 0) { setError("Data tidak ditemukan"); return; }
      setResult(data);
      if (data.results.length === 1) setSelectedWO(data.results[0]);
    } catch { setError("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  }, []);

  function resetToResults() { setSelectedWO(null); }
  function resetAll() { setResult(null); setSelectedWO(null); setError(""); }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      {/* ─── Hero ─────────────────────────────────── */}
      <header className="relative bg-white border-b border-gray-100">
        {/* Subtle top-line accent */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20">
          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
              <WrenchIcon className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <h1 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Lacak Servis Kendaraan
          </h1>
          <p className="text-center text-gray-500 mt-2 text-sm sm:text-base max-w-lg mx-auto">
            Cek status, biaya, dan progress perbaikan mobil Anda — real-time dan transparan.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-lg mx-auto">
            <SearchForm onSearch={handleSearch} loading={loading} />
            {error && !result && (
              <p className="text-red-500 text-xs mt-2.5 ml-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>

          {/* Hint pills */}
          <div className="flex justify-center flex-wrap gap-3 mt-6">
            {[
              { icon: Car, label: "Plat nomor" },
              { icon: Phone, label: "No. HP" },
              { icon: FileText, label: "No. WO" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200">
                <Icon className="w-3 h-3" /> {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Results ──────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-10">
        {result && !selectedWO && result.total > 1 && (
          <MultipleResults results={result.results} onSelect={(wo) => setSelectedWO(wo)} />
        )}

        {result && result.total === 0 && <NotFoundMessage onBack={resetAll} />}

        {selectedWO && <WODetail wo={selectedWO} onBack={result && result.total > 1 ? resetToResults : resetAll} />}
      </main>

      {/* ─── Footer ───────────────────────────────── */}
      <footer className="bg-gray-900 py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <WrenchIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>BengkelPro</span>
          <span className="text-gray-700">—</span>
          <span className="text-gray-600">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
