"use client";

import { useEffect, useState } from "react";
import { Table } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/lib/utils";

interface WorkOrder {
  id: string; orderNumber: string; customerName: string;
  vehicle: { plateNumber: string; brand: string; model: string; customer: { name: string } };
  mechanic?: { name: string } | null;
  status: string;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/work-orders?limit=50")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { setWorkOrders(d.workOrders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Work Order</h1><p className="text-gray-500 mt-1">Kelola servis & antrian bengkel</p></div>
      <Card>
        <CardContent className="p-0">
          <Table loading={loading} data={workOrders}
            emptyMessage="Belum ada work order. Hubungkan database dan jalankan seed."
            columns={[
              { key: "orderNumber", label: "No. WO", render: (wo) => <span className="font-bold text-primary-600">{wo.orderNumber}</span> },
              { key: "customer", label: "Pelanggan", render: (wo) => wo.vehicle?.customer?.name || wo.customerName },
              { key: "vehicle", label: "Kendaraan", render: (wo) => `${wo.vehicle?.brand || ""} ${wo.vehicle?.model || ""} (${wo.vehicle?.plateNumber || ""})` },
              { key: "status", label: "Status", render: (wo) => <Badge className={getStatusColor(wo.status)}>{getStatusLabel(wo.status)}</Badge> },
              { key: "mechanic", label: "Mekanik", render: (wo) => wo.mechanic?.name || "-" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
