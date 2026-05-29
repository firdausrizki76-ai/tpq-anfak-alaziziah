import React, { useState, useEffect } from 'react';
import { Search, Filter, QrCode, Download, Printer, X, Calendar, Users, FileText, Loader2, BarChart3 } from 'lucide-react';
import { absensiAPI, kelasAPI, santriAPI, guruAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const AbsensiPage = () => {
  const [absensiList, setAbsensiList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('santri'); // 'santri' or 'guru'
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResults, setQrResults] = useState([]);
  // Rekap state
  const [rekapData, setRekapData] = useState([]);
  const [loadingRekap, setLoadingRekap] = useState(false);
  const [rekapTipe, setRekapTipe] = useState('santri');
  const [rekapDari, setRekapDari] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [rekapSampai, setRekapSampai] = useState(new Date().toISOString().split('T')[0]);
  const [rekapKelas, setRekapKelas] = useState('');


  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadAbsensi(); }, [filterTanggal, activeTab]);

  const loadData = async () => {
    try { const kelas = await kelasAPI.getAll(); setKelasList(kelas || []); } catch (e) { console.error(e); }
    loadAbsensi();
  };

  const loadAbsensi = async () => {
    setLoading(true);
    try { 
      const data = await absensiAPI.getAll({ 
        tanggal: filterTanggal,
        role: activeTab 
      }); 
      setAbsensiList(data || []); 
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleGenerateQR = async () => {
    if (!selectedKelas) return;
    setIsGenerating(true);
    try {
      let data;
      if (selectedKelas === 'all_guru') {
        data = await guruAPI.getAll();
        data = data.map(g => ({
          ...g,
          nomor_induk: g.nip,
          nama_lengkap: g.nama_lengkap
        }));
      } else if (selectedKelas === 'all_santri') {
        data = await santriAPI.getAll({ status: 'aktif' });
      } else {
        data = await kelasAPI.getSantri(selectedKelas);
      }
      setQrResults(data || []);
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  const closeModal = () => { setActiveModal(null); setQrResults([]); setSelectedKelas(''); };

  const loadRekap = async (tipe = rekapTipe, dari = rekapDari, sampai = rekapSampai, kelas_id = rekapKelas) => {
    setLoadingRekap(true);
    try {
      const params = { tipe, tanggal_mulai: dari, tanggal_selesai: sampai };
      if (kelas_id) params.kelas_id = kelas_id;
      const data = await absensiAPI.getRekap(params);
      setRekapData(data || []);
    } catch (e) { console.error(e); setRekapData([]); }
    setLoadingRekap(false);
  };


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
    const isPending = keterangan?.includes('(MENUNGGU PERSETUJUAN)');
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

      {/* Tabs: Santri / Guru / Rekap */}
      <div className="flex items-center gap-4 mb-4 no-print">
        {[
          { id: 'santri', label: 'Absensi Santri', icon: Users },
          { id: 'guru', label: 'Absensi Guru', icon: FileText },
          { id: 'rekap', label: 'Rekap Kehadiran', icon: BarChart3 }
        ].map(tab => (
          <button key={tab.id} type="button" className="flex items-center gap-2 transition-all duration-200" style={{
            padding: '10px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            border: activeTab === tab.id ? '1.5px solid #10b981' : '1.5px solid #e5e7eb',
            backgroundColor: activeTab === tab.id ? '#f0fdf4' : '#ffffff',
            color: activeTab === tab.id ? '#047857' : '#6b7280',
            boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(16, 185, 129, 0.1)' : 'none'
          }} onClick={() => { setActiveTab(tab.id); if (tab.id === 'rekap') loadRekap(); }}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>


      {activeTab !== 'rekap' ? (
      <div className="card w-full">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap no-print">
          <div className="flex items-center gap-4 flex-1">
            <div className="input-with-icon" style={{ maxWidth: '200px', width: '100%' }}>
              <Calendar className="icon" size={18} />
              <input type="date" className="input-field" style={{ paddingLeft: '40px' }} value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} />
            </div>
            <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
              <Search className="icon" size={18} />
              <input 
                type="text" 
                className="input-field" 
                placeholder={`Cari nama ${activeTab === 'santri' ? 'santri' : 'guru'}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Waktu Scan</th>
                <th>Nama {activeTab === 'santri' ? 'Santri' : 'Guru'}</th>
                {activeTab === 'santri' && <th>Kelas</th>}
                <th>Status</th>
                <th>Keterangan</th>
                <th width="150">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={activeTab === 'santri' ? 8 : 7} className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : absensiList.length === 0 ? <tr><td colSpan={activeTab === 'santri' ? 8 : 7} className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data absensi {activeTab === 'santri' ? 'santri' : 'guru'} untuk tanggal ini</td></tr>
              : absensiList
                  .filter(a => {
                    const name = activeTab === 'santri' ? a.santri?.nama_lengkap : a.guru?.nama_lengkap;
                    return (name || '').toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((a, i) => (
                <tr key={a.id}>
                  <td>{i+1}</td>
                  <td>{a.tanggal ? new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                  <td>{a.waktu_scan ? new Date(a.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + (() => {
                    const offset = -(new Date().getTimezoneOffset() / 60);
                    if (offset === 7) return 'WIB';
                    if (offset === 8) return 'WITA';
                    if (offset === 9) return 'WIT';
                    return '';
                  })() : '-'}</td>
                  <td className="font-medium">
                    {activeTab === 'santri' ? (a.santri?.nama_lengkap || '-') : (a.guru?.nama_lengkap || '-')}
                  </td>
                  {activeTab === 'santri' && <td>{a.santri?.kelas?.nama_kelas || '-'}</td>}
                  <td>{statusBadge(a.status, a.keterangan)}</td>
                  <td>{a.keterangan || '-'}</td>
                  <td className="text-center">
                    <div className="flex justify-center items-center gap-2">
                      {a.keterangan?.includes('(MENUNGGU PERSETUJUAN)') && (
                        <div className="flex gap-1">
                          <button className="p-1 px-2 text-[10px] bg-emerald-500 text-white rounded hover:bg-emerald-600 font-bold uppercase tracking-tighter" onClick={() => handleApprove(a)}>Setujui</button>
                          <button className="p-1 px-2 text-[10px] bg-orange-500 text-white rounded hover:bg-orange-600 font-bold uppercase tracking-tighter" onClick={() => handleReject(a.id)}>Tolak</button>
                        </div>
                      )}
                      <button 
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Hapus Record"
                        onClick={() => handleReject(a.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
      /* ===== REKAP TAB ===== */
      <div className="card w-full">
        <div className="flex items-center gap-4 mb-6 flex-wrap no-print">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Tipe:</span>
            {[{ id: 'santri', label: 'Santri' }, { id: 'guru', label: 'Guru' }].map(t => (
              <button key={t.id} onClick={() => { setRekapTipe(t.id); loadRekap(t.id, rekapDari, rekapSampai, t.id === 'guru' ? '' : rekapKelas); }} style={{
                padding: '5px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                border: rekapTipe === t.id ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb',
                backgroundColor: rekapTipe === t.id ? '#eff6ff' : '#ffffff',
                color: rekapTipe === t.id ? '#1d4ed8' : '#6b7280'
              }}>{t.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Dari:</span>
            <input type="date" className="input-field py-1.5 px-3 text-sm" style={{ width: '160px' }} value={rekapDari} onChange={(e) => setRekapDari(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Sampai:</span>
            <input type="date" className="input-field py-1.5 px-3 text-sm" style={{ width: '160px' }} value={rekapSampai} onChange={(e) => setRekapSampai(e.target.value)} />
          </div>
          {rekapTipe === 'santri' && (
            <select className="input-field py-1.5 px-3 text-sm" style={{ width: '160px' }} value={rekapKelas} onChange={(e) => setRekapKelas(e.target.value)}>
              <option value="">Semua Kelas</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          )}
          <button className="btn-primary py-1.5 px-4 text-sm" onClick={() => loadRekap()}><Search size={14} /> Tampilkan</button>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama {rekapTipe === 'santri' ? 'Santri' : 'Guru'}</th>
                {rekapTipe === 'santri' && <th>Kelas</th>}
                <th style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>Hadir</th>
                <th style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>Izin</th>
                <th style={{ backgroundColor: '#fefce8', color: '#854d0e' }}>Sakit</th>
                <th style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>Alfa</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {loadingRekap ? <tr><td colSpan={rekapTipe === 'santri' ? 8 : 7} className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : rekapData.length === 0 ? <tr><td colSpan={rekapTipe === 'santri' ? 8 : 7} className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data rekap. Klik "Tampilkan" untuk memuat.</td></tr>
              : rekapData.map((r, i) => (
                <tr key={r.id}>
                  <td>{i+1}</td>
                  <td className="font-medium">{r.nama}</td>
                  {rekapTipe === 'santri' && <td>{r.kelas || '-'}</td>}
                  <td style={{ fontWeight: '700', color: '#166534' }}>{r.hadir || 0}</td>
                  <td style={{ fontWeight: '700', color: '#1e40af' }}>{r.izin || 0}</td>
                  <td style={{ fontWeight: '700', color: '#854d0e' }}>{r.sakit || 0}</td>
                  <td style={{ fontWeight: '700', color: '#991b1b' }}>{r.alfa || 0}</td>
                  <td style={{ fontWeight: '700' }}>{r.total || 0}</td>
                </tr>
              ))}
            </tbody>
            {rekapData.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: '700' }}>
                  <td colSpan={rekapTipe === 'santri' ? 3 : 2} style={{ textAlign: 'right' }}>TOTAL</td>
                  <td style={{ color: '#166534' }}>{rekapData.reduce((s, r) => s + (r.hadir || 0), 0)}</td>
                  <td style={{ color: '#1e40af' }}>{rekapData.reduce((s, r) => s + (r.izin || 0), 0)}</td>
                  <td style={{ color: '#854d0e' }}>{rekapData.reduce((s, r) => s + (r.sakit || 0), 0)}</td>
                  <td style={{ color: '#991b1b' }}>{rekapData.reduce((s, r) => s + (r.alfa || 0), 0)}</td>
                  <td>{rekapData.reduce((s, r) => s + (r.total || 0), 0)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      )}

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
                      <option value="all_santri" style={{ fontWeight: 'bold', color: 'var(--color-primary-container)' }}>-- SEMUA SANTRI --</option>
                      <option value="all_guru" style={{ fontWeight: 'bold', color: 'var(--color-primary-container)' }}>-- SEMUA GURU --</option>
                      {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                    {selectedKelas === 'all_guru' 
                      ? 'Sistem akan membuat QR Code untuk seluruh tenaga pengajar (Guru).' 
                      : selectedKelas === 'all_santri'
                      ? 'Sistem akan membuat QR Code untuk seluruh santri aktif.'
                      : 'Sistem akan membuat QR Code untuk seluruh santri di kelas yang dipilih.'}
                  </p>
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

      {/* Print-only duplicate of QR Results */}
      {qrResults.length > 0 && (
        <div id="print-semua-qr" className="print-only">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '20px' }}>
            {qrResults.map(s => (
              <div key={s.id} style={{ border: '2px dashed #ccc', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: 'white', pageBreakInside: 'avoid' }}>
                <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${s.nomor_induk}`} 
                    alt={`QR ${s.nomor_induk}`}
                    style={{ width: '90px', height: '90px' }}
                  />
                </div>
                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0 2px 0', color: '#1e293b' }}>{s.nama_lengkap}</p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>{s.nomor_induk}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          
          /* Hide everything by default */
          body * { visibility: hidden; }
          
          /* Show only the print container and its contents */
          #print-semua-qr, #print-semua-qr * { visibility: visible; }
          
          /* Position the print container and force parents to be visible but not show their own content */
          #print-semua-qr {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          /* Crucial: parents must not clip or hide the absolute child */
          html, body, #root, .app-layout, .main-wrapper, .content-area, .content-container, .flex-col {
            visibility: visible !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            position: static !important;
            display: block !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AbsensiPage;
