import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function DesaPage() {
  const toast = useToast();
  const [desas, setDesas] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesa, setEditingDesa] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [namaDesa, setNamaDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDesa, setDeletingDesa] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDesas = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/desa?page=${page}&limit=10`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      const res = await api.get(url);
      setDesas(res.data.items || []);
      setPagination(res.data.pagination || {});
    } catch {
      toast.error('Gagal memuat data desa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesas(1);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingDesa(null);
    setNamaDesa('');
    setKecamatan('');
    setModalOpen(true);
  };

  const handleOpenEdit = (desa) => {
    setEditingDesa(desa);
    setNamaDesa(desa.nama_desa);
    setKecamatan(desa.kecamatan);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nama_desa: namaDesa.trim(),
      kecamatan: kecamatan.trim(),
    };

    setModalLoading(true);
    try {
      if (editingDesa) {
        await api.put(`/desa/${editingDesa.id}`, payload);
        toast.success('Data desa berhasil diperbarui');
      } else {
        await api.post('/desa', payload);
        toast.success('Desa baru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchDesas(pagination.current_page || 1);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Gagal menyimpan data desa');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRequestDelete = (desa) => {
    setDeletingDesa(desa);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDesa) return;
    setDeleteLoading(true);
    try {
      await api.del(`/desa/${deletingDesa.id}`);
      toast.success('Desa berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingDesa(null);
      fetchDesas(pagination.current_page || 1);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Gagal menghapus desa');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F3F4F3] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#165DFF]/10 text-[#165DFF] flex items-center justify-center font-bold">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#080C1A]">Master Data Desa</h2>
            <p className="text-xs text-[#6A7686]">Kelola desa dan kecamatan penyelenggara pilkel di Tabanan</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari desa atau kecamatan..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs focus:bg-white focus:border-[#165DFF] outline-none"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-[#165DFF] hover:bg-[#0E4BD9] text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-lg shadow-[#165DFF]/20 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="size-4" />
            <span>Tambah Desa</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#F3F4F3] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F3] bg-[#EFF2F7]/40 text-[#6A7686] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Nama Desa</th>
                <th className="py-3.5 px-6">Kecamatan</th>
                <th className="py-3.5 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F3]">
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-12">
                    <Loader2 className="size-6 animate-spin text-[#165DFF] mx-auto" />
                  </td>
                </tr>
              ) : desas.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-sm text-[#6A7686]">
                    Tidak ada data desa yang ditemukan.
                  </td>
                </tr>
              ) : (
                desas.map((d) => (
                  <tr key={d.id} className="hover:bg-[#EFF2F7]/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#080C1A]">Desa {d.nama_desa}</td>
                    <td className="py-4 px-6 text-xs text-[#6A7686] font-medium">{d.kecamatan}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#165DFF]/10 text-[#6A7686] hover:text-[#165DFF] flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Desa"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(d)}
                          className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#ED6B60]/10 text-[#6A7686] hover:text-[#ED6B60] flex items-center justify-center transition-colors cursor-pointer"
                          title="Hapus Desa"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.total_pages > 1 && (
          <div className="p-4 border-t border-[#F3F4F3] flex items-center justify-between text-xs text-[#6A7686]">
            <span>
              Menampilkan {desas.length} dari {pagination.total_records} data desa
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.has_prev}
                onClick={() => fetchDesas(pagination.current_page - 1)}
                className="size-8 rounded-lg border border-[#F3F4F3] flex items-center justify-center hover:bg-[#EFF2F7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="font-semibold text-[#080C1A]">
                {pagination.current_page} / {pagination.total_pages}
              </span>
              <button
                disabled={!pagination.has_next}
                onClick={() => fetchDesas(pagination.current_page + 1)}
                className="size-8 rounded-lg border border-[#F3F4F3] flex items-center justify-center hover:bg-[#EFF2F7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Desa */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F3]">
              <h3 className="font-bold text-lg text-[#080C1A]">
                {editingDesa ? 'Edit Data Desa' : 'Tambah Desa Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="size-8 rounded-full bg-[#EFF2F7] text-[#6A7686] hover:text-[#080C1A] flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                  Nama Desa
                </label>
                <input
                  type="text"
                  value={namaDesa}
                  onChange={(e) => setNamaDesa(e.target.value)}
                  required
                  placeholder="Contoh: Mundeh Kauh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  required
                  placeholder="Contoh: Selemadeg Barat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F3F4F3]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#F3F4F3] text-xs font-semibold text-[#6A7686] hover:bg-[#EFF2F7] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-[#165DFF] hover:bg-[#0E4BD9] text-white text-xs font-semibold shadow-lg shadow-[#165DFF]/20 flex items-center gap-2 cursor-pointer"
                >
                  {modalLoading && <Loader2 className="size-4 animate-spin" />}
                  <span>{editingDesa ? 'Simpan Perubahan' : 'Tambah Desa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingDesa(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Master Desa"
        message={`Apakah Anda yakin ingin menghapus data Desa ${deletingDesa?.nama_desa}? Seluruh TPS dan data calon terkait pada desa ini akan ikut terhapus.`}
        confirmText="Hapus Desa"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
