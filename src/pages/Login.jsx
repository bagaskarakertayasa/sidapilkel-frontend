import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Countdown timer for 429 Too Many Requests
  useEffect(() => {
    if (retryCountdown <= 0) return;

    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryCountdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (retryCountdown > 0) return;

    if (!username.trim() || !password.trim()) {
      toast.error('Username dan password wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      toast.success('Berhasil masuk ke sistem');
    } catch (err) {
      if (err?.status === 429) {
        const retrySec = parseInt(err?.data?.retry_after || err?.retryAfter || 60, 10);
        setRetryCountdown(retrySec);
        const msg = `Terlalu banyak percobaan login. Tombol masuk dinonaktifkan. Silakan coba lagi dalam ${retrySec} detik.`;
        toast.error(msg);
        return;
      }
      const msg = err?.data?.message || err?.message || 'Login gagal. Periksa username dan password.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#EFF2F7] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex size-16 mb-2">
            <img src="/favicon.png" alt="Logo Kabupaten Tabanan" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-[#080C1A] tracking-tight">SIDAPILKEL</h1>
          <p className="text-[#6A7686] text-sm mt-1">
            Sistem Informasi Data Pemilihan Perbekel Tabanan
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-3xl border border-[#F3F4F3] p-7 sm:p-9 shadow-xl shadow-black/5">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#080C1A]">Selamat Datang</h2>
            <p className="text-xs text-[#6A7686] mt-1">
              Silakan masukkan kredensial akun Anda untuk mengakses sistem
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#6A7686] uppercase tracking-wider mb-2">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-[#6A7686]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 focus:bg-white focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] outline-none text-sm transition-all text-[#080C1A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6A7686] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-[#6A7686]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-[#F3F4F3] bg-[#EFF2F7]/50 focus:bg-white focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] outline-none text-sm transition-all text-[#080C1A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6A7686] hover:text-[#080C1A] transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || retryCountdown > 0}
              className={`w-full mt-2 py-3.5 px-5 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all cursor-pointer ${
                retryCountdown > 0
                  ? 'bg-[#ED6B60] opacity-80 cursor-not-allowed shadow-[#ED6B60]/20'
                  : 'bg-[#165DFF] hover:bg-[#0E4BD9] shadow-[#165DFF]/25 disabled:opacity-60 disabled:cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : retryCountdown > 0 ? (
                <>
                  <Clock className="size-4 animate-pulse" />
                  <span>Tunggu {retryCountdown} detik untuk login...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#6A7686] mt-6">
          &copy; {new Date().getFullYear()} Pemerintah Kabupaten Tabanan &bull; DPMD
        </p>
      </div>
    </div>
  );
}
