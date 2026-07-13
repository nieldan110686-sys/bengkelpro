"use client";

import { Button } from "@/components/ui/button";

interface TableProps<T> {
  data: T[];
  columns: { key: string; label: string; render?: (item: T) => React.ReactNode; className?: string }[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({ data, columns, onRowClick, loading, emptyMessage }: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mr-3" />
        Memuat...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage || "Tidak ada data"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map(({ key, label, className }) => (
              <th key={key} className={`text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 ${className || ""}`}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((item, i) => (
            <tr
              key={item.id || i}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" : ""}
            >
              {columns.map(({ key, render, className }) => (
                <td key={key} className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${className || ""}`}>
                  {render ? render(item) : item[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Sebelumnya
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
