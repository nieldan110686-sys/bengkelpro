"use client";

import { Settings, User, Bell, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Pengaturan</h1><p className="text-gray-500 mt-1">Konfigurasi aplikasi</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Profil Akun</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Nama</label><input className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" defaultValue="Admin" /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" defaultValue="admin@bengkelpro.com" /></div>
            <div><label className="block text-sm font-medium mb-1">Password Baru</label><input type="password" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notifikasi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3"><input type="checkbox" defaultChecked className="rounded" />Notifikasi stok menipis</label>
            <label className="flex items-center gap-3"><input type="checkbox" defaultChecked className="rounded" />Notifikasi WO baru</label>
            <label className="flex items-center gap-3"><input type="checkbox" defaultChecked className="rounded" />Notifikasi servis selesai</label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" />Backup Data</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-500">Fitur backup akan tersedia di versi Enterprise.</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Informasi Sistem</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Versi</span><span>1.0.0</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Framework</span><span>Next.js 15</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Database</span><span>PostgreSQL + Prisma</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Paket</span><span>Professional</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
