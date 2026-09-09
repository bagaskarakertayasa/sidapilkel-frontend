import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
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
  const [editingUser, setEditingUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [namaDepan, setNamaDepan] = useState('');
  const [namaBelakang, setNamaBelakang] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [role, setRole] = useState('ADMIN_DESA');
  const [desaId, setDesaId] = useState('');
  const [desaSearch, setDesaSearch] = useState('');
  const [desaSuggestions, setDesaSuggestions] = useState([]);
  const [showDesaSuggestions, setShowDesaSuggestions] = useState(false);

  // Password Reset Modal
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdUserId, setPwdUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Debounced search for desa dropdown in modal
  useEffect(() => {
    if (!modalOpen || role !== 'ADMIN_DESA') return;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/desa/simple?search=${encodeURIComponent(desaSearch.trim())}&limit=10`);
        setDesaSuggestions(res.data || []);
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [desaSearch, modalOpen, role]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/users?page=${page}&limit=10`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      const res = await api.get(url);
      setUsers(res.data.items || []);
      setPagination(res.data.pagination || {});
    } catch {
      toast.error('Gagal mengambil data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setNamaDepan('');
    setNamaBelakang('');
    setUsername('');
    setEmail('');
    setPassword('');
    setShowAddPassword(false);
    setRole('ADMIN_DESA');
    setDesaId('');
    setDesaSearch('');
    setShowDesaSuggestions(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setNamaDepan(u.nama_depan || '');
    setNamaBelakang(u.nama_belakang || '');
    setUsername(u.username || '');
    setEmail(u.email || '');
    setPassword('');
    setShowAddPassword(false);
    setRole(u.role || 'ADMIN_DESA');
    setDesaId(u.desa_id || '');
    setDesaSearch(u.desa?.nama_desa ? `Desa ${u.desa.nama_desa}` : '');
    setShowDesaSuggestions(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'ADMIN_DESA' && !desaId) {
      toast.error('Silakan cari dan pilih Desa Wilayah dari daftar pencarian');
      return;
    }

    const payload = {
      nama_depan: namaDepan.trim(),
      nama_belakang: namaBelakang.trim() || null,
      username: username.trim(),
      email: email.trim(),
      role,
      desa_id: role === 'ADMIN_DESA' ? desaId : null,
    };

    if (!editingUser) {
      payload.password = password;
    }

    setModalLoading(true);
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success('Data pengguna berhasil diperbarui');
      } else {
        await api.post('/users', payload);
        toast.success('Pengguna baru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchUsers(pagination.current_page || 1);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Gagal menyimpan data pengguna');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      toast.error('Anda tidak dapat menonaktifkan akun sendiri');
      return;
    }
    const newStatus = targetUser.status === 'aktif' ? 'nonaktif' : 'aktif';
    try {
      await api.patch(`/users/${targetUser.id}/status`, { status: newStatus });
      toast.success(`Status akun diubah menjadi ${newStatus}`);
      fetchUsers(pagination.current_page || 1);
    } catch (err) {
      toast.error(err?.data?.message || 'Gagal mengubah status pengguna');
    }
  };

  const handleOpenPwdModal = (u) => {
    setPwdUserId(u.id);
    setNewPassword('');
    setShowResetPassword(false);
    setPwdModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setPwdLoading(true);
    try {
      await api.patch(`/users/${pwdUserId}/password`, { password: newPassword });
      toast.success('Password pengguna berhasil diubah');
      setPwdModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Gagal memperbarui password');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleRequestDelete = (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri');
      return;
    }
    setDeletingUser(targetUser);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await api.del(`/users/${deletingUser.id}`);
      toast.success('Pengguna berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingUser(null);
      fetchUsers(pagination.current_page || 1);
    } catch (err) {
      toast.error(err?.data?.message || 'Gagal menghapus pengguna');
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
            <UserCog className="size-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#080C1A]">Manajemen Pengguna</h2>
            <p className="text-xs text-[#6A7686]">Kelola akun Admin Pusat dan Admin Desa</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, username, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs focus:bg-white focus:border-[#165DFF] outline-none"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-[#165DFF] hover:bg-[#0E4BD9] text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-lg shadow-[#165DFF]/20 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="size-4" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-[#F3F4F3] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F3] bg-[#EFF2F7]/40 text-[#6A7686] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Nama Pengguna</th>
                <th className="py-3.5 px-6">Username / Email</th>
                <th className="py-3.5 px-6 text-center">Peran</th>
                <th className="py-3.5 px-6">Wilayah Desa</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F3]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <Loader2 className="size-6 animate-spin text-[#165DFF] mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-sm text-[#6A7686]">
                    Tidak ada data pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#EFF2F7]/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#080C1A]">
                        {u.nama_depan} {u.nama_belakang || ''}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-xs font-semibold text-[#080C1A]">@{u.username}</p>
                      <p className="text-[11px] text-[#6A7686]">{u.email}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          u.role === 'ADMIN_PUSAT'
                            ? 'bg-[#165DFF]/10 text-[#165DFF]'
                            : 'bg-[#30B22D]/10 text-[#30B22D]'
                        }`}
                      >
                        {u.role === 'ADMIN_PUSAT' ? 'Admin Pusat' : 'Admin Desa'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-[#080C1A]">
                      {u.role === 'ADMIN_DESA' ? (
                        u.desa ? `Desa ${u.desa.nama_desa}` : '-'
                      ) : (
                        <span className="text-[#6A7686] italic">Kabupaten Tabanan</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.id === currentUser?.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${
                          u.status === 'aktif'
                            ? 'bg-[#30B22D]/10 text-[#30B22D] hover:bg-[#30B22D]/20'
                            : 'bg-[#ED6B60]/10 text-[#ED6B60] hover:bg-[#ED6B60]/20'
                        }`}
                        title="Klik untuk ubah status"
                      >
                        {u.status === 'aktif' ? <CheckCircle className="size-3.5" /> : <XCircle className="size-3.5" />}
                        <span className="capitalize">{u.status}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPwdModal(u)}
                          className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#FED71F]/20 text-[#6A7686] hover:text-[#080C1A] flex items-center justify-center transition-colors cursor-pointer"
                          title="Ubah Password"
                        >
                          <KeyRound className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#165DFF]/10 text-[#6A7686] hover:text-[#165DFF] flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleRequestDelete(u)}
                            className="size-8 rounded-lg bg-[#EFF2F7] hover:bg-[#ED6B60]/10 text-[#6A7686] hover:text-[#ED6B60] flex items-center justify-center transition-colors cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
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
              Menampilkan {users.length} dari {pagination.total_records} pengguna
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.has_prev}
                onClick={() => fetchUsers(pagination.current_page - 1)}
                className="size-8 rounded-lg border border-[#F3F4F3] flex items-center justify-center hover:bg-[#EFF2F7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="font-semibold text-[#080C1A]">
                {pagination.current_page} / {pagination.total_pages}
              </span>
              <button
                disabled={!pagination.has_next}
                onClick={() => fetchUsers(pagination.current_page + 1)}
                className="size-8 rounded-lg border border-[#F3F4F3] flex items-center justify-center hover:bg-[#EFF2F7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F3]">
              <h3 className="font-bold text-lg text-[#080C1A]">
                {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="size-8 rounded-full bg-[#EFF2F7] text-[#6A7686] hover:text-[#080C1A] flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Nama Depan
                  </label>
                  <input
                    type="text"
                    value={namaDepan}
                    onChange={(e) => setNamaDepan(e.target.value)}
                    required
                    placeholder="Contoh: Budi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Nama Belakang
                  </label>
                  <input
                    type="text"
                    value={namaBelakang}
                    onChange={(e) => setNamaBelakang(e.target.value)}
                    placeholder="Contoh: Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="budi123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="budi@tabanan.go.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none focus:bg-white focus:border-[#165DFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A7686] hover:text-[#080C1A] cursor-pointer"
                      tabIndex={-1}
                      title={showAddPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showAddPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (e.target.value !== 'ADMIN_DESA') {
                        setDesaId('');
                        setDesaSearch('');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-semibold outline-none"
                  >
                    <option value="ADMIN_DESA">Admin Desa</option>
                    <option value="ADMIN_PUSAT">Admin Pusat</option>
                  </select>
                </div>

                {role === 'ADMIN_DESA' && (
                  <div className="relative">
                    <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                      Desa Wilayah <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#6A7686]" />
                      <input
                        type="text"
                        value={desaSearch}
                        onChange={(e) => {
                          setDesaSearch(e.target.value);
                          setDesaId('');
                          setShowDesaSuggestions(true);
                        }}
                        onFocus={() => setShowDesaSuggestions(true)}
                        required={!desaId}
                        placeholder="Ketik cari desa..."
                        className={`w-full pl-8 pr-7 py-2.5 rounded-xl border text-xs font-medium outline-none focus:bg-white ${
                          desaId ? 'border-[#30B22D] bg-[#30B22D]/5 font-semibold text-[#080C1A]' : 'border-[#F3F4F3] bg-[#EFF2F7]/50 focus:border-[#165DFF]'
                        }`}
                      />
                      {desaSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setDesaSearch('');
                            setDesaId('');
                            setShowDesaSuggestions(false);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6A7686] hover:text-[#080C1A] cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {showDesaSuggestions && (
                      <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-[#F3F4F3] rounded-xl shadow-lg py-1">
                        {desaSuggestions.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-[#6A7686]">Tidak ada desa ditemukan</div>
                        ) : (
                          desaSuggestions.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setDesaId(d.id);
                                setDesaSearch(`Desa ${d.nama_desa}`);
                                setShowDesaSuggestions(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-[#EFF2F7] flex items-center justify-between cursor-pointer ${
                                desaId === d.id ? 'bg-[#165DFF]/10 font-bold text-[#165DFF]' : 'text-[#080C1A]'
                              }`}
                            >
                              <span>Desa {d.nama_desa}</span>
                              {d.kecamatan && <span className="text-[10px] text-[#6A7686]">Kec. {d.kecamatan}</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                  <span>{editingUser ? 'Simpan Pengguna' : 'Tambah Pengguna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {pwdModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F3]">
              <h3 className="font-bold text-base text-[#080C1A]">Ganti Password</h3>
              <button
                onClick={() => setPwdModalOpen(false)}
                className="size-8 rounded-full bg-[#EFF2F7] text-[#6A7686] hover:text-[#080C1A] flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6A7686] uppercase mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs font-medium outline-none focus:bg-white focus:border-[#165DFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A7686] hover:text-[#080C1A] cursor-pointer"
                    tabIndex={-1}
                    title={showResetPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showResetPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F3F4F3]">
                <button
                  type="button"
                  onClick={() => setPwdModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#F3F4F3] text-xs font-semibold text-[#6A7686] hover:bg-[#EFF2F7] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2 rounded-xl bg-[#165DFF] hover:bg-[#0E4BD9] text-white text-xs font-semibold shadow-lg shadow-[#165DFF]/20 flex items-center gap-2 cursor-pointer"
                >
                  {pwdLoading && <Loader2 className="size-4 animate-spin" />}
                  <span>Perbarui Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna "${deletingUser?.username}" (${deletingUser?.nama_depan} ${deletingUser?.nama_belakang || ''})? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Pengguna"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
