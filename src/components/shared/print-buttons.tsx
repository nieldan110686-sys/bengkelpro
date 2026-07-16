"use client";

import { useRef } from "react";
import { Download, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface PrintButtonsProps {
  invoiceId?: string;
  workOrderId?: string;
  variant?: "inline" | "button" | "icon";
  label?: string;
}

export default function PrintButtons({ invoiceId, workOrderId, variant = "button", label }: PrintButtonsProps) {
  const loading = useRef(false);

  async function handlePDF(type: "invoice" | "jobcard", id: string) {
    if (loading.current) return;
    loading.current = true;
    try {
      const res = await fetch(`/api/pdf?type=${type}&id=${id}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      toast.error("Gagal generate PDF");
    }
    loading.current = false;
  }

  if (variant === "icon") {
    return (
      <div className="flex gap-1">
        {invoiceId && (
          <button onClick={() => handlePDF("invoice", invoiceId)} title="PDF Invoice"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <FileText className="w-4 h-4 text-gray-500" />
          </button>
        )}
        {workOrderId && (
          <button onClick={() => handlePDF("jobcard", workOrderId)} title="PDF Job Card"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <Printer className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {invoiceId && (
        <Button variant="outline" size="sm" onClick={() => handlePDF("invoice", invoiceId)}>
          <Download className="w-3.5 h-3.5" /> {label || "PDF Invoice"}
        </Button>
      )}
      {workOrderId && (
        <Button variant="outline" size="sm" onClick={() => handlePDF("jobcard", workOrderId)}>
          <Printer className="w-3.5 h-3.5" /> {label || "Print Job Card"}
        </Button>
      )}
    </div>
  );
}
