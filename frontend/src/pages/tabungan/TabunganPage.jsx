import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowDownCircle, ArrowUpCircle, X, Save, Users, CreditCard, Calendar, Wallet, Loader2, Send } from 'lucide-react';
import { tabunganAPI, santriAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const TabunganPage = () => {
  const [santriData, setSantriData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [guruSummary, setGuruSummary] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [riwayatFilter, setRiwayatFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ santri_id: '', nominal: '', tanggal: new Date().toISOString().split('T')[0], keterangan: '' });
  
  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');
  const isAdmin = user.role === 'admin';
  const isGuru = user.role === 'guru';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { 
      const params = isGuru ? { guru_id: user.id } : {};
      const [data, summary] = await Promise.all([
        tabunganAPI.getAll(params),
        isAdmin ? tabunganAPI.getSummaryGuru() : Promise.resolve([])
      ]);
      setSantriData(data || []); 
      setGuruSummary(summary || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = (type, santri = null) => {
    setActiveModal(type);
    if (santri) { setSelectedSantri(santri); setFormData(prev => ({ ...prev, santri_id: santri.id })); }
    else { setSelectedSantri(null); setFormData({ santri_id: '', nominal: '', tanggal: new Date().toISOString().split('T')[0], keterangan: '' }); }
  };

  const openRiwayat = async (santri, filter = null) => {
    const f = filter || riwayatFilter;
    setSelectedSantri(santri);
    setActiveModal('riwayat');
    setLoadingRiwayat(true);
    try {
      const data = await tabunganAPI.getRiwayat(santri.id, f);
      setRiwayat(data || []);
    } catch (e) { console.error(e); }
    setLoadingRiwayat(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilter = { ...riwayatFilter, [name]: value };
    setRiwayatFilter(newFilter);
    if (selectedSantri) openRiwayat(selectedSantri, newFilter);
  };

  const downloadMutasi = () => {
    window.print();
  };

  const closeModal = () => { setActiveModal(null); setSelectedSantri(null); setRiwayat([]); };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'santri_id' && value) { const s = santriData.find(s => s.id === value); setSelectedSantri(s); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await tabunganAPI.transact({ santri_id: formData.santri_id, jenis: activeModal, nominal: parseInt(formData.nominal), tanggal: formData.tanggal, keterangan: formData.keterangan });
      await loadData(); closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;
  const totalSaldo = santriData.reduce((s, d) => s + (d.saldo || 0), 0);

  const filteredData = santriData.filter(s => 
    s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nomor_induk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h1 className="page-title">Tabungan Santri</h1>
          <p className="page-subtitle">
            {isGuru ? `Kelola tabungan santri kelas yang Anda ampu` : `Pencatatan setoran dan penarikan tabungan santri`}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button className="btn-primary" style={{ backgroundColor: showSummary ? 'var(--color-primary-container)' : 'white', color: showSummary ? 'white' : 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)' }} onClick={() => setShowSummary(!showSummary)}>
              <Users size={18} /> {showSummary ? 'Lihat List Santri' : 'Rekapan Per Guru'}
            </button>
          )}
        {isGuru && (
          <button className="btn-primary" style={{ backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }} onClick={() => openModal('setor_admin')}>
            <Send size={18} /> Setor ke Admin
          </button>
        )}
          <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={() => openModal('tarik')}><ArrowUpCircle size={18} /> Tarik</button>
          <button className="btn-primary" onClick={() => openModal('setor')}><ArrowDownCircle size={18} /> Setor</button>
        </div>
      </div>

      {isAdmin && showSummary && (
        <div className="grid grid-3-cols gap-6 mb-6 no-print">
          {guruSummary.map((g, idx) => (
            <div key={idx} className="card p-4 border-l-4 border-emerald-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">{g.nama_guru}</h3>
                  <p className="text-xs text-gray-500">Kelas: {g.kelas_names?.join(', ') || '-'}</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><Users size={16} /></div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-400 uppercase font-semibold">Total Saldo di Guru</p>
                <p className="text-xl font-bold text-emerald-700">{formatRp(g.total_saldo)}</p>
                <p className="text-xs text-gray-500 mt-1">{g.jumlah_santri} santri aktif</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card w-full no-print">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
            <Search className="icon" size={18} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Cari nama santri..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="font-semibold text-lg text-[var(--color-primary-container)] bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
            <Wallet className="text-emerald-600" size={20} />
            Total Saldo: <span className="text-emerald-700">{formatRp(totalSaldo)}</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>No</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Saldo</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : filteredData.length === 0 ? <tr><td colSpan="6" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data tabungan</td></tr>
              : filteredData.map((s, i) => (
                <tr key={s.id}>
                  <td>{i+1}</td><td>{s.nomor_induk}</td><td className="font-medium">{s.nama_lengkap}</td>
                  <td>{s.kelas?.nama_kelas || '-'}</td>
                  <td className="font-bold text-emerald-700">{formatRp(s.saldo)}</td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button className="p-1 px-3 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 rounded" onClick={() => openRiwayat(s)}>Riwayat</button>
                      <button className="p-1 px-3 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded" onClick={() => openModal('setor', s)}>Setor</button>
                      <button className="p-1 px-3 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 rounded" onClick={() => openModal('tarik', s)}>Tarik</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(activeModal === 'setor' || activeModal === 'tarik') && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeModal === 'setor' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                {activeModal === 'setor' ? <ArrowDownCircle size={24} /> : <ArrowUpCircle size={24} />}
              </div>
              <h2 className="modal-title">{activeModal === 'setor' ? 'Setor Tabungan' : 'Tarik Tabungan'}</h2>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          <form onSubmit={handleSubmit}><div className="modal-body"><div className="space-y-4">
            <div className="form-group"><label className="form-label">Pilih Santri</label>
              <select name="santri_id" className="input-field" value={formData.santri_id} onChange={handleInputChange} required disabled={!!selectedSantri}>
                <option value="">-- Pilih --</option>
                {santriData.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap} ({s.kelas?.nama_kelas})</option>)}
              </select>
            </div>
            {selectedSantri && (
              <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-2"><Wallet size={16} /> Saldo</span>
                <span className="font-bold text-emerald-700">{formatRp(selectedSantri.saldo)}</span>
              </div>
            )}
            <div className="form-group"><label className="form-label">Nominal (Rp)</label>
              <input type="number" name="nominal" className="input-field" value={formData.nominal} onChange={handleInputChange} placeholder="50000" required />
              {activeModal === 'tarik' && selectedSantri && parseInt(formData.nominal) > (selectedSantri.saldo||0) && <p className="text-xs text-red-500 mt-1">Saldo tidak mencukupi!</p>}
            </div>
            <div className="form-group"><label className="form-label">Tanggal</label><input type="date" name="tanggal" className="input-field" value={formData.tanggal} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Keterangan</label><textarea name="keterangan" className="input-field" rows="2" style={{ resize: 'none' }} value={formData.keterangan} onChange={handleInputChange}></textarea></div>
          </div></div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" style={{ backgroundColor: activeModal === 'setor' ? '#10b981' : '#f59e0b' }} disabled={saving || (activeModal === 'tarik' && selectedSantri && parseInt(formData.nominal) > (selectedSantri.saldo||0))}>
              <Save size={18} /> Konfirmasi
            </button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'riwayat' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '700px' }}>
          <div className="modal-header no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><CreditCard size={24} /></div>
              <div><h2 className="modal-title">Riwayat Tabungan</h2><p className="text-xs text-gray-500">{selectedSantri.nama_lengkap}</p></div>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          
          <div className="modal-body p-0">
            {/* Print Only Header */}
            <div className="print-only mb-6 text-center" style={{ display: 'none' }}>
              <h2 className="font-bold text-xl uppercase">Laporan Mutasi Tabungan</h2>
              <p className="text-sm">{selectedSantri.nama_lengkap} ({selectedSantri.nomor_induk})</p>
              <p className="text-xs text-gray-500">Periode: {riwayatFilter.month}/{riwayatFilter.year}</p>
              <hr className="my-4" />
            </div>

            <div className="p-4 bg-gray-50 border-b flex justify-between items-center gap-4 no-print flex-wrap">
              <div className="flex gap-2 items-center">
                <select name="month" className="input-field py-1 px-2 text-sm" style={{ width: '130px' }} value={riwayatFilter.month} onChange={handleFilterChange}>
                  {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select name="year" className="input-field py-1 px-2 text-sm" style={{ width: '100px' }} value={riwayatFilter.year} onChange={handleFilterChange}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button className="btn-primary py-1.5 px-4 text-xs bg-white text-blue-600 border-blue-200" onClick={downloadMutasi}><ArrowDownCircle size={14} /> Download PDF</button>
            </div>

            <div className="p-4">
              {loadingRiwayat ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
              : riwayat.length === 0 ? <p className="text-center text-gray-400 py-8">Belum ada riwayat transaksi pada periode ini</p>
              : (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="data-table w-full text-sm">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Tanggal</th><th>Tipe</th><th>Nominal</th><th>Keterangan</th><th>Saldo</th></tr></thead>
                    <tbody>
                      {riwayat.map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                          <td><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${r.jenis === 'setor' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{r.jenis}</span></td>
                          <td className={`font-medium ${r.jenis === 'setor' ? 'text-emerald-600' : 'text-orange-600'}`}>{r.jenis === 'setor' ? '+' : '-'}{formatRp(r.nominal)}</td>
                          <td className="text-gray-500 text-xs">{r.keterangan || '-'}</td>
                          <td className="font-semibold">{formatRp(r.saldo_setelah)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer no-print"><button className="btn-primary" onClick={closeModal}>Tutup</button></div>
        </div></div>
      )}

      {activeModal === 'setor_admin' && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Send size={24} /></div>
              <div><h2 className="modal-title">Setor ke Admin</h2><p className="text-xs text-gray-500">Rekap tabungan kelas Anda</p></div>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          <div className="modal-body">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mb-4">
              <p className="text-sm text-emerald-800 font-semibold">Total Saldo Seluruh Santri</p>
              <p className="text-2xl font-bold text-emerald-700">{formatRp(totalSaldo)}</p>
              <p className="text-xs text-emerald-600 mt-1">{filteredData.length} santri</p>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredData.filter(s => s.saldo > 0).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{s.nama_lengkap}</p>
                    <p className="text-[10px] text-gray-500">{s.nomor_induk}</p>
                  </div>
                  <span className="font-bold text-emerald-700 text-sm">{formatRp(s.saldo)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-800">Silakan serahkan uang tabungan sebesar <strong>{formatRp(totalSaldo)}</strong> ke bendahara/admin TPQ. Cetak halaman ini sebagai bukti serah terima.</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Tutup</button>
            <button className="btn-primary" onClick={() => window.print()}><CreditCard size={18} /> Cetak Rekap</button>
          </div>
        </div></div>
      )}

      <style>{`
        @media print {
          .modal-overlay { position: static !important; background: white !important; display: block !important; padding: 0 !important; }
          .modal-container { border: none !important; box-shadow: none !important; max-width: 100% !important; margin: 0 !important; }
          .print-only { display: block !important; }
          .no-print { display: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; }
        }
      `}</style>
    </div>
  );
};

export default TabunganPage;
