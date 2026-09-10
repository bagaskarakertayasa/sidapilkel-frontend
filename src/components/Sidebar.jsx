import React, { useState } from 'react';
import {
  LayoutDashboard,
  Vote,
  Users,
  Building2,
  UserCog,
  LogOut,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';

export default function Sidebar({ currentPage, setCurrentPage, isOpen, setIsOpen }) {
  const { user, isAdminPusat, logout } = useAuth();
  const toast = useToast();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    toast.success('Berhasil keluar akun');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN_PUSAT', 'ADMIN_DESA'],
    },
    {
      id: 'rekap',
      label: 'Rekapitulasi Suara',
      icon: FileSpreadsheet,
      roles: ['ADMIN_PUSAT', 'ADMIN_DESA'],
    },
    {
      id: 'tps',
      label: 'Data TPS & Hasil',
      icon: Vote,
      roles: ['ADMIN_PUSAT', 'ADMIN_DESA'],
    },
    {
      id: 'calon',
      label: 'Calon Perbekel',
      icon: Users,
      roles: ['ADMIN_PUSAT', 'ADMIN_DESA'],
    },
    {
      id: 'desa',
      label: 'Master Data Desa',
      icon: Building2,
      roles: ['ADMIN_PUSAT'],
    },
    {
      id: 'users',
      label: 'Manajemen Pengguna',
      icon: UserCog,
      roles: ['ADMIN_PUSAT'],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`flex flex-col w-[280px] h-screen fixed left-0 top-0 z-50 bg-white border-r border-[#F3F4F3] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-[90px] px-6 border-b border-[#F3F4F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img src="/favicon.png" alt="Logo Kabupaten Tabanan" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-[#080C1A]">SIDAPILKEL</h1>
              <p className="text-[11px] font-semibold text-[#6A7686] uppercase tracking-wider">
                Kabupaten Tabanan
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-[#6A7686] hover:text-[#080C1A]"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-5 gap-6 overflow-y-auto flex-1 scrollbar-hide">
          <div>
            <h3 className="font-bold text-xs text-[#6A7686] uppercase tracking-wider mb-4 px-2">
              Menu Utama
            </h3>
            <div className="flex flex-col gap-1.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center rounded-xl p-3.5 gap-3 font-semibold transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#165DFF]/10 text-[#165DFF]'
                        : 'text-[#6A7686] hover:bg-[#EFF2F7] hover:text-[#080C1A]'
                    }`}
                  >
                    <Icon className="size-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User Footer / Logout */}
        <div className="p-5 border-t border-[#F3F4F3] bg-[#F1F3F6]/40">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="size-10 rounded-xl bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] font-bold">
              {user?.nama ? user.nama.charAt(0).toUpperCase() : (user?.nama_depan ? user.nama_depan.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#080C1A] truncate">
                {user?.nama || (user?.nama_depan ? `${user.nama_depan} ${user.nama_belakang || ''}`.trim() : user?.username)}
              </p>
              <p className="text-xs text-[#6A7686] truncate">
                {isAdminPusat ? 'Admin Kabupaten' : `Desa ${user?.desa?.nama_desa || user?.nama_desa || ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#ED6B60]/30 text-[#ED6B60] hover:bg-[#ED6B60] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Confirmation Modal for Logout */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Keluar dari Sistem"
        message="Apakah Anda yakin ingin keluar dari aplikasi ini?"
        confirmText="Keluar"
        cancelText="Batal"
        type="logout"
      />
    </>
  );
}
