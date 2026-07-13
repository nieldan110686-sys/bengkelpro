"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registrasi gagal");
        return;
      }
      toast.success("Registrasi berhasil! Silakan login.");
      router.push("/login");
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BengkelPro</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Daftar Akun Baru</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-4">
          {(["name", "email", "password", "confirmPassword"] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 capitalize">
                {field === "confirmPassword" ? "Konfirmasi Password" : field === "name" ? "Nama" : field}
              </label>
              <input
                type={field.includes("password") ? "password" : field === "email" ? "email" : "text"}
                name={field}
                value={form[field]}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder={field === "confirmPassword" ? "Ulangi password" : `Masukkan ${field}`}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors">
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Sudah punya akun? <a href="/login" className="text-primary-600 hover:underline font-medium">Masuk</a>
          </p>
        </form>
      </div>
    </div>
  );
}
