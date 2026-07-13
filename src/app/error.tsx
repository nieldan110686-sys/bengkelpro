"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Terjadi Kesalahan</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        {error.message || "Terjadi kesalahan saat memuat halaman. Pastikan database sudah tersambung."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}
