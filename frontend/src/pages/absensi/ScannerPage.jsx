import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, X, Loader2, Keyboard, QrCode, History } from 'lucide-react';
import { absensiAPI, santriAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './ScannerPage.css';

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

  const isProcessing = useRef(false);

  const processAttendance = async (nomorInduk) => {
    if (isProcessing.current || loading) return;
    isProcessing.current = true;
    setLoading(true);
    setScanResult(null);
    setError(null);

    try {
      const trimmedNIS = nomorInduk.trim().toUpperCase();
      
      const santris = await santriAPI.getAll({ search: trimmedNIS });
      const santri = (santris || []).find(s => 
        s.nomor_induk?.toUpperCase() === trimmedNIS || 
        s.barcode_data === trimmedNIS
      );

      if (!santri) {
        throw new Error(`Santri "${trimmedNIS}" tidak ditemukan`);
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
      
      // If scan was successful, switch back to manual mode to "close" scanner as requested
      if (mode === 'scan') {
        setTimeout(() => {
          setMode('manual');
        }, 3000); // Wait for feedback overlay to show before switching
      }

    } catch (err) {
      setError(err.message || 'Gagal memproses absensi');
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (isProcessing.current || loading || scanResult) return;
    
    // Stop scanner immediately to prevent spam
    stopScanner();
    
    await processAttendance(decodedText);
  };

  const onScanError = (err) => {
    if (typeof err === 'string' && !err.includes("No MultiFormat Readers")) {
      console.warn('Scanner frame error:', err);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!nisInput.trim()) return;
    await processAttendance(nisInput.trim());
  };

  return (
    <div className="scanner-container">
      <div className="scanner-card">
        <div className="scanner-header">
          <button 
            onClick={() => navigate('/guru/dashboard')}
            className="scanner-close-btn"
            title="Tutup"
          >
            <X size={20} />
          </button>
          <h2 className="scanner-title">Absensi Santri</h2>
          <p className="scanner-subtitle">TPQ ANFAK AL AZIZIAH</p>
        </div>

        {/* Mode Switcher */}
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
          >
            <Keyboard size={18} />
            <span>Manual</span>
          </button>
          <button
            className={`mode-btn ${mode === 'scan' ? 'active' : ''}`}
            onClick={() => setMode('scan')}
          >
            <QrCode size={18} />
            <span>Kamera</span>
          </button>
        </div>

        <div className="scanner-body">
          {mode === 'manual' ? (
            <div className="manual-input-container">
              <div className="manual-icon-wrapper">
                <Keyboard size={40} />
              </div>
              <form onSubmit={handleManualSubmit} className="input-group">
                <label className="input-label">Masukkan NIS Santri</label>
                <input
                  type="text"
                  className="nis-input"
                  placeholder="S001"
                  value={nisInput}
                  onChange={(e) => setNisInput(e.target.value.toUpperCase())}
                  autoFocus
                  disabled={loading}
                />
                <div style={{ marginTop: '24px' }}>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading || !nisInput.trim()}
                  >
                    {loading ? <Loader2 size={24} className="loading-spinner" /> : <CheckCircle size={24} />}
                    <span>{loading ? 'Memproses...' : 'Absenkan Sekarang'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="reader-container">
               <div id="reader"></div>
            </div>
          )}

          {/* Feedback Overlay */}
          {scanResult && (
            <div className="feedback-overlay animate-in fade-in zoom-in duration-300">
              <div className="success-icon-wrapper">
                <CheckCircle size={56} />
              </div>
              <h3 className="success-name">{scanResult.nama}</h3>
              <p className="success-nis">{scanResult.nomor}</p>
              <div className="success-badge">
                <CheckCircle size={16} />
                <span>Absensi Berhasil</span>
              </div>
              <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
                {scanResult.waktu} WIB
              </p>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="error-toast animate-in slide-in-from-bottom duration-300">
              <div className="error-icon-wrapper">
                <AlertCircle size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '800', color: '#991b1b' }}>Gagal</p>
                <p style={{ fontSize: '12px', color: '#b91c1c' }}>{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div style={{ padding: '0 24px 24px' }}>
          <div className="instruction-panel">
            <div style={{ color: '#f59e0b', marginTop: '2px' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                Petunjuk
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                {mode === 'manual'
                  ? 'Ketik NIS santri dan tekan tombol hijau untuk absensi manual.'
                  : 'Arahkan kamera ke QR Code santri sampai terdengar bunyi beep.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => navigate('/guru/absen/riwayat')}
        className="history-btn"
      >
        <History size={20} />
        <span>Lihat Riwayat Absensi</span>
      </button>

      <p style={{ marginTop: '32px', fontSize: '10px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '3px', textTransform: 'uppercase' }}>
        TPQ Anfak Al Azizah
      </p>
    </div>
  );
};

export default ScannerPage;

