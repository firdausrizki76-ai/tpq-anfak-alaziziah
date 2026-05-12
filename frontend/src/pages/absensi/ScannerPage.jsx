import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, X, Loader2, Keyboard, QrCode, History } from 'lucide-react';
import { absensiAPI, santriAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ScannerPage = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('manual'); // 'scan' or 'manual'
  const [nisInput, setNisInput] = useState('');
  const scannerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Preload beep sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/700/700-preview.mp3');
  }, []);

  useEffect(() => {
    if (mode === 'scan') {
      const timeoutId = setTimeout(() => {
        initScanner();
      }, 500);
      return () => {
        clearTimeout(timeoutId);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [mode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Scanner clear error:', e);
      }
      scannerRef.current = null;
    }
  };

  const initScanner = async () => {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      
      // Make sure the element exists
      const readerElement = document.getElementById('reader');
      if (!readerElement) return;

      const qrScanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * 0.7);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0
      });

      qrScanner.render(onScanSuccess, onScanError);
      scannerRef.current = qrScanner;
    } catch (err) {
      console.error('Scanner init error:', err);
      setError('Gagal memuat scanner. Pastikan kamera tersedia.');
    }
  };

  const playBeep = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.warn('Audio play failed', e));
    }
  };

  const processAttendance = async (nomorInduk) => {
    if (loading) return;
    setLoading(true);
    setScanResult(null);
    setError(null);

    try {
      const trimmedNIS = nomorInduk.trim().toUpperCase();
      
      // First, find the santri
      const santris = await santriAPI.getAll({ search: trimmedNIS });
      const santri = (santris || []).find(s => 
        s.nomor_induk?.toUpperCase() === trimmedNIS || 
        s.barcode_data === trimmedNIS // Support barcode data if available
      );

      if (!santri) {
        throw new Error(`Santri dengan kode "${trimmedNIS}" tidak ditemukan`);
      }

      await absensiAPI.create({
        santri_id: santri.id,
        tanggal: new Date().toISOString().split('T')[0],
        tipe: 'santri',
        status: 'hadir',
        keterangan: mode === 'scan' ? 'Scan QR/Barcode' : 'Input Manual NIS'
      });

      playBeep();
      setScanResult({
        nama: santri.nama_lengkap,
        nomor: santri.nomor_induk,
        waktu: new Date().toLocaleTimeString('id-ID')
      });

      setNisInput('');
      
      // Auto clear result after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    } catch (err) {
      setError(err.message || 'Gagal memproses absensi');
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (loading || scanResult) return; // Prevent double scanning
    await processAttendance(decodedText);
  };

  const onScanError = (err) => {
    // Only log real errors, not "no QR code found" frames
    if (typeof err === 'string' && !err.includes("No MultiFormat Readers were able to decode")) {
      console.warn('Scanner frame error:', err);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!nisInput.trim()) return;
    await processAttendance(nisInput.trim());
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-50 pb-20">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[var(--color-primary-container)] p-6 text-white text-center relative">
          <button 
            onClick={() => navigate('/guru/dashboard')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold">Absensi Santri</h2>
          <p className="text-sm opacity-80">Portal Guru - TPQ Anfak Al Azizah</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'text-[var(--color-primary-container)] border-b-2 border-[var(--color-primary-container)] bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setMode('manual')}
          >
            <Keyboard size={18} /> Manual
          </button>
          <button
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === 'scan' ? 'text-[var(--color-primary-container)] border-b-2 border-[var(--color-primary-container)] bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setMode('scan')}
          >
            <QrCode size={18} /> Kamera
          </button>
        </div>

        <div className="p-4 relative" style={{ minHeight: '300px' }}>
          {mode === 'manual' ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <Keyboard size={40} />
              </div>
              <form onSubmit={handleManualSubmit} className="w-full space-y-4 px-2">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Masukkan NIS Santri</label>
                  <input
                    type="text"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-center text-2xl font-bold tracking-widest focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                    placeholder="S001"
                    value={nisInput}
                    onChange={(e) => setNisInput(e.target.value.toUpperCase())}
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-[var(--color-primary-container)] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                  disabled={loading || !nisInput.trim()}
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} />}
                  {loading ? 'Memproses...' : 'Absenkan'}
                </button>
              </form>
            </div>
          ) : (
            <div className="py-2">
               <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50"></div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 transition-all">
              <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-[var(--color-primary-container)]" size={48} />
                <p className="font-bold text-gray-700">Memproses...</p>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-inner">
                <CheckCircle size={56} />
              </div>
              <h3 className="text-2xl font-black text-gray-800 text-center px-6 leading-tight">{scanResult.nama}</h3>
              <p className="text-gray-500 font-medium mt-1">{scanResult.nomor}</p>
              <div className="mt-6 px-4 py-2 bg-green-50 text-green-700 rounded-full font-bold text-sm flex items-center gap-2">
                <CheckCircle size={16} /> Absensi Berhasil
              </div>
              <p className="text-xs text-gray-400 mt-4 font-medium">{scanResult.waktu} WIB</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-4 bottom-4 bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-4 text-red-700 z-30 shadow-xl animate-in slide-in-from-bottom duration-300">
              <div className="w-10 h-10 bg-red-100 rounded-full flex-shrink-0 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Terjadi Kesalahan</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-full"><X size={18} /></button>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Petunjuk</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {mode === 'manual'
                  ? 'Masukkan NIS santri lalu klik tombol Absenkan. Pastikan NIS sudah benar.'
                  : 'Arahkan kamera ke kode QR/Barcode santri. Pastikan pencahayaan cukup.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => navigate('/guru/kelas')}
        className="mt-8 flex items-center gap-2 px-6 py-3 bg-white text-gray-600 font-bold rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
      >
        <History size={18} />
        Lihat Riwayat Absensi
      </button>

      <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">TPQ Anfak Al Azizah</p>
    </div>
  );
};

export default ScannerPage;

