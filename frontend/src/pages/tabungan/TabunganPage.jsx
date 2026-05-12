import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowDownCircle, ArrowUpCircle, X, Save, Users, CreditCard, Calendar, Wallet, Loader2, Send, Printer } from 'lucide-react';
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
  const [rekapAdmin, setRekapAdmin] = useState([]);
  const [rekapGuru, setRekapGuru] = useState([]);
  const [activeTab, setActiveTab] = useState('santri'); // 'santri', 'rekap_guru', 'rekap_admin'
  const [searchTerm, setSearchTerm] = useState('');
  const [riwayatFilter, setRiwayatFilter] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });
  const [formData, setFormData] = useState({ santri_id: '', nominal: '', tanggal: new Date().toISOString().split('T')[0], keterangan: '' });
  
  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');
  const isAdmin = user.role === 'admin';
  const isGuru = user.role === 'guru';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { 
      const params = isGuru ? { guru_id: user.id } : {};
      const [data, summary, adminRekap, guruRekap] = await Promise.all([
        tabunganAPI.getAll(params),
        isAdmin ? tabunganAPI.getSummaryGuru() : Promise.resolve([]),
        isAdmin ? tabunganAPI.getRekapAdmin() : Promise.resolve([]),
        tabunganAPI.getRekapGuru() // Always fetch rekap guru so gurus can see their own balance
      ]);
      setSantriData(data || []); 
      setGuruSummary(summary || []);
      setRekapAdmin(adminRekap || []);
      setRekapGuru(guruRekap || []);
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

  const downloadMutasi = () => { window.print(); };

  const closeModal = () => { setActiveModal(null); setSelectedSantri(null); setRiwayat([]); };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'santri_id' && value) { const s = santriData.find(s => s.id === value); setSelectedSantri(s); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (activeModal === 'setor_admin_proses') {
        await tabunganAPI.setorKeAdmin({ guru_id: user.id, nominal: parseInt(formData.nominal), keterangan: formData.keterangan });
      } else {
        await tabunganAPI.transact({ 
          santri_id: formData.santri_id, 
          jenis: activeModal, 
          nominal: parseInt(formData.nominal), 
          tanggal: formData.tanggal, 
          keterangan: formData.keterangan,
          recorded_by: user.id
        });
      }
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

  const myRekap = rekapGuru.find(r => r.guru_id === user.id) || { saldo_di_guru: 0 };

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center flex-wrap gap-4 no-print">
        <div>
          <h1 className="page-title">Tabungan Santri</h1>
          <p className="page-subtitle">
            {isGuru ? `Kelola tabungan santri kelas Anda` : `Monitoring tabungan santri dan rekapan pengajar`}
          </p>
        </div>
        <div className="flex gap-2">
          {isGuru && (
            <button className="btn-primary" style={{ backgroundColor: 'var(--color-primary-container)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onClick={() => {
              setFormData({ ...formData, nominal: myRekap.saldo_di_guru, keterangan: `Setoran tabungan santri ${new Date().toLocaleDateString('id-ID')}` });
              setActiveModal('setor_admin_proses');
            }}>
              <Send size={18} /> Setor ke Pusat ({formatRp(myRekap.saldo_di_guru)})
            </button>
          )}
          <button className="btn-primary" onClick={() => openModal('setor')}><ArrowDownCircle size={18} /> Tabung</button>
          {isAdmin && (
            <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={() => openModal('tarik')}><ArrowUpCircle size={18} /> Tarik</button>
          )}
        </div>
      </div>

      {/* Admin Tabs - Premium Capsule Style */}
      {isAdmin && (
        <div className="flex bg-gray-100/50 p-1 rounded-2xl mb-8 w-fit no-print border border-gray-200/50">
          {[
            { id: 'santri', label: 'Data Santri', icon: <Users size={16} /> },
            { id: 'rekap_guru', label: 'Rekap Guru', icon: <Wallet size={16} /> },
            { id: 'rekap_admin', label: 'Rekap Pusat', icon: <CreditCard size={16} /> }
          ].map((tab) => (
            <button 
              key={tab.id}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-emerald-700 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ border: 'none', cursor: 'pointer' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {isAdmin && activeTab === 'rekap_guru' && (
        <div className="grid grid-3-cols gap-6 mb-6 no-print">
          {rekapGuru.map((g, idx) => (
            <div key={idx} className="card p-4 border-l-4 border-amber-500 bg-white shadow-sm hover:shadow-md transition-all rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">{g.nama_guru}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Saldo Belum Disetor</p>
                </div>
                <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><Wallet size={18} /></div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-amber-700">{formatRp(g.saldo_di_guru)}</p>
                <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold uppercase border-t pt-2 border-gray-50">
                  <span>Koleksi: {formatRp(g.total_koleksi)}</span>
                  <span>Setor: {formatRp(g.total_setoran)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && activeTab === 'rekap_admin' && (
        <div className="card w-full no-print rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 bg-gray-50/50 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-3"><CreditCard size={20} className="text-emerald-600" /> Riwayat Setoran Guru ke Pusat</h3>
            <div className="bg-emerald-600 px-5 py-2.5 rounded-2xl font-black text-white shadow-lg shadow-emerald-200 text-sm">
              Total Dana: {formatRp(rekapAdmin.reduce((s, r) => s + r.nominal, 0))}
            </div>
          </div>
          <div className="table-responsive p-2">
            <table className="data-table w-full">
              <thead><tr><th>No</th><th>Tanggal</th><th>Nama Guru</th><th>Nominal</th><th>Keterangan</th><th>Status</th></tr></thead>
              <tbody>
                {rekapAdmin.length === 0 ? <tr><td colSpan="6" className="text-center py-12 text-gray-400 italic">Belum ada data setoran</td></tr>
                : rekapAdmin.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i+1}</td>
                    <td className="text-gray-500 font-medium">{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="font-bold text-gray-700">{r.guru?.nama_lengkap}</td>
                    <td className="font-black text-emerald-600">{formatRp(r.nominal)}</td>
                    <td className="text-xs text-gray-400 italic">{r.keterangan || '-'}</td>
                    <td><span className="badge badge-success" style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5' }}>DITERIMA</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'santri' && (
        <div className="card w-full no-print rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 bg-gray-50/50 border-b border-gray-100 gap-4 flex-wrap">
            <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
              <Search className="icon text-gray-400" size={18} />
              <input type="text" className="input-field bg-white border-gray-200 focus:border-emerald-500 rounded-2xl shadow-inner" placeholder="Cari nama santri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="font-bold text-sm text-emerald-700 bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200"><Wallet size={16} /></div>
              <span>Total Saldo Santri: <span className="text-lg font-black ml-1">{formatRp(totalSaldo)}</span></span>
            </div>
          </div>

          <div className="table-responsive p-2">
            <table className="data-table w-full">
              <thead><tr><th>No</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Saldo</th><th className="text-center">Aksi</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="6" className="text-center py-12"><Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" /></td></tr>
                : filteredData.length === 0 ? <tr><td colSpan="6" className="text-center py-12 text-gray-400 italic">Belum ada data tabungan</td></tr>
                : filteredData.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="text-gray-400 text-xs font-bold">{i+1}</td>
                    <td className="font-mono text-xs text-gray-500">{s.nomor_induk}</td>
                    <td className="font-bold text-gray-800">{s.nama_lengkap}</td>
                    <td><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase">{s.kelas?.nama_kelas || '-'}</span></td>
                    <td className="font-black text-emerald-700">{formatRp(s.saldo)}</td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-sm"
                          onClick={() => openRiwayat(s)}
                        >
                          <History size={12} /> RIWAYAT
                        </button>
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-sm"
                          onClick={() => openModal('setor', s)}
                        >
                          <ArrowDownCircle size={12} /> TABUNG
                        </button>
                        {isAdmin && (
                          <button 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-sm"
                            onClick={() => openModal('tarik', s)}
                          >
                            <ArrowUpCircle size={12} /> TARIK
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Setor/Tarik/SetorAdmin */}
      {(activeModal === 'setor' || activeModal === 'tarik' || activeModal === 'setor_admin_proses') && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeModal === 'setor' ? 'bg-emerald-100 text-emerald-600' : activeModal === 'tarik' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {activeModal === 'setor' ? <ArrowDownCircle size={24} /> : activeModal === 'tarik' ? <ArrowUpCircle size={24} /> : <Send size={24} />}
              </div>
              <h2 className="modal-title">{activeModal === 'setor' ? 'Tabung Tabungan' : activeModal === 'tarik' ? 'Tarik Tabungan' : 'Setor ke Pusat'}</h2>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          <form onSubmit={handleSubmit}><div className="modal-body"><div className="space-y-4">
            {activeModal !== 'setor_admin_proses' ? (
              <>
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
              </>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                <p className="text-sm text-blue-800 font-bold mb-1">Total Saldo di Pegangan Anda</p>
                <p className="text-3xl font-black text-blue-700">{formatRp(myRekap.saldo_di_guru)}</p>
              </div>
            )}
            <div className="form-group"><label className="form-label">Nominal (Rp)</label>
              <input type="number" name="nominal" className="input-field" value={formData.nominal} onChange={handleInputChange} required />
              {activeModal === 'tarik' && selectedSantri && parseInt(formData.nominal) > (selectedSantri.saldo||0) && <p className="text-xs text-red-500 mt-1">Saldo tidak mencukupi!</p>}
              {activeModal === 'setor_admin_proses' && parseInt(formData.nominal) > myRekap.saldo_di_guru && <p className="text-xs text-orange-600 mt-1">Nominal melebihi saldo rekapan Anda!</p>}
            </div>
            <div className="form-group"><label className="form-label">Tanggal</label><input type="date" name="tanggal" className="input-field" value={formData.tanggal} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Keterangan</label><textarea name="keterangan" className="input-field" rows="2" style={{ resize: 'none' }} value={formData.keterangan} onChange={handleInputChange}></textarea></div>
          </div></div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" style={{ backgroundColor: (activeModal === 'setor' || activeModal === 'setor_admin_proses') ? '#059669' : '#f59e0b' }} disabled={saving || (activeModal === 'tarik' && selectedSantri && parseInt(formData.nominal) > (selectedSantri.saldo||0))}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Konfirmasi {activeModal === 'setor_admin_proses' ? 'Setoran' : ''}
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
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center gap-4 no-print flex-wrap">
              <div className="flex gap-2 items-center">
                <select name="month" className="input-field py-1 px-2 text-sm" style={{ width: '130px' }} value={riwayatFilter.month} onChange={handleFilterChange}>
                  {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select name="year" className="input-field py-1 px-2 text-sm" style={{ width: '100px' }} value={riwayatFilter.year} onChange={handleFilterChange}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button className="btn-primary py-1.5 px-4 text-xs bg-white text-blue-600 border-blue-200" onClick={downloadMutasi}><Printer size={14} /> Cetak Mutasi</button>
            </div>
            <div className="p-4">
              {loadingRiwayat ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>
              : riwayat.length === 0 ? <p className="text-center text-gray-400 py-8">Belum ada riwayat transaksi pada periode ini</p>
              : (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="data-table w-full text-sm">
                    <thead><tr><th>Tanggal</th><th>Tipe</th><th>Nominal</th><th>Keterangan</th><th>Saldo</th></tr></thead>
                    <tbody>
                      {riwayat.map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                          <td><span className={`badge ${r.jenis === 'setor' ? 'badge-success' : 'badge-warning'}`}>{r.jenis.toUpperCase()}</span></td>
                          <td className={`font-bold ${r.jenis === 'setor' ? 'text-emerald-600' : 'text-orange-600'}`}>{r.jenis === 'setor' ? '+' : '-'}{formatRp(r.nominal)}</td>
                          <td className="text-xs text-gray-500">{r.keterangan || '-'}</td>
                          <td className="font-bold">{formatRp(r.saldo_setelah)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer"><button className="btn-primary" onClick={closeModal}>Tutup</button></div>
        </div></div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .modal-overlay, .modal-overlay * { visibility: visible; }
          .modal-overlay { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TabunganPage;
