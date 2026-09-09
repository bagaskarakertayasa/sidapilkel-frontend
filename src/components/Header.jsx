import React from 'react';
import { Menu, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  dashboard: 'Dashboard Utama',
  rekap: 'Rekapitulasi Hasil Suara Pilkel',
  tps: 'Data TPS & Penghitungan Suara',
  calon: 'Calon Perbekel',
  desa: 'Master Data Desa & Wilayah',
  users: 'Manajemen Akun Pengguna',
};

export default function Header({ currentPage, onToggleSidebar }) {
  const { user, isAdminPusat } = useAuth();

  return (
    <header className="flex items-center justify-between h-[90px] border-b border-[#F3F4F3] bg-white px-5 md:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden size-10 flex items-center justify-center rounded-xl bg-[#EFF2F7] hover:bg-[#165DFF]/10 hover:text-[#165DFF] transition-colors cursor-pointer"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <h2 className="font-bold text-xl md:text-2xl text-[#080C1A]">
            {PAGE_TITLES[currentPage] || 'SIDAPILKEL'}
          </h2>
          <p className="text-xs text-[#6A7686] hidden sm:block">
            Sistem Informasi Data Pemilihan Perbekel Kabupaten Tabanan
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EFF2F7] border border-[#F3F4F3]">
          {isAdminPusat ? (
            <>
              <ShieldCheck className="size-4 text-[#165DFF]" />
              <span className="text-xs font-bold text-[#165DFF]">Admin Pusat</span>
            </>
          ) : (
            <>
              <MapPin className="size-4 text-[#30B22D]" />
              <span className="text-xs font-bold text-[#30B22D]">
                {user?.desa?.nama_desa || user?.nama_desa ? `Desa ${user?.desa?.nama_desa || user?.nama_desa}` : 'Desa'}
              </span>
            </>
          )}
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#F3F4F3]">
          <div className="text-right hidden md:block">
            <p className="font-bold text-sm text-[#080C1A]">{user?.nama || user?.username}</p>
            <p className="text-[#6A7686] text-xs capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
          </div>
          <div className="size-10 rounded-full bg-[#165DFF] text-white flex items-center justify-center font-bold text-sm ring-2 ring-[#F3F4F3]">
            {user?.nama ? user.nama.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
