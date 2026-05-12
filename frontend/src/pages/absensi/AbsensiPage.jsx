import React, { useState, useEffect } from 'react';
import { Search, Filter, QrCode, Download, Printer, X, Calendar, Users, FileText, Loader2 } from 'lucide-react';
import { absensiAPI, kelasAPI, santriAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const AbsensiPage = () => {
  const [absensiList, setAbsensiList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResults, setQrResults] = useState([]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadAbsensi(); }, [filterTanggal]);

  const loadData = async () => {
    try { const kelas = await kelasAPI.getAll(); setKelasList(kelas || []); } catch (e) { console.error(e); }
    loadAbsensi();
  };

  const loadAbsensi = async () => {
    setLoading(true);
    try { const data = await absensiAPI.getAll({ tanggal: filterTanggal }); setAbsensiList(data || []); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleGenerateQR = async () => {
    if (!selectedKelas) return;
    setIsGenerating(true);
    try {
      const data = await kelasAPI.getSantri(selectedKelas);
      setQrResults(data || []);
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  const closeModal = () => { setActiveModal(null); setQrResults([]); setSelectedKelas(''); };

  const handleApprove = async (a) => {
    try {
      const newKeterangan = a.keterangan.replace('(MENUNGGU PERSETUJUAN) ', '');
      await absensiAPI.update(a.id, { keterangan: newKeterangan });
      loadAbsensi();
    } catch (e) { alert(e.message); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Hapus data ini?')) return;
    try {
      await absensiAPI.delete(id);
      loadAbsensi();
    } catch (e) { alert(e.message); }
  };

  const statusBadge = (status, keterangan = '') => {
    const isPending = keterangan.includes('(MENUNGGU PERSETUJUAN)');
    const styles = { 
      hadir: 'badge-success', 
      sakit: { backgroundColor: '#fef08a', color: '#854d0e' }, 
      izin: { backgroundColor: '#dbeafe', color: '#1e40af' }, 
      pengajuan_izin: { backgroundColor: '#ffedd5', color: '#9a3412', border: '1px solid #fed7aa' },
      alfa: { backgroundColor: '#fecaca', color: '#991b1b' } 
    };
    if (status === 'hadir') return <span className="badge badge-success">Hadir</span>;
    if (isPending) return <span className="badge" style={styles.pengajuan_izin}>Menunggu Persetujuan</span>;
    return <span className="badge" style={styles[status] || {}}>{status}</span>;
  };

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center flex-wrap gap-4">
        <div><h1 className="page-title">Rekap Absensi</h1><p className="page-subtitle">Pantau kehadiran santri dan guru</p></div>
        <div className="flex gap-2">
          <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={() => setActiveModal('qr_massal')}><QrCode size={18} /> Generate QR Massal</button>
          <button className="btn-primary" onClick={() => setActiveModal('cetak_laporan')}><Printer size={18} /> Cetak Laporan</button>
        </div>
      </div>

      <div className="card w-full">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1">
            <div className="input-with-icon" style={{ maxWidth: '200px', width: '100%' }}>
              <Calendar className="icon" size={18} />
              <input type="date" className="input-field" style={{ paddingLeft: '40px' }} value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} />
            </div>
            <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
              <Search className="icon" size={18} />
              <input type="text" className="input-field" placeholder="Cari nama santri..." />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>No</th><th>Tanggal</th><th>Waktu Scan</th><th>Nama Santri</th><th>Kelas</th><th>Status</th><th>Keterangan</th><th width="150">Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : absensiList.length === 0 ? <tr><td colSpan="8" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data absensi untuk tanggal ini</td></tr>
              : absensiList.map((a, i) => (
                <tr key={a.id}>
                  <td>{i+1}</td>
                  <td>{a.tanggal ? new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                  <td>{a.waktu_scan ? new Date(a.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}</td>
                  <td className="font-medium">{a.santri?.nama_lengkap || '-'}</td>
                  <td>{a.santri?.kelas?.nama_kelas || '-'}</td>
                  <td>{statusBadge(a.status, a.keterangan)}</td>
                  <td>{a.keterangan || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      {a.keterangan?.includes('(MENUNGGU PERSETUJUAN)') && (
                        <>
                          <button className="p-1 px-2 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 font-bold" onClick={() => handleApprove(a)}>Setujui</button>
                          <button className="p-1 px-2 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-bold" onClick={() => handleReject(a.id)}>Tolak</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal === 'qr_massal' && (
        <div className="modal-overlay">
          <style>
            {`
              @media print {
                body * { visibility: hidden; }
                .printable-area, .printable-area * { visibility: visible; }
                .printable-area { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100% !important; 
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .no-print { display: none !important; }
                .modal-overlay { background: white !important; position: static !important; }
                .modal-container { 
                  box-shadow: none !important; 
                  border: none !important; 
                  width: 100% !important; 
                  max-width: none !important; 
                  position: static !important;
                  transform: none !important;
                }
                .qr-grid-print { 
                  display: grid !important; 
                  grid-template-columns: repeat(3, 1fr) !important; 
                  gap: 15px !important;
                  max-height: none !important;
                  overflow: visible !important;
                }
                .qr-card {
                  break-inside: avoid;
                  border: 1px solid #eee !important;
                  padding: 15px !important;
                }
              }
            `}
          </style>
          <div className="modal-container" style={{ maxWidth: qrResults.length > 0 ? '800px' : '500px' }}>
            <div className="modal-header no-print">
              <h2 className="modal-title">Generate QR Code Massal</h2>
              <X className="modal-close" onClick={closeModal} />
            </div>
            <div className="modal-body printable-area">
              {qrResults.length === 0 ? (
                <div className="space-y-4 no-print">
                  <div className="form-group"><label className="form-label">Pilih Kelas</label>
                    <select className="input-field" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
                      <option value="">-- Pilih Kelas --</option>
                      {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">Sistem akan membuat QR Code untuk seluruh santri di kelas yang dipilih.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2 qr-grid-print">
                  {qrResults.map(s => (
                    <div key={s.id} className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center text-center bg-white qr-card">
                      <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center mb-3 border border-gray-100">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${s.nomor_induk}`} 
                          alt={`QR ${s.nomor_induk}`}
                          className="w-20 h-20"
                        />
                      </div>
                      <p className="text-sm font-bold text-gray-800 truncate w-full">{s.nama_lengkap}</p>
                      <p className="text-[10px] text-gray-500">{s.nomor_induk}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer no-print">
              <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
              {qrResults.length === 0 ? <button className="btn-primary" onClick={handleGenerateQR} disabled={!selectedKelas || isGenerating}>{isGenerating ? 'Sedang Memproses...' : 'Mulai Generate'}</button>
              : <button className="btn-primary" onClick={() => window.print()}><Printer size={18} /> Cetak Semua QR</button>}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'cetak_laporan' && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header"><h2 className="modal-title">Cetak Laporan Absensi</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body"><div className="space-y-4">
            <div className="form-group"><label className="form-label">Rentang Tanggal</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="input-field text-sm" />
                <input type="date" className="input-field text-sm" />
              </div>
            </div>
            <div className="form-group"><label className="form-label">Pilih Kelas</label>
              <select className="input-field"><option value="">Semua Kelas</option>{kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}</select>
            </div>
            <div className="form-group"><label className="form-label">Format Laporan</label>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 font-medium"><FileText size={18} /> PDF</button>
                <button className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 text-gray-600 font-medium transition-all"><Download size={18} /> Excel</button>
              </div>
            </div>
          </div></div>
          <div className="modal-footer">
            <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button className="btn-primary" onClick={() => window.print()}><Printer size={18} /> Cetak Laporan</button>
          </div>
        </div></div>
      )}
    </div>
  );
};

export default AbsensiPage;
