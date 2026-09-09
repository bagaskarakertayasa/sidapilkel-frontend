import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Filter,
  X,
  Upload,
  RotateCcw,
  Loader2,
  AlertTriangle,
  FileText,
  Search,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function CalonPage() {
  const { user, isAdminPusat } = useAuth();
  const toast = useToast();

  const [desas, setDesas] = useState([]);
  const [selectedDesaId, setSelectedDesaId] = useState(user?.desa_id || '');
  const [calonList, setCalonList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Filter Desa with Debounce (for Admin Pusat)
  const [desaSearch, setDesaSearch] = useState('');
  const [debouncedDesaSearch, setDebouncedDesaSearch] = useState('');
  const [matchingDesas, setMatchingDesas] = useState([]);
  const [showDesaDropdown, setShowDesaDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDesaSearch(desaSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [desaSearch]);

  useEffect(() => {
    if (isAdminPusat) {
      api.get(`/desa/simple?search=${encodeURIComponent(debouncedDesaSearch)}&limit=10`)
        .then((res) => setMatchingDesas(res.data || []))
        .catch(() => {});
    }
  }, [debouncedDesaSearch, isAdminPusat]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCalon, setEditingCalon] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete & Reset Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCalon, setDeletingCalon] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Form states
  const [formDesaId, setFormDesaId] = useState('');
  const [formNoUrut, setFormNoUrut] = useState('');
  const [formNamaCalon, setFormNamaCalon] = useState('');
  const [formAsalBanjar, setFormAsalBanjar] = useState('');
  const [formFotoPath, setFormFotoPath] = useState('');
  const [previewFotoUrl, setPreviewFotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load desas
  useEffect(() => {
    api.get('/desa/simple')
      .then((res) => {
        const list = res.data || [];
        setDesas(list);
        if (!selectedDesaId && list.length > 0) {
          setSelectedDesaId(list[0].id);
          setDesaSearch(list[0].nama_desa);
        } else if (selectedDesaId && list.length > 0) {
          const match = list.find((d) => d.id === selectedDesaId);
          if (match) setDesaSearch(match.nama_desa);
        }
      })
      .catch(() => {});
  }, []);

  const fetchCalon = async (desaId) => {
    const targetDesa = desaId || selectedDesaId;
    if (!targetDesa) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/calon/desa/${targetDesa}`);
      setCalonList(res.data || []);
    } catch (err) {
      toast.error('Gagal mengambil data calon');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDesaId) {
      fetchCalon(selectedDesaId);
    }
  }, [selectedDesaId]);

  const handleOpenAdd = () => {
    setEditingCalon(null);
    setFormDesaId(selectedDesaId);
    setFormNoUrut(calonList.length + 1);
    setFormNamaCalon('');
    setFormAsalBanjar('');
    setFormFotoPath('');
    setPreviewFotoUrl('');
    setModalOpen(true);
  };

  const handleOpenEdit = (calon) => {
    setEditingCalon(calon);
    setFormDesaId(calon.desa_id);
    setFormNoUrut(calon.no_urut);
    setFormNamaCalon(calon.nama_calon);
    setFormAsalBanjar(calon.asal_banjar);
    setFormFotoPath(calon.foto || '');
    setPreviewFotoUrl(calon.foto ? (calon.foto.startsWith('http') ? calon.foto : `/storage/${calon.foto}`) : '');
    setModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    setUploadingPhoto(true);
    try {
      const res = await api.upload('/calon/upload-photo', formData);
      const data = res.data;
      setFormFotoPath(data.foto);
      setPreviewFotoUrl(data.url);
      toast.success('Foto calon berhasil diunggah');
    } catch (err) {
      toast.error('Gagal mengunggah foto calon');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      desa_id: formDesaId,
      no_urut: parseInt(formNoUrut),
      nama_calon: formNamaCalon,
      asal_banjar: formAsalBanjar,
      foto: formFotoPath || null,
    };

    setModalLoading(true);
    try {
      if (editingCalon) {
        await api.put(`/calon/${editingCalon.id}`, payload);
        toast.success('Data calon berhasil diperbarui');
      } else {
        await api.post('/calon', payload);
        toast.success('Calon berhasil didaftarkan');
      }
      setModalOpen(false);
      fetchCalon(formDesaId);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Gagal menyimpan calon');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRequestDelete = (calon) => {
    setDeletingCalon(calon);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCalon) return;
    setDeleteLoading(true);
    try {
      await api.del(`/calon/${deletingCalon.id}`);
      toast.success('Calon berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingCalon(null);
      fetchCalon(selectedDesaId);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Gagal menghapus calon');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRequestReset = () => {
    if (!selectedDesaId) return;
    setResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!selectedDesaId) return;
    setResetLoading(true);
    try {
      await api.del(`/calon/reset/${selectedDesaId}`);
      toast.success('Data calon desa berhasil direset');
      setResetModalOpen(false);
      fetchCalon(selectedDesaId);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Gagal mereset calon desa');
    } finally {
      setResetLoading(false);
    }
  };

  const currentDesa = desas.find((d) => d.id === selectedDesaId);

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F3F4F3] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#165DFF]/10 text-[#165DFF] flex items-center justify-center font-bold">
            <Users className="size-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#080C1A]">
              Calon Perbekel {currentDesa ? `Desa ${currentDesa.nama_desa}` : ''}
            </h2>
            <p className="text-xs text-[#6A7686]">
              {currentDesa ? `Kecamatan ${currentDesa.kecamatan}` : 'Pilih desa untuk mengelola calon'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdminPusat && (
            <div className="relative w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
                <input
                  type="text"
                  value={desaSearch}
                  onFocus={() => setShowDesaDropdown(true)}
                  onChange={(e) => {
                    setDesaSearch(e.target.value);
                    setShowDesaDropdown(true);
                  }}
                  placeholder="Cari desa..."
                  className="w-full pl-9 pr-8 py-2 bg-[#EFF2F7]/70 hover:bg-[#EFF2F7] focus:bg-white border border-[#F3F4F3] focus:border-[#165DFF] rounded-xl text-xs font-semibold text-[#080C1A] outline-none"
                />
                {desaSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setDesaSearch('');
                      setShowDesaDropdown(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6A7686] hover:text-[#080C1A] cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {showDesaDropdown && matchingDesas.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#F3F4F3] rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-1">
                  {matchingDesas.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDesaId(d.id);
                        setDesaSearch(d.nama_desa);
                        setShowDesaDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-[#EFF2F7] transition-colors flex items-center justify-between cursor-pointer ${
                        selectedDesaId === d.id ? 'bg-[#165DFF]/10 text-[#165DFF] font-bold' : 'text-[#080C1A]'
                      }`}
                    >
                      <span>Desa {d.nama_desa}</span>
                      <span className="text-[10px] text-[#6A7686]">{d.kecamatan}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isAdminPusat && calonList.length > 0 && (
            <button
              onClick={handleRequestReset}
              className="px-3.5 py-2 rounded-xl border border-[#ED6B60]/30 text-[#ED6B60] hover:bg-[#ED6B60]/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset seluruh calon desa"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </button>
          )}

          {!isAdminPusat && (
            <button
              onClick={handleOpenAdd}
              disabled={!selectedDesaId}
              className="bg-[#165DFF] hover:bg-[#0E4BD9] text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-lg shadow-[#165DFF]/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="size-4" />
              <span>Tambah Calon</span>
            </button>
          )}
        </div>
      </div>

      {/* Candidate Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <Loader2 className="size-8 animate-spin text-[#165DFF]" />
        </div>
      ) : calonList.length === 0 ? (
        <div className="rounded-2xl border border-[#F3F4F3] bg-white p-12 text-center shadow-sm">
          <Users className="size-12 text-[#6A7686]/40 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#080C1A]">Belum Ada Calon Perbekel</h3>
          <p className="text-xs text-[#6A7686] mt-1 max-w-sm mx-auto">
            {isAdminPusat
              ? 'Belum ada calon perbekel yang terdaftar untuk desa ini.'
              : 'Daftarkan calon perbekel desa ini untuk mulai menerima input suara pada TPS.'}
          </p>
          {!isAdminPusat && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-[#165DFF] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Tambah Calon Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {calonList.map((calon) => (
            <div
              key={calon.id}
              className="rounded-2xl border border-[#F3F4F3] bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="size-10 rounded-xl bg-[#165DFF] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    #{calon.no_urut}
                  </div>
                  {!isAdminPusat && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(calon)}
                        className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#165DFF]/10 text-[#6A7686] hover:text-[#165DFF] flex items-center justify-center transition-colors cursor-pointer"
                        title="Edit Calon"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleRequestDelete(calon)}
                        className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#ED6B60]/10 text-[#6A7686] hover:text-[#ED6B60] flex items-center justify-center transition-colors cursor-pointer"
                        title="Hapus Calon"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo & Info */}
                <div className="flex items-center gap-4">
                  <div className="w-24 h-32 rounded-2xl bg-[#EFF2F7] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#F3F4F3]">
                    {calon.foto ? (
                      <img
                        src={calon.foto.startsWith('http') ? calon.foto : `/storage/${calon.foto}`}
                        alt={calon.nama_calon}
                        className="w-full h-full object-cover object-top"
                        style={{ objectPosition: 'top center' }}
                      />
                    ) : (
                      <Users className="size-8 text-[#6A7686]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base text-[#080C1A] truncate">
                      {calon.nama_calon}
                    </h4>
                    <p className="text-xs text-[#6A7686] mt-1">
                      Banjar: <b className="text-[#080C1A]">{calon.asal_banjar}</b>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit Calon */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F3]">
              <h3 className="font-bold text-lg text-[#080C1A]">
                {editingCalon ? 'Edit Data Calon' : 'Tambah Calon Perbekel'}
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
                    Desa
                  </label>
                  <select
                    disabled={!!editingCalon}
                    value={formDesaId}
                    onChange={(e) => setFormDesaId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  >
                    {desas.map((d) => (
                      <option key={d.id} value={d.id}>
                        Desa {d.nama_desa} ({d.kecamatan})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    No. Urut
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formNoUrut}
                    onChange={(e) => setFormNoUrut(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-bold outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Nama Lengkap Calon
                  </label>
                  <input
                    type="text"
                    value={formNamaCalon}
                    onChange={(e) => setFormNamaCalon(e.target.value)}
                    required
                    placeholder="Nama calon & gelar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                  Asal Banjar / Dusun
                </label>
                <input
                  type="text"
                  value={formAsalBanjar}
                  onChange={(e) => setFormAsalBanjar(e.target.value)}
                  required
                  placeholder="Contoh: Banjar Dinas Selabih"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                  Foto Calon (Maks 2MB)
                </label>
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-xl bg-[#EFF2F7] overflow-hidden flex items-center justify-center border border-[#F3F4F3] flex-shrink-0">
                    {previewFotoUrl ? (
                      <img
                        src={previewFotoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover object-top"
                        style={{ objectPosition: 'top center' }}
                      />
                    ) : (
                      <Users className="size-6 text-[#6A7686]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 hover:bg-[#EFF2F7] text-xs font-semibold text-[#080C1A] cursor-pointer transition-colors">
                      {uploadingPhoto ? (
                        <Loader2 className="size-4 animate-spin text-[#165DFF]" />
                      ) : (
                        <Upload className="size-4 text-[#165DFF]" />
                      )}
                      <span>{uploadingPhoto ? 'Mengunggah...' : 'Pilih File Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploadingPhoto}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-[#6A7686] mt-1">
                      Format: PNG, JPG, JPEG, WEBP.
                    </p>
                  </div>
                </div>
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
                  disabled={modalLoading || uploadingPhoto}
                  className="px-5 py-2.5 rounded-xl bg-[#165DFF] hover:bg-[#0E4BD9] text-white text-xs font-semibold shadow-lg shadow-[#165DFF]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="size-4 animate-spin" />}
                  <span>{editingCalon ? 'Simpan Calon' : 'Daftarkan Calon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingCalon(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Calon Perbekel"
        message={`Apakah Anda yakin ingin menghapus calon #${deletingCalon?.no_urut} (${deletingCalon?.nama_calon})? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Calon"
        type="danger"
        loading={deleteLoading}
      />

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Calon Desa"
        message={`Apakah Anda yakin ingin mereset seluruh data calon pada Desa ${currentDesa?.nama_desa || ''}? Semua data calon dan perolehan suara terkait akan dihapus.`}
        confirmText="Reset Semua Calon"
        type="danger"
        loading={resetLoading}
      />
    </div>
  );
}
