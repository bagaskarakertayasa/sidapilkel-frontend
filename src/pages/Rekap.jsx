import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Building2,
  Filter,
  RefreshCw,
  Vote,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Rekap({ initialDesaId }) {
  const { user, isAdminPusat } = useAuth();
  const toast = useToast();
  const [selectedDesaId, setSelectedDesaId] = useState(initialDesaId || '');
  const [rekapData, setRekapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchDesa, setSearchDesa] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchDesa);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchDesa]);

  const fetchRekap = async (targetDesaId = selectedDesaId, pageNum = page, searchQuery = debouncedSearch) => {
    if (!rekapData) setLoading(true);
    else setTableLoading(true);

    try {
      let url = '/rekap';
      if (isAdminPusat && targetDesaId) {
        url = `/rekap?desa_id=${targetDesaId}`;
      } else if (isAdminPusat) {
        url = `/rekap?page=${pageNum}&limit=10`;
        if (searchQuery.trim()) {
          url += `&search=${encodeURIComponent(searchQuery.trim())}`;
        }
      }
      const res = await api.get(url);
      setRekapData(res.data);
    } catch (err) {
      toast.error('Gagal mengambil data rekapitulasi suara');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchRekap(selectedDesaId, page, debouncedSearch);
  }, [selectedDesaId, page, debouncedSearch]);

  const isDesaSpecific = !isAdminPusat || (isAdminPusat && Boolean(selectedDesaId));
  const statistik = isDesaSpecific ? rekapData?.statistik : rekapData?.agregat;

  const desaList = !isDesaSpecific
    ? (Array.isArray(rekapData?.desa) ? rekapData.desa : (rekapData?.desa?.items || []))
    : [];

  const pagination = rekapData?.desa?.pagination || {
    current_page: 1,
    total_pages: 1,
    total_records: desaList.length,
    has_next: false,
    has_prev: false,
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F3F4F3] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#165DFF]/10 text-[#165DFF] flex items-center justify-center font-bold">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#080C1A]">
              {isDesaSpecific && rekapData?.desa?.nama_desa
                ? `Rekapitulasi Suara Desa ${rekapData.desa.nama_desa}`
                : isDesaSpecific
                ? `Rekapitulasi Suara Desa ${user?.desa?.nama_desa || user?.nama_desa || ''}`
                : 'Rekapitulasi Suara Pilkel Kabupaten Tabanan'}
            </h2>
            <p className="text-xs text-[#6A7686]">
              {isDesaSpecific
                ? `Kecamatan ${rekapData?.desa?.kecamatan || user?.desa?.kecamatan || ''}`
                : 'Akumulasi seluruh desa penyelenggara pilkel'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdminPusat && (
            isDesaSpecific ? (
              <button
                onClick={() => {
                  setSelectedDesaId('');
                  setPage(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#EFF2F7] hover:bg-[#165DFF]/10 text-xs font-semibold text-[#165DFF] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-4" />
                <span>Semua Desa (Kabupaten)</span>
              </button>
            ) : (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
                <input
                  type="text"
                  value={searchDesa}
                  onChange={(e) => setSearchDesa(e.target.value)}
                  placeholder="Cari desa atau kecamatan..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 text-xs focus:bg-white focus:border-[#165DFF] outline-none"
                />
              </div>
            )
          )}
        </div>
      </div>

      {loading && !rekapData ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RefreshCw className="size-8 animate-spin text-[#165DFF]" />
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-[#F3F4F3] bg-white shadow-sm">
              <p className="text-xs font-bold text-[#6A7686] uppercase tracking-wider">
                Total DPT
              </p>
              <h3 className="text-2xl font-bold text-[#080C1A] mt-1">
                {statistik?.total_dpt?.toLocaleString('id-ID') || 0}
              </h3>
              <p className="text-xs text-[#6A7686] mt-1">
                {statistik?.total_tps || 0} TPS terdata
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#F3F4F3] bg-white shadow-sm">
              <p className="text-xs font-bold text-[#6A7686] uppercase tracking-wider">
                Partisipasi Pemilih
              </p>
              <h3 className="text-2xl font-bold text-[#165DFF] mt-1">
                {statistik?.persentase_hadir || 0}%
              </h3>
              <p className="text-xs text-[#6A7686] mt-1">
                {(statistik?.total_hadir || 0).toLocaleString('id-ID')} pemilih hadir
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#F3F4F3] bg-white shadow-sm">
              <p className="text-xs font-bold text-[#6A7686] uppercase tracking-wider">
                Surat Suara Sah
              </p>
              <h3 className="text-2xl font-bold text-[#30B22D] mt-1">
                {(statistik?.total_suara_sah || 0).toLocaleString('id-ID')}
              </h3>
              <p className="text-xs text-[#6A7686] mt-1">
                Suara sah dihitung
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#F3F4F3] bg-white shadow-sm">
              <p className="text-xs font-bold text-[#6A7686] uppercase tracking-wider">
                Suara Tidak Sah
              </p>
              <h3 className="text-2xl font-bold text-[#ED6B60] mt-1">
                {(statistik?.total_suara_tidak_sah || 0).toLocaleString('id-ID')}
              </h3>
              <p className="text-xs text-[#6A7686] mt-1">
                Batal / Rusak / Keliru
              </p>
            </div>
          </div>

          {/* If Desa Specific: Candidate Ranks & Detailed Results */}
          {isDesaSpecific ? (
            <div className="space-y-6">
              {/* Winner Announcement Banner (if any) */}
              {rekapData?.pemenang && (
                <div className="bg-[#FED71F]/15 border border-[#FED71F]/40 rounded-2xl p-5 flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-[#FED71F] text-[#080C1A] flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-[#FED71F]/20">
                    <Award className="size-7" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#080C1A] bg-[#FED71F]/40 px-2 py-0.5 rounded-full">
                      Pemenang / Calon Unggul Sementara
                    </span>
                    <h3 className="text-lg font-bold text-[#080C1A] mt-1">
                      No. Urut {rekapData.pemenang.no_urut} - {rekapData.pemenang.nama_calon}
                    </h3>
                    <p className="text-xs text-[#6A7686]">
                      Memperoleh {rekapData.pemenang.total_suara?.toLocaleString('id-ID')} suara ({rekapData.pemenang.persentase}%) dari total surat suara sah.
                    </p>
                  </div>
                </div>
              )}

              {/* Candidate Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rekapData?.calon?.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-5 bg-white shadow-sm transition-all flex flex-col justify-between ${
                      c.is_winner
                        ? 'border-[#30B22D] ring-2 ring-[#30B22D]/20'
                        : 'border-[#F3F4F3]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="size-12 rounded-xl bg-[#165DFF] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                          {c.no_urut}
                        </div>
                        {c.is_winner ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#30B22D] bg-[#30B22D]/10 px-2.5 py-1 rounded-full">
                            <Award className="size-3.5" />
                            <span>Unggul</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-[#6A7686] bg-[#EFF2F7] px-2.5 py-1 rounded-full">
                            Calon #{c.no_urut}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="size-14 rounded-xl bg-[#EFF2F7] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#F3F4F3]">
                          {c.foto ? (
                            <img
                              src={c.foto.startsWith('http') ? c.foto : `/storage/${c.foto}`}
                              alt={c.nama_calon}
                              className="w-full h-full object-cover object-top"
                              style={{ objectPosition: 'top center' }}
                            />
                          ) : (
                            <Users className="size-7 text-[#6A7686]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-[#080C1A]">{c.nama_calon}</h4>
                          <p className="text-xs text-[#6A7686]">Asal: {c.asal_banjar}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F3F4F3]">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-xs text-[#6A7686] font-medium">Perolehan Suara</span>
                        <span className="font-bold text-[#080C1A]">
                          {c.total_suara?.toLocaleString('id-ID')} Suara ({c.persentase}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F3F4F3] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${c.is_winner ? 'bg-[#30B22D]' : 'bg-[#165DFF]'}`}
                          style={{ width: `${Math.min(c.persentase || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* If All Desas: Table Comparison */
            <div className="rounded-2xl border border-[#F3F4F3] bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#F3F4F3]">
                <h3 className="font-bold text-base text-[#080C1A]">
                  Rekapitulasi Suara Tingkat Desa se-Kabupaten Tabanan
                </h3>
                <p className="text-xs text-[#6A7686] mt-0.5">
                  Klik desa untuk meninjau perolehan suara rinci per calon
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#F3F4F3] bg-[#EFF2F7]/40 text-[#6A7686] text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-6">Desa / Kecamatan</th>
                      <th className="py-3.5 px-6 text-center">TPS</th>
                      <th className="py-3.5 px-6 text-right">DPT</th>
                      <th className="py-3.5 px-6 text-right">Hadir</th>
                      <th className="py-3.5 px-6 text-center">Partisipasi</th>
                      <th className="py-3.5 px-6 text-right">Suara Sah</th>
                      <th className="py-3.5 px-6 text-right">Tdk Sah</th>
                      <th className="py-3.5 px-6">Pemenang Sementara</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F3]">
                    {tableLoading ? (
                      <tr>
                        <td colSpan="8" className="text-center py-10">
                          <Loader2 className="size-6 animate-spin text-[#165DFF] mx-auto" />
                        </td>
                      </tr>
                    ) : desaList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-sm text-[#6A7686]">
                          Tidak ada data desa yang cocok.
                        </td>
                      </tr>
                    ) : (
                      desaList.map((d) => (
                        <tr
                          key={d.desa.id}
                          onClick={() => {
                            setSelectedDesaId(d.desa.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="hover:bg-[#EFF2F7]/50 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <p className="font-bold text-[#080C1A]">{d.desa.nama_desa}</p>
                            <p className="text-xs text-[#6A7686]">{d.desa.kecamatan}</p>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-xs">{d.statistik.total_tps}</td>
                          <td className="py-4 px-6 text-right text-xs font-medium">
                            {d.statistik.total_dpt?.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-right text-xs font-medium">
                            {d.statistik.total_hadir?.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#165DFF]/10 text-[#165DFF]">
                              {d.statistik.persentase_hadir}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-xs font-semibold text-[#30B22D]">
                            {d.statistik.total_suara_sah?.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-right text-xs font-semibold text-[#ED6B60]">
                            {d.statistik.total_suara_tidak_sah?.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6">
                            {d.pemenang ? (
                              <div className="flex items-center gap-1.5">
                                <Award className="size-4 text-[#FED71F]" />
                                <span className="font-bold text-xs text-[#080C1A]">
                                  {d.pemenang.nama_calon} ({d.pemenang.persentase}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#6A7686] italic">Belum ada suara</span>
                            )}
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
                    Menampilkan {desaList.length} dari {pagination.total_records} data desa
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
          )}
        </>
      )}
    </div>
  );
}
