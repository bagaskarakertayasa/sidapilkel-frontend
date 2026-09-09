import React, { useState, useEffect } from 'react';
import {
  Vote,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function TPSPage() {
  const { user, isAdminPusat } = useAuth();
  const toast = useToast();

  const [tpsList, setTpsList] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    limit: 10,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDesaId, setSelectedDesaId] = useState(user?.desa_id || '');
  const [desas, setDesas] = useState([]);

  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTps, setEditingTps] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [calonList, setCalonList] = useState([]);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTps, setDeletingTps] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [formDesaId, setFormDesaId] = useState('');
  const [formNoTps, setFormNoTps] = useState('');
  const [formBanjarTps, setFormBanjarTps] = useState('');
  const [formJmlPmlTetap, setFormJmlPmlTetap] = useState('');
  const [formMgnHakSuara, setFormMgnHakSuara] = useState('');
  const [formTdkMgnHakSuara, setFormTdkMgnHakSuara] = useState('');
  const [formSuaraTdkSah, setFormSuaraTdkSah] = useState('0');
  const [formCalonVotes, setFormCalonVotes] = useState({}); // { [calon_id]: votes }

  // Load Desas list for dropdowns
  useEffect(() => {
    api.get('/desa/simple')
      .then((res) => setDesas(res.data || []))
      .catch(() => {});
  }, []);

  const fetchTPS = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/tps?page=${page}&limit=10`;
      if (debouncedSearch.trim()) url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      if (selectedDesaId && !isAdminPusat) url += `&desa_id=${selectedDesaId}`;

      const res = await api.get(url);
      setTpsList(res.data.items || []);
      setPagination(res.data.pagination || {});
    } catch {
      toast.error('Gagal mengambil data TPS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTPS(1);
  }, [debouncedSearch, selectedDesaId]);

  // Load Calon when Desa changes inside Modal
  const loadCalonForDesa = async (desaId) => {
    if (!desaId) {
      setCalonList([]);
      return;
    }
    try {
      const res = await api.get(`/calon/desa/${desaId}`);
      const list = res.data || [];
      list.sort((a, b) => Number(a.no_urut) - Number(b.no_urut));
      setCalonList(list);
    } catch {
      toast.error('Gagal memuat daftar calon desa');
    }
  };

  const handleOpenAdd = () => {
    setEditingTps(null);
    const defaultDesaId = isAdminPusat ? (selectedDesaId || (desas[0]?.id || '')) : user?.desa_id;
    setFormDesaId(defaultDesaId);
    setFormNoTps('');
    setFormBanjarTps('');
    setFormJmlPmlTetap('');
    setFormMgnHakSuara('');
    setFormTdkMgnHakSuara('');
    setFormSuaraTdkSah('0');
    setFormCalonVotes({});
    loadCalonForDesa(defaultDesaId);
    setModalOpen(true);
  };

  const handleOpenEdit = async (tps) => {
    setEditingTps(tps);
    setFormDesaId(tps.desa_id);
    setFormNoTps(tps.no_tps);
    setFormBanjarTps(tps.banjar_tps);
    setFormJmlPmlTetap(tps.jml_pml_tetap);
    setFormMgnHakSuara(tps.mgn_hak_suara);
    setFormTdkMgnHakSuara(tps.tdk_mgn_hak_suara);
    setFormSuaraTdkSah(tps.suara_tdk_sah);

    // Fill votes
    const votesObj = {};
    if (tps.calon_votes) {
      tps.calon_votes.forEach((v) => {
        votesObj[v.calon_id] = v.jumlah_suara;
      });
    }
    setFormCalonVotes(votesObj);

    await loadCalonForDesa(tps.desa_id);
    setModalOpen(true);
  };

  const handleDesaChangeInModal = (e) => {
    const dId = e.target.value;
    setFormDesaId(dId);
    setFormCalonVotes({});
    loadCalonForDesa(dId);
  };

  // Helper calculations for validation feedback
  const totalSuaraSahCalc = Object.values(formCalonVotes).reduce(
    (acc, val) => acc + (parseInt(val) || 0),
    0
  );
  const totalSuaraMasukCalc = totalSuaraSahCalc + (parseInt(formSuaraTdkSah) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (calonList.length === 0) {
      toast.error('Desa ini belum memiliki calon perbekel. Daftarkan calon terlebih dahulu!');
      return;
    }

    const payload = {
      desa_id: formDesaId,
      no_tps: parseInt(formNoTps),
      banjar_tps: formBanjarTps,
      jml_pml_tetap: parseInt(formJmlPmlTetap) || 0,
      mgn_hak_suara: parseInt(formMgnHakSuara) || totalSuaraMasukCalc,
      tdk_mgn_hak_suara: parseInt(formTdkMgnHakSuara) || Math.max(0, (parseInt(formJmlPmlTetap) || 0) - (parseInt(formMgnHakSuara) || totalSuaraMasukCalc)),
      suara_tdk_sah: parseInt(formSuaraTdkSah) || 0,
      calon_votes: calonList.map((c) => ({
        calon_id: c.id,
        jumlah_suara: parseInt(formCalonVotes[c.id]) || 0,
      })),
    };

    setModalLoading(true);
    try {
      if (editingTps) {
        await api.put(`/tps/${editingTps.id}`, payload);
        toast.success('Data TPS berhasil diperbarui');
      } else {
        await api.post('/tps', payload);
        toast.success('Data TPS berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchTPS(pagination.current_page || 1);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Gagal menyimpan TPS');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRequestDelete = (tps) => {
    setDeletingTps(tps);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTps) return;
    setDeleteLoading(true);
    try {
      await api.del(`/tps/${deletingTps.id}`);
      toast.success('Data TPS berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingTps(null);
      fetchTPS(pagination.current_page || 1);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Gagal menghapus TPS');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F3F4F3] shadow-sm">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAdminPusat ? "Cari Desa, Banjar, atau Nomor TPS..." : "Cari Banjar atau Nomor TPS..."}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs focus:bg-white focus:border-[#165DFF] outline-none"
            />
          </div>
        </div>

        {!isAdminPusat && (
          <button
            onClick={handleOpenAdd}
            className="bg-[#165DFF] hover:bg-[#0E4BD9] text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-[#165DFF]/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="size-4" />
            <span>Tambah TPS Baru</span>
          </button>
        )}
      </div>

      {/* TPS Table */}
      <div className="rounded-2xl border border-[#F3F4F3] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F3] bg-[#EFF2F7]/40 text-[#6A7686] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">TPS / Lokasi</th>
                {isAdminPusat && <th className="py-3.5 px-6">Desa</th>}
                <th className="py-3.5 px-6 text-right">DPT</th>
                <th className="py-3.5 px-6 text-right">Hadir</th>
                <th className="py-3.5 px-6 text-right">Suara Sah</th>
                <th className="py-3.5 px-6 text-right">Tdk Sah</th>
                <th className="py-3.5 px-6">Rincian Calon</th>
                {!isAdminPusat && <th className="py-3.5 px-6 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F3]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="size-6 animate-spin text-[#165DFF] mx-auto" />
                  </td>
                </tr>
              ) : tpsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-[#6A7686]">
                    Tidak ada data TPS yang ditemukan.
                  </td>
                </tr>
              ) : (
                tpsList.map((tps) => (
                  <tr key={tps.id} className="hover:bg-[#EFF2F7]/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#080C1A]">TPS {tps.no_tps}</p>
                      <p className="text-xs text-[#6A7686]">{tps.banjar_tps}</p>
                    </td>
                    {isAdminPusat && (
                      <td className="py-4 px-6 text-xs font-semibold text-[#080C1A]">
                        {tps.desa?.nama_desa || tps.nama_desa || '-'}
                      </td>
                    )}
                    <td className="py-4 px-6 text-right text-xs font-medium">
                      {tps.jml_pml_tetap?.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6 text-right text-xs font-medium text-[#165DFF]">
                      {tps.mgn_hak_suara?.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6 text-right text-xs font-semibold text-[#30B22D]">
                      {tps.suara_sah?.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6 text-right text-xs font-semibold text-[#ED6B60]">
                      {tps.suara_tdk_sah?.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {(tps.calon_votes || [])
                          .slice()
                          .sort((a, b) => {
                            const noA = Number(a.no_urut ?? a.calon?.no_urut ?? 9999);
                            const noB = Number(b.no_urut ?? b.calon?.no_urut ?? 9999);
                            return noA - noB;
                          })
                          .map((v) => {
                            const noUrut = v.no_urut ?? v.calon?.no_urut;
                            return (
                              <span
                                key={v.id || v.calon_id}
                                className="inline-flex items-center text-[10px] bg-[#EFF2F7] px-2 py-0.5 rounded-lg border border-[#F3F4F3] font-medium"
                              >
                                <b className="mr-1">#{noUrut ?? '?'}:</b> {v.jumlah_suara}
                              </span>
                            );
                          })}
                      </div>
                    </td>
                    {!isAdminPusat && (
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(tps)}
                            className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#165DFF]/10 text-[#6A7686] hover:text-[#165DFF] flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit TPS"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleRequestDelete(tps)}
                            className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#ED6B60]/10 text-[#6A7686] hover:text-[#ED6B60] flex items-center justify-center transition-colors cursor-pointer"
                            title="Hapus TPS"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
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
              Menampilkan {tpsList.length} dari {pagination.total_records} data TPS
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.has_prev}
                onClick={() => fetchTPS(pagination.current_page - 1)}
                className="size-8 rounded-lg border border-[#F3F4F3] flex items-center justify-center hover:bg-[#EFF2F7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="font-semibold text-[#080C1A]">
                {pagination.current_page} / {pagination.total_pages}
              </span>
              <button
                disabled={!pagination.has_next}
                onClick={() => fetchTPS(pagination.current_page + 1)}
                className="size-8 rounded-lg border border-[#F3F4F3] flex items-center justify-center hover:bg-[#EFF2F7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit TPS */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F3]">
              <h3 className="font-bold text-lg text-[#080C1A]">
                {editingTps ? 'Edit Data TPS & Suara' : 'Tambah TPS & Hasil Suara'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="size-8 rounded-full bg-[#EFF2F7] text-[#6A7686] hover:text-[#080C1A] flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {isAdminPusat && (
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Desa Penyelenggara
                  </label>
                  <select
                    disabled={!!editingTps}
                    value={formDesaId}
                    onChange={handleDesaChangeInModal}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  >
                    <option value="">Pilih Desa</option>
                    {desas.map((d) => (
                      <option key={d.id} value={d.id}>
                        Desa {d.nama_desa} ({d.kecamatan})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Nomor TPS
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formNoTps}
                    onChange={(e) => setFormNoTps(e.target.value)}
                    required
                    placeholder="Contoh: 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Banjar / Lokasi TPS
                  </label>
                  <input
                    type="text"
                    value={formBanjarTps}
                    onChange={(e) => setFormBanjarTps(e.target.value)}
                    required
                    placeholder="Contoh: Banjar Dinas Kauh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6A7686] uppercase mb-1">
                    Total DPT
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formJmlPmlTetap}
                    onChange={(e) => setFormJmlPmlTetap(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6A7686] uppercase mb-1">
                    Hadir (Hak Suara)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMgnHakSuara}
                    onChange={(e) => setFormMgnHakSuara(e.target.value)}
                    placeholder={String(totalSuaraMasukCalc)}
                    className="w-full px-3 py-2 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6A7686] uppercase mb-1">
                    Suara Tidak Sah
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formSuaraTdkSah}
                    onChange={(e) => setFormSuaraTdkSah(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Candidate Vote Section */}
              <div className="pt-3 border-t border-[#F3F4F3]">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#080C1A] uppercase">
                    Perolehan Suara Sah Calon Perbekel
                  </label>
                  <span className="text-xs font-bold text-[#30B22D]">
                    Total Sah: {totalSuaraSahCalc}
                  </span>
                </div>

                {calonList.length === 0 ? (
                  <div className="p-3 bg-[#FED71F]/10 border border-[#FED71F]/30 rounded-xl text-xs text-[#080C1A]">
                    Belum ada calon perbekel untuk desa ini. Daftarkan calon di menu Calon terlebih dahulu.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {calonList.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#EFF2F7]/50 border border-[#F3F4F3]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="size-6 rounded-md bg-[#165DFF] text-white flex items-center justify-center font-bold text-xs">
                            {c.no_urut}
                          </span>
                          <div>
                            <p className="font-bold text-xs text-[#080C1A]">{c.nama_calon}</p>
                            <p className="text-[10px] text-[#6A7686]">{c.asal_banjar}</p>
                          </div>
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            min="0"
                            value={formCalonVotes[c.id] ?? ''}
                            onChange={(e) =>
                              setFormCalonVotes({
                                ...formCalonVotes,
                                [c.id]: e.target.value,
                              })
                            }
                            required
                            placeholder="0 suara"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#F3F4F3] bg-white text-xs font-semibold text-right outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F3F4F3]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#F3F4F3] text-xs font-semibold text-[#6A7686] hover:bg-[#EFF2F7] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || calonList.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#165DFF] hover:bg-[#0E4BD9] text-white text-xs font-semibold shadow-lg shadow-[#165DFF]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="size-4 animate-spin" />}
                  <span>{editingTps ? 'Simpan Perubahan' : 'Tambah TPS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Hapus Data TPS"
        message={deletingTps ? `Apakah Anda yakin ingin menghapus TPS ${deletingTps.no_tps} (${deletingTps.banjar_tps})? Seluruh data suara terkait akan ikut terhapus.` : ''}
        confirmText="Hapus TPS"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
