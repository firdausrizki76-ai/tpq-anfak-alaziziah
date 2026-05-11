import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, X, Loader2, Keyboard, QrCode } from 'lucide-react';
import { absensiAPI, santriAPI } from '../../services/api';

const ScannerPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('manual'); // 'scan' or 'manual'
  const [nisInput, setNisInput] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (mode === 'scan') {
      initScanner();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [mode]);

  const initScanner = async () => {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      const qrScanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0]
      });
      qrScanner.render(onScanSuccess, () => {});
      scannerRef.current = qrScanner;
      setScannerReady(true);
    } catch (err) {
      setError('Gagal memuat scanner. Pastikan kamera tersedia.');
    }
  };

  const processAttendance = async (nomorInduk) => {
    if (loading) return;
    setLoading(true);
    setScanResult(null);
    setError(null);

    try {
      const santris = await santriAPI.getAll({ search: nomorInduk });
      const santri = (santris || []).find(s => s.nomor_induk?.toUpperCase() === nomorInduk.toUpperCase());

      if (!santri) {
        throw new Error(`Santri dengan NIS "${nomorInduk}" tidak ditemukan`);
      }

      await absensiAPI.create({
        santri_id: santri.id,
        tanggal: new Date().toISOString().split('T')[0],
        tipe: 'santri',
        status: 'hadir',
        keterangan: mode === 'scan' ? 'Scan QR Guru' : 'Input Manual NIS'
      });

      setScanResult({
        nama: santri.nama_lengkap,
        nomor: santri.nomor_induk,
        waktu: new Date().toLocaleTimeString('id-ID')
      });

      setNisInput('');
      setTimeout(() => setScanResult(null), 3000);
    } catch (err) {
      setError(err.message || 'Gagal memproses absensi');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    await processAttendance(decodedText);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!nisInput.trim()) return;
    await processAttendance(nisInput.trim());
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[var(--color-primary-container)] p-6 text-white text-center">
          <h2 className="text-xl font-bold">Absensi Santri</h2>
          <p className="text-sm opacity-80">Pilih metode input absensi</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'text-[var(--color-primary-container)] border-b-2 border-[var(--color-primary-container)] bg-blue-50' : 'text-gray-400'}`}
            onClick={() => setMode('manual')}
          >
            <Keyboard size={18} /> Input NIS
          </button>
          <button
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === 'scan' ? 'text-[var(--color-primary-container)] border-b-2 border-[var(--color-primary-container)] bg-blue-50' : 'text-gray-400'}`}
            onClick={() => setMode('scan')}
          >
            <QrCode size={18} /> Scan QR
          </button>
        </div>

        <div className="p-4 relative" style={{ minHeight: '280px' }}>
          {mode === 'manual' ? (
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <Keyboard size={32} />
              </div>
              <form onSubmit={handleManualSubmit} className="w-full space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nomor Induk Santri (NIS)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Contoh: S001"
                    value={nisInput}
                    onChange={(e) => setNisInput(e.target.value.toUpperCase())}
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[var(--color-primary-container)] text-white font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading || !nisInput.trim()}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                  {loading ? 'Memproses...' : 'Absenkan'}
                </button>
              </form>
            </div>
          ) : (
            <div id="reader" className="overflow-hidden rounded-2xl border-0"></div>
          )}

          {loading && mode === 'scan' && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-[var(--color-primary-container)]" size={48} />
            </div>
          )}

          {scanResult && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <CheckCircle size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{scanResult.nama}</h3>
              <p className="text-gray-500">{scanResult.nomor}</p>
              <p className="mt-2 text-sm font-semibold text-green-600">Absensi Berhasil!</p>
              <p className="text-xs text-gray-400">{scanResult.waktu} WIB</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-4 bottom-4 bg-red-100 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 z-30">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Petunjuk</p>
              <p className="text-xs text-gray-600">
                {mode === 'manual'
                  ? 'Masukkan NIS santri lalu tekan Absenkan. Contoh: S001'
                  : 'Pastikan pencahayaan cukup dan kode QR berada di tengah kotak.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">TPQ Anfak Al Azizah - Sistem Absensi Digital</p>
    </div>
  );
};

export default ScannerPage;
