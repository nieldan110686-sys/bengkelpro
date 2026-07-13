"use client";

import { useEffect, useState } from "react";
import { Table } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatCurrency } from "@/lib/utils";

interface Invoice {
  id: string; invoiceNumber: string; status: string; total: number; paid: number;
  workOrder: { orderNumber: string; customerName: string };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices?limit=50")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { setInvoices(d.invoices || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Invoice</h1><p className="text-gray-500 mt-1">Kelola invoice & pembayaran</p></div>
      <Card>
        <CardContent className="p-0">
          <Table loading={loading} data={invoices}
            emptyMessage="Belum ada invoice. Invoice dibuat otomatis saat work order selesai."
            columns={[
              { key: "invoiceNumber", label: "No. Invoice", render: (i) => <span className="font-bold text-primary-600">{i.invoiceNumber}</span> },
              { key: "workOrder", label: "WO", render: (i) => i.workOrder?.orderNumber || "-" },
              { key: "workOrder.customerName", label: "Pelanggan", render: (i) => i.workOrder?.customerName || "-" },
              { key: "total", label: "Total", render: (i) => formatCurrency(i.total) },
              { key: "status", label: "Status", render: (i) => <Badge className={getStatusColor(i.status)}>{getStatusLabel(i.status)}</Badge> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
