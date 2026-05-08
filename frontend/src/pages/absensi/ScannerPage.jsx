import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { absensiAPI, santriAPI } from '../../services/api';

const ScannerPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0] // 0 for camera
    });

    qrScanner.render(onScanSuccess, onScanError);
    setScanner(qrScanner);

    return () => {
      if (qrScanner) {
        qrScanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    if (loading) return;
    
    // decodedText should be Nomor Induk (e.g., S001)
    setLoading(true);
    setScanResult(null);
    setError(null);

    try {
      // 1. Get student info by nomor_induk
      const santris = await santriAPI.getAll({ search: decodedText });
      const santri = (santris || []).find(s => s.nomor_induk === decodedText);

      if (!santri) {
        throw new Error('Santri tidak ditemukan');
      }

      // 2. Submit attendance
      const response = await absensiAPI.create({
        santri_id: santri.id,
        tanggal: new Date().toISOString().split('T')[0],
        tipe: 'santri',
        status: 'hadir',
        keterangan: 'Scan QR Guru'
      });

      setScanResult({
        nama: santri.nama_lengkap,
        nomor: santri.nomor_induk,
        waktu: new Date().toLocaleTimeString('id-ID')
      });

      // Show success briefly then reset for next scan
      setTimeout(() => {
        setScanResult(null);
      }, 3000);

    } catch (err) {
      console.error('Scan Error:', err);
      setError(err.message || 'Gagal memproses QR');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (err) => {
    // pattern matching errors are common, just ignore them
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[var(--color-primary-container)] p-6 text-white text-center">
          <h2 className="text-xl font-bold">Scan QR Santri</h2>
          <p className="text-sm opacity-80">Arahkan kamera ke kartu santri</p>
        </div>

        <div className="p-4 relative">
          <div id="reader" className="overflow-hidden rounded-2xl border-0"></div>
          
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-[var(--color-primary-container)]" size={48} />
            </div>
          )}

          {scanResult && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
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
            <div className="absolute inset-x-4 bottom-4 bg-red-100 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 z-30 animate-in slide-in-from-bottom duration-300">
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
              <p className="text-xs text-gray-600">Pastikan pencahayaan cukup dan kode QR berada di tengah kotak.</p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-gray-400">TPQ Anfak Al Azizah - Sistem Absensi Digital</p>
    </div>
  );
};

export default ScannerPage;
