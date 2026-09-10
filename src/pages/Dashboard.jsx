import React, { useState, useEffect, useMemo } from 'react';
import {
  Vote,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp,
  Award,
  ArrowUpRight,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import useDebounce from '../hooks/useDebounce';

export default function Dashboard({ onNavigate }) {
  const { user, isAdminPusat } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchDesa, setSearchDesa] = useState('');
  const debouncedSearch = useDebounce(searchDesa, 350);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchStats = async (pageNum = page, searchQuery = debouncedSearch) => {
    if (!data) setLoading(true);
    else setTableLoading(true);
    try {
      let url = '/dashboard/stats';
      if (isAdminPusat) {
        url += `?page=${pageNum}&limit=10`;
        if (searchQuery.trim()) {
          url += `&search=${encodeURIComponent(searchQuery.trim())}`;
        }
      }
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      toast.error('Gagal memuat statistik dashboard');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(page, debouncedSearch);
  }, [page, debouncedSearch]);

  const agregat = isAdminPusat ? data?.agregat : data?.statistik;
  const ringkasanDesa = Array.isArray(data?.ringkasan_desa)
    ? data.ringkasan_desa
    : (data?.ringkasan_desa?.items || []);
  const pagination = data?.ringkasan_desa?.pagination || {
    current_page: 1,
    total_pages: 1,
    total_records: ringkasanDesa.length,
    has_next: false,
    has_prev: false,
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-[#6A7686]">
          <RefreshCw className="size-8 animate-spin text-[#165DFF]" />
          <p className="text-sm font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#165DFF] to-[#0E4BD9] rounded-2xl p-6 text-white shadow-lg shadow-[#165DFF]/15">
        <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wide">
          {isAdminPusat ? 'Panel Tingkat Kabupaten' : `Wilayah: Desa ${data?.desa?.nama_desa || user?.desa?.nama_desa || user?.nama_desa || ''}`}
        </span>
        <h2 className="text-2xl font-bold tracking-tight">
          Pemilihan Perbekel Serentak Kabupaten Tabanan
        </h2>
        <p className="text-white/80 text-sm mt-1">
          Pantau pergerakan suara, kehadiran pemilih, dan hasil pemungutan suara secara real-time.
        </p>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Desa / Total TPS */}
        <div className="rounded-2xl border border-[#F3F4F3] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 bg-[#165DFF]/10 rounded-xl flex items-center justify-center text-[#165DFF]">
              {isAdminPusat ? <Building2 className="size-5" /> : <Vote className="size-5" />}
            </div>
            <span className="text-[11px] font-bold text-[#30B22D] bg-[#30B22D]/10 px-2.5 py-1 rounded-full">
              {isAdminPusat ? `${agregat?.total_desa || 0} Desa` : 'Terdaftar'}
            </span>
          </div>
          <p className="text-[#6A7686] text-xs font-semibold uppercase tracking-wider">
            {isAdminPusat ? 'Total TPS Se-Kabupaten' : 'Total TPS di Desa'}
          </p>
          <h3 className="text-3xl font-bold text-[#080C1A] mt-1">
            {agregat?.total_tps?.toLocaleString('id-ID') || 0}
          </h3>
          <p className="text-xs text-[#6A7686] mt-1.5">
            {isAdminPusat ? `${agregat?.total_desa || 0} Desa menyelenggarakan` : 'Tempat Pemungutan Suara'}
          </p>
        </div>

        {/* Card 2: Total DPT */}
        <div className="rounded-2xl border border-[#F3F4F3] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 bg-[#30B22D]/10 rounded-xl flex items-center justify-center text-[#30B22D]">
              <Users className="size-5" />
            </div>
            <span className="text-[11px] font-bold text-[#165DFF] bg-[#165DFF]/10 px-2.5 py-1 rounded-full">
              DPT Sah
            </span>
          </div>
          <p className="text-[#6A7686] text-xs font-semibold uppercase tracking-wider">
            Daftar Pemilih Tetap (DPT)
          </p>
          <h3 className="text-3xl font-bold text-[#080C1A] mt-1">
            {agregat?.total_dpt?.toLocaleString('id-ID') || 0}
          </h3>
          <p className="text-xs text-[#6A7686] mt-1.5">
            Hak pilih terdata resmi
          </p>
        </div>

        {/* Card 3: Partisipasi / Hadir */}
        <div className="rounded-2xl border border-[#F3F4F3] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 bg-[#FED71F]/15 rounded-xl flex items-center justify-center text-[#D6A000]">
              <TrendingUp className="size-5" />
            </div>
            <span className="text-[11px] font-bold text-[#165DFF] bg-[#165DFF]/10 px-2.5 py-1 rounded-full">
              {agregat?.persentase_hadir || 0}% Hadir
            </span>
          </div>
          <p className="text-[#6A7686] text-xs font-semibold uppercase tracking-wider">
            Penggunaan Hak Pilih
          </p>
          <h3 className="text-3xl font-bold text-[#080C1A] mt-1">
            {agregat?.total_hadir?.toLocaleString('id-ID') || 0}
          </h3>
          <p className="text-xs text-[#6A7686] mt-1.5">
            Tidak hadir: {(agregat?.total_tidak_hadir || 0).toLocaleString('id-ID')}
          </p>
        </div>

        {/* Card 4: Suara Sah vs Tidak Sah */}
        <div className="rounded-2xl border border-[#F3F4F3] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 bg-[#ED6B60]/10 rounded-xl flex items-center justify-center text-[#ED6B60]">
              <CheckCircle2 className="size-5 text-[#30B22D]" />
            </div>
            <span className="text-[11px] font-bold text-[#ED6B60] bg-[#ED6B60]/10 px-2.5 py-1 rounded-full">
              {(agregat?.total_suara_tidak_sah || 0).toLocaleString('id-ID')} Tdk Sah
            </span>
          </div>
          <p className="text-[#6A7686] text-xs font-semibold uppercase tracking-wider">
            Total Suara Sah Masuk
          </p>
          <h3 className="text-3xl font-bold text-[#080C1A] mt-1">
            {agregat?.total_suara_sah?.toLocaleString('id-ID') || 0}
          </h3>
          <p className="text-xs text-[#6A7686] mt-1.5">
            Surat suara sah terhitung
          </p>
        </div>
      </div>

      {/* Role-Specific Content */}
      {isAdminPusat ? (
        /* ADMIN PUSAT: Rekap Seluruh Desa */
        <div className="rounded-2xl border border-[#F3F4F3] bg-white shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#F3F4F3] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-[#080C1A]">Progres & Hasil Pemilihan Per Desa</h3>
              <p className="text-xs text-[#6A7686] mt-0.5">
                Daftar ringkasan tingkat partisipasi dan perolehan suara unggul perbekel
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
              <input
                type="text"
                value={searchDesa}
                onChange={(e) => setSearchDesa(e.target.value)}
                placeholder="Cari desa atau kecamatan..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs focus:bg-white focus:border-[#165DFF] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F3] bg-[#EFF2F7]/40 text-[#6A7686] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Nama Desa</th>
                  <th className="py-3.5 px-6">Kecamatan</th>
                  <th className="py-3.5 px-6 text-center">TPS</th>
                  <th className="py-3.5 px-6 text-right">Total DPT</th>
                  <th className="py-3.5 px-6 text-center">Partisipasi</th>
                  <th className="py-3.5 px-6">Calon Unggul</th>
                  <th className="py-3.5 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F3]">
                {tableLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10">
                      <Loader2 className="size-6 animate-spin text-[#165DFF] mx-auto" />
                    </td>
                  </tr>
                ) : ringkasanDesa.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-sm text-[#6A7686]">
                      Tidak ada data desa yang cocok.
                    </td>
                  </tr>
                ) : (
                  ringkasanDesa.map((d) => (
                    <tr key={d.desa_id} className="hover:bg-[#F1F3F6]/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#080C1A]">
                        {d.nama_desa}
                      </td>
                      <td className="py-4 px-6 text-[#6A7686] text-xs font-medium">
                        {d.kecamatan}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-xs text-[#080C1A]">
                        {d.total_tps}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-xs text-[#080C1A]">
                        {d.total_dpt?.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#165DFF]/10 text-[#165DFF] font-bold text-xs">
                          <span>{d.persentase_hadir}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {d.pemenang ? (
                          <div className="flex items-center gap-2">
                            <Award className="size-4 text-[#FED71F] flex-shrink-0" />
                            <span className="font-semibold text-xs text-[#080C1A]">
                              {d.pemenang}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6A7686] italic">Belum ada suara</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => onNavigate('rekap', { desaId: d.desa_id })}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#165DFF] hover:underline cursor-pointer"
                        >
                          <span>Rincian</span>
                          <ArrowUpRight className="size-3.5" />
                        </button>
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
                Menampilkan {ringkasanDesa.length} dari {pagination.total_records} data desa
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.has_prev || tableLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="size-8 rounded-lg border border-[#F3F4F3] flex items-center justify-center hover:bg-[#EFF2F7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="font-semibold text-[#080C1A]">
                  {pagination.current_page} / {pagination.total_pages}
                </span>
                <button
                  disabled={!pagination.has_next || tableLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="size-8 rounded-lg border border-[#F3F4F3] flex items-center justify-center hover:bg-[#EFF2F7] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ADMIN DESA: Detail Perolehan Calon & TPS Desa */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calon Pemenang / Suara Tertinggi */}
          <div className="lg:col-span-1 rounded-2xl border border-[#F3F4F3] p-6 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-[#080C1A]">Suara Tertinggi</h3>
                <Award className="size-6 text-[#FED71F]" />
              </div>
              {data?.pemenang ? (
                <div className="text-center py-4">
                  <div className="size-24 rounded-2xl mx-auto mb-4 overflow-hidden bg-[#165DFF]/10 flex items-center justify-center border-2 border-[#165DFF]/20">
                    {data.pemenang.foto ? (
                      <img
                        src={data.pemenang.foto.startsWith('http') ? data.pemenang.foto : `/storage/${data.pemenang.foto}`}
                        alt={data.pemenang.nama_calon}
                        className="w-full h-full object-cover object-top"
                        style={{ objectPosition: 'top center' }}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-[#165DFF]">
                        #{data.pemenang.no_urut}
                      </span>
                    )}
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-[#FED71F]/20 text-[#080C1A] text-xs font-bold mb-2">
                    No. Urut {data.pemenang.no_urut} &bull; Unggul Sementara
                  </div>
                  <h4 className="text-lg font-bold text-[#080C1A]">
                    {data.pemenang.nama_calon}
                  </h4>
                  <p className="text-xs text-[#6A7686] mt-0.5">
                    Asal: {data.pemenang.asal_banjar}
                  </p>
                  <div className="mt-5 p-4 rounded-xl bg-[#EFF2F7]/50 border border-[#F3F4F3] flex justify-around">
                    <div>
                      <p className="text-[11px] font-bold text-[#6A7686] uppercase">Perolehan Suara</p>
                      <p className="text-xl font-bold text-[#165DFF] mt-0.5">
                        {data.pemenang.total_suara?.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="w-[1px] bg-[#F3F4F3]" />
                    <div>
                      <p className="text-[11px] font-bold text-[#6A7686] uppercase">Persentase</p>
                      <p className="text-xl font-bold text-[#30B22D] mt-0.5">
                        {data.pemenang.persentase}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[#6A7686]">
                  <AlertTriangle className="size-8 mx-auto mb-2 text-[#FED71F]" />
                  <p className="text-sm font-medium">Belum ada suara masuk di desa ini</p>
                  <button
                    onClick={() => onNavigate('tps')}
                    className="mt-3 text-xs font-bold text-[#165DFF] hover:underline"
                  >
                    Input Hasil Suara TPS Sekarang &rarr;
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('rekap')}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#EFF2F7] hover:bg-[#165DFF]/10 text-[#165DFF] text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Lihat Rekapitulasi Lengkap
            </button>
          </div>

          {/* Breakdown Seluruh Calon Desa */}
          <div className="lg:col-span-2 rounded-2xl border border-[#F3F4F3] p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base text-[#080C1A]">Hasil Suara Seluruh Calon</h3>
                <p className="text-xs text-[#6A7686]">Perolehan suara sah di TPS Desa</p>
              </div>
              <button
                onClick={() => onNavigate('calon')}
                className="text-xs font-bold text-[#165DFF] hover:underline cursor-pointer"
              >
                Kelola Calon &rarr;
              </button>
            </div>

            <div className="space-y-4">
              {data?.calon && data.calon.length > 0 ? (
                data.calon.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/30 hover:bg-[#EFF2F7]/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-[#165DFF] text-white flex items-center justify-center font-bold text-xs">
                          {c.no_urut}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#080C1A] flex items-center gap-2">
                            {c.nama_calon}
                            {c.is_winner && (
                              <span className="text-[10px] bg-[#FED71F]/30 text-[#080C1A] px-2 py-0.5 rounded-full font-bold">
                                Tertinggi
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#6A7686]">{c.asal_banjar}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-[#080C1A]">
                          {c.total_suara?.toLocaleString('id-ID')} Suara
                        </p>
                        <p className="text-xs font-semibold text-[#165DFF]">{c.persentase}%</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#F3F4F3] rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          c.is_winner ? 'bg-[#30B22D]' : 'bg-[#165DFF]'
                        }`}
                        style={{ width: `${Math.min(c.persentase || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[#6A7686]">
                  <p className="text-sm">Belum ada calon yang didaftarkan di desa ini.</p>
                  <button
                    onClick={() => onNavigate('calon')}
                    className="mt-3 px-4 py-2 bg-[#165DFF] text-white rounded-xl text-xs font-semibold"
                  >
                    Daftarkan Calon Perbekel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
