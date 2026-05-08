import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Printer, CheckCircle, AlertCircle, X, Save, Receipt, CreditCard, Calendar, Users, Settings, Loader2, MessageCircle } from 'lucide-react';
import { pembayaranAPI, santriAPI, jenisPembayaranAPI, kelasAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const PembayaranPage = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [jenisList, setJenisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedJenis, setSelectedJenis] = useState(null);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState('');
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [formData, setFormData] = useState({ id: '', santri_id: '', jenis_pembayaran_id: '', nominal: '', tanggal_bayar: new Date().toISOString().split('T')[0], metode_bayar: 'tunai', bulan: new Date().getMonth()+1, tahun: new Date().getFullYear(), status: 'lunas', catatan: '' });
  const [billingData, setBillingData] = useState({ jenis_pembayaran_id: '', nominal: '50000', kelas_id: '', bulan: new Date().getMonth()+1, tahun: new Date().getFullYear() });
  const [jenisForm, setJenisForm] = useState({ nama: '', kategori: 'bulanan', nominal_default: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, s, st, j, k] = await Promise.all([
        pembayaranAPI.getAll().catch(() => []), pembayaranAPI.getStats().catch(() => null),
        santriAPI.getAll().catch(() => []), jenisPembayaranAPI.getAll().catch(() => []), kelasAPI.getAll().catch(() => [])
      ]);
      setPayments(p || []); setStats(s); setSantriList(st || []); setJenisList(j || []); setKelasList(k || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const closeModal = () => { setActiveModal(null); setSelectedJenis(null); setUnpaidBills([]); setSelectedBillId(''); setJenisForm({ nama: '', kategori: 'bulanan', nominal_default: '' }); };
  
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'santri_id' && value) {
      setLoadingBills(true);
      try {
        const bills = await pembayaranAPI.getAll({ santri_id: value, status: 'belum' });
        setUnpaidBills(bills || []);
        setSelectedBillId('');
      } catch (e) { console.error(e); }
      setLoadingBills(false);
    }
  };

  const handleSelectBill = (id) => {
    setSelectedBillId(id);
    const bill = unpaidBills.find(b => b.id === id);
    if (bill) {
      setFormData(prev => ({
        ...prev,
        id: bill.id,
        jenis_pembayaran_id: bill.jenis_pembayaran_id,
        nominal: bill.nominal,
        bulan: bill.bulan,
        tahun: bill.tahun
      }));
    } else {
      setFormData(prev => ({ ...prev, id: '', jenis_pembayaran_id: '', nominal: '', bulan: new Date().getMonth()+1, tahun: new Date().getFullYear() }));
    }
  };

  const handleBillingChange = (e) => { 
    const { name, value } = e.target;
    if (name === 'jenis_pembayaran_id') {
      const selected = jenisList.find(j => j.id === value);
      setBillingData(prev => ({ ...prev, [name]: value, nominal: selected?.nominal_default || prev.nominal }));
    } else {
      setBillingData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  const handleSubmitPayment = async (e) => {
    e.preventDefault(); setSaving(true);
    try { 
      if (formData.id) {
        // Update existing bill
        await pembayaranAPI.update(formData.id, { 
          status: 'lunas', 
          tanggal_bayar: formData.tanggal_bayar, 
          metode_bayar: formData.metode_bayar,
          catatan: formData.catatan
        });
      } else {
        // Create new manual payment
        await pembayaranAPI.create(formData); 
      }
      await loadData(); closeModal(); 
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSubmitBilling = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await pembayaranAPI.generate(billingData); await loadData(); closeModal(); alert('Tagihan berhasil digenerate!'); } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleJenisSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (selectedJenis) await jenisPembayaranAPI.update(selectedJenis.id, jenisForm);
      else await jenisPembayaranAPI.create(jenisForm);
      await loadData(); closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDeleteJenis = async (id) => {
    if (!window.confirm('Hapus jenis tagihan ini?')) return;
    try { await jenisPembayaranAPI.delete(id); await loadData(); } catch (e) { alert(e.message); }
  };

  const handlePrint = (p) => {
    setSelectedSantri(p);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleWA = (p) => {
    const hp = p.santri?.no_hp_wali;
    if (!hp) { alert('Nomor HP wali santri tidak tersedia'); return; }
    const cleanHp = hp.replace(/\D/g, '');
    const waNumber = cleanHp.startsWith('0') ? '62' + cleanHp.substring(1) : cleanHp;
    const nama_tagihan = p.jenis?.nama || p.jenis_pembayaran?.nama || 'Tagihan';
    const message = p.status === 'lunas' 
      ? `Assalamualaikum Wr. Wb.\n\nTerima kasih, pembayaran *${nama_tagihan}* an. *${p.santri?.nama_lengkap}* periode *${p.bulan}/${p.tahun}* sebesar *${formatRp(p.nominal)}* telah LUNAS kami terima.\n\nTerima kasih atas kerja samanya.\n\nSalam,\n*TPQ Anfak Al Azizah*`
      : `Assalamualaikum Wr. Wb.\n\nMohon maaf sekadar mengingatkan, tagihan *${nama_tagihan}* an. *${p.santri?.nama_lengkap}* periode *${p.bulan}/${p.tahun}* sebesar *${formatRp(p.nominal)}* saat ini statusnya BELUM LUNAS.\n\nMohon untuk segera diselesaikan. Terima kasih.\n\nSalam,\n*TPQ Anfak Al Azizah*`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex-col gap-6 w-full">
      {/* Kwitansi Area (Visible only in Print) */}
      {selectedSantri && activeModal !== 'catat' && activeModal !== 'generate' && activeModal !== 'kelola_jenis' && (
        <div id="kwitansi-print" className="print-only" style={{ padding: '40px', border: '2px solid #333', maxWidth: '800px', margin: '0 auto', fontFamily: 'serif', backgroundColor: 'white' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', margin: '0' }}>TPQ ANFAK AL AZIZAH</h1>
            <p style={{ fontSize: '14px', margin: '5px 0' }}>Sistem Informasi Administrasi Santri Terpadu</p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', textDecoration: 'underline', margin: '0' }}>BUKTI PEMBAYARAN (KWITANSI)</h2>
            <p style={{ fontSize: '14px' }}>No: INV/{selectedSantri.id.substring(0,8).toUpperCase()}</p>
          </div>
          <table style={{ width: '100%', fontSize: '16px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ width: '200px', padding: '10px 0' }}>Telah Terima Dari</td><td style={{ width: '20px' }}>:</td><td style={{ borderBottom: '1px dotted #333', fontWeight: 'bold' }}>{selectedSantri.santri?.nama_lengkap}</td></tr>
              <tr><td style={{ padding: '10px 0' }}>Nomor Induk (NIS)</td><td>:</td><td style={{ borderBottom: '1px dotted #333' }}>{selectedSantri.santri?.nomor_induk}</td></tr>
              <tr><td style={{ padding: '10px 0' }}>Untuk Pembayaran</td><td>:</td><td style={{ borderBottom: '1px dotted #333' }}>{selectedSantri.jenis?.nama || selectedSantri.jenis_pembayaran?.nama || 'Syahriah'} - Periode {selectedSantri.bulan}/{selectedSantri.tahun}</td></tr>
              <tr><td style={{ padding: '10px 0' }}>Jumlah Uang</td><td>:</td><td style={{ borderBottom: '1px dotted #333', fontWeight: 'bold', fontSize: '18px' }}>{formatRp(selectedSantri.nominal)}</td></tr>
              <tr><td style={{ padding: '10px 0' }}>Terbilang</td><td>:</td><td style={{ borderBottom: '1px dotted #333', fontStyle: 'italic' }}>#{selectedSantri.nominal.toLocaleString('id-ID')} Rupiah#</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}>
            <div style={{ width: '250px', textAlign: 'center' }}>
              <p>Sidoarjo, {new Date(selectedSantri.tanggal_bayar || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style={{ marginBottom: '80px' }}>Bendahara TPQ,</p>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( .................................... )</p>
            </div>
          </div>
        </div>
      )}
      <div className="page-header mb-6 flex justify-between items-center flex-wrap gap-4 no-print">
        <div><h1 className="page-title">Pembayaran & Tagihan</h1><p className="page-subtitle">Kelola administrasi keuangan dan tagihan santri</p></div>
        <div className="flex gap-2">
          <button className="btn-primary" style={{ backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }} onClick={() => setActiveModal('kelola_jenis')}><Settings size={18} /> Kelola Jenis</button>
          <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={() => setActiveModal('generate')}><Receipt size={18} /> Generate Tagihan</button>
          <button className="btn-primary" onClick={() => setActiveModal('catat')}><Plus size={18} /> Catat Pembayaran</button>
        </div>
      </div>

      <div className="grid grid-4-cols mb-6 no-print">
        <div className="card stat-card" style={{ padding: '20px' }}><div className="stat-title">Pemasukan Bulan Ini</div><div className="stat-value text-emerald-600">{stats ? formatRp(stats.totalLunas) : '—'}</div><div className="stat-subtitle">{stats?.jumlahLunas || 0} santri</div></div>
        <div className="card stat-card" style={{ padding: '20px' }}><div className="stat-title">Total Tunggakan</div><div className="stat-value text-orange-600">{stats ? formatRp(stats.totalBelum) : '—'}</div><div className="stat-subtitle">{stats?.jumlahBelum || 0} santri belum lunas</div></div>
      </div>

      <div className="card w-full no-print">
        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>No</th><th>Tanggal</th><th>Nama Santri</th><th>Jenis</th><th>Periode</th><th>Nominal</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : payments.length === 0 ? <tr><td colSpan="8" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data pembayaran</td></tr>
              : payments.map((p, i) => (
                <tr key={p.id}>
                  <td>{i+1}</td>
                  <td>{p.tanggal_bayar ? new Date(p.tanggal_bayar).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="font-medium">{p.santri?.nama_lengkap || '-'}</td>
                  <td><span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded">{p.jenis?.nama || p.jenis_pembayaran?.nama || 'Syahriah'}</span></td>
                  <td>{p.bulan}/{p.tahun}</td>
                  <td>{formatRp(p.nominal)}</td>
                  <td>{p.status === 'lunas' ? <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold"><CheckCircle size={16} /> Lunas</span> : <span className="flex items-center gap-1 text-orange-600 text-sm font-semibold"><AlertCircle size={16} /> Belum</span>}</td>
                  <td className="text-center flex justify-center gap-2">
                    {p.status === 'lunas' && <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Cetak Kwitansi" onClick={() => handlePrint(p)}><Printer size={18} /></button>}
                    <button 
                      className="p-1.5 rounded-full hover:bg-emerald-50 transition-all active:scale-95" 
                      style={{ color: '#25D366', backgroundColor: '#f0fff4', border: '1px solid #dcfce7' }}
                      title="Kirim Pesan WA" 
                      onClick={() => handleWA(p)}
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.448-1.271.607-1.445.159-.175.348-.218.463-.218.116 0 .232.001.334.005.109.004.256-.041.401.31.145.352.493 1.203.536 1.29.044.087.073.188.014.305-.058.116-.088.188-.174.289-.087.101-.182.227-.261.306-.087.087-.179.181-.077.357.102.176.454.748.975 1.211.672.596 1.24.782 1.416.869.176.087.278.073.381-.044.102-.116.448-.522.568-.7.12-.179.24-.15.405-.09.165.06 1.044.493 1.223.583.179.09.298.135.342.21.044.075.044.434-.1.839zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal === 'catat' && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '500px' }}>
          <div className="modal-header"><h2 className="modal-title">Catat Pembayaran Baru</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={handleSubmitPayment}><div className="modal-body"><div className="space-y-4">
            <div className="form-group"><label className="form-label">Pilih Santri</label><select name="santri_id" className="input-field" value={formData.santri_id} onChange={handleInputChange} required><option value="">-- Cari Santri --</option>{santriList.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap} ({s.kelas?.nama_kelas})</option>)}</select></div>
            
            {formData.santri_id && (
              <div className="form-group">
                <label className="form-label">Pilih Tagihan Belum Lunas</label>
                {loadingBills ? <div className="text-xs text-gray-500 py-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Mencari tagihan...</div>
                : unpaidBills.length === 0 ? <div className="text-xs text-emerald-600 font-semibold py-2">Semua tagihan santri ini sudah lunas!</div>
                : (
                  <select className="input-field bg-blue-50 border-blue-200" value={selectedBillId} onChange={(e) => handleSelectBill(e.target.value)}>
                    <option value="">-- Pilih Tagihan --</option>
                    {unpaidBills.map(b => <option key={b.id} value={b.id}>{b.jenis?.nama || 'Tagihan'} - {b.bulan}/{b.tahun} ({formatRp(b.nominal)})</option>)}
                    <option value="manual">+ Input Manual (Tagihan Baru)</option>
                  </select>
                )}
              </div>
            )}

            {(selectedBillId || !formData.santri_id) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group"><label className="form-label">Jenis</label><select name="jenis_pembayaran_id" className="input-field" value={formData.jenis_pembayaran_id} onChange={handleInputChange} required disabled={!!selectedBillId && selectedBillId !== 'manual'}><option value="">Pilih</option>{jenisList.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Nominal (Rp)</label><input type="number" name="nominal" className="input-field" value={formData.nominal} onChange={handleInputChange} required disabled={!!selectedBillId && selectedBillId !== 'manual'} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group"><label className="form-label">Tanggal</label><input type="date" name="tanggal_bayar" className="input-field" value={formData.tanggal_bayar} onChange={handleInputChange} /></div>
                  <div className="form-group"><label className="form-label">Metode</label><select name="metode_bayar" className="input-field" value={formData.metode_bayar} onChange={handleInputChange}><option value="tunai">Tunai</option><option value="transfer">Transfer</option><option value="tabungan">Potong Tabungan</option></select></div>
                </div>
              </>
            )}
          </div></div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving || (!formData.santri_id)}><Save size={18} /> {selectedBillId && selectedBillId !== 'manual' ? 'Konfirmasi Bayar' : 'Simpan Pembayaran'}</button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'generate' && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '500px' }}>
          <div className="modal-header"><h2 className="modal-title">Generate Tagihan Masal</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={handleSubmitBilling}><div className="modal-body"><div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex gap-3"><AlertCircle className="text-orange-600 shrink-0" size={20} /><p className="text-sm text-orange-800">Ini akan membuat tagihan untuk seluruh santri aktif.</p></div>
            <div className="form-group"><label className="form-label">Jenis Tagihan</label><select name="jenis_pembayaran_id" className="input-field" value={billingData.jenis_pembayaran_id} onChange={handleBillingChange} required><option value="">-- Pilih Jenis Tagihan --</option>{jenisList.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Bulan</label><input type="number" name="bulan" min="1" max="12" className="input-field" value={billingData.bulan} onChange={handleBillingChange} /></div>
              <div className="form-group"><label className="form-label">Tahun</label><input type="number" name="tahun" className="input-field" value={billingData.tahun} onChange={handleBillingChange} /></div>
            </div>
            <div className="form-group"><label className="form-label">Target Santri</label><select name="kelas_id" className="input-field" value={billingData.kelas_id} onChange={handleBillingChange}><option value="">Semua Santri Aktif</option>{kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Nominal (Rp)</label><input type="number" name="nominal" className="input-field" value={billingData.nominal} onChange={handleBillingChange} required /></div>
          </div></div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}><Receipt size={18} /> Generate</button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'kelola_jenis' && (
        <div className="modal-overlay no-print"><div className="modal-container" style={{ maxWidth: '700px' }}>
          <div className="modal-header"><h2 className="modal-title">Kelola Jenis Pembayaran</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">{selectedJenis ? 'Edit Jenis' : 'Tambah Jenis Baru'}</h3>
                <form onSubmit={handleJenisSubmit} className="space-y-3">
                  <div className="form-group"><label className="form-label text-xs">Nama Jenis</label><input type="text" className="input-field" value={jenisForm.nama} onChange={(e) => setJenisForm({...jenisForm, nama: e.target.value})} placeholder="Contoh: Syahriah" required /></div>
                  <div className="form-group"><label className="form-label text-xs">Kategori</label><select className="input-field" value={jenisForm.kategori} onChange={(e) => setJenisForm({...jenisForm, kategori: e.target.value})}><option value="bulanan">Bulanan</option><option value="insidental">Insidental</option><option value="kegiatan">Kegiatan</option></select></div>
                  <div className="form-group"><label className="form-label text-xs">Nominal Default (Rp)</label><input type="number" className="input-field" value={jenisForm.nominal_default} onChange={(e) => setJenisForm({...jenisForm, nominal_default: e.target.value})} placeholder="50000" /></div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="btn-primary flex-1" disabled={saving}><Save size={16} /> {selectedJenis ? 'Update' : 'Simpan'}</button>
                    {selectedJenis && <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={() => { setSelectedJenis(null); setJenisForm({ nama: '', kategori: 'bulanan', nominal_default: '' }); }}>Batal</button>}
                  </div>
                </form>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Daftar Jenis</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {jenisList.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada data</p>
                  : jenisList.map(j => (
                    <div key={j.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                      <div>
                        <div className="font-medium text-sm">{j.nama}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontSize: '10px' }}>{j.kategori} • {formatRp(j.nominal_default)}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Edit" onClick={() => { setSelectedJenis(j); setJenisForm({ nama: j.nama, kategori: j.kategori, nominal_default: j.nominal_default || '' }); }}><Settings size={14} /></button>
                        <button className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Hapus" onClick={() => handleDeleteJenis(j.id)}><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Tutup</button></div>
        </div></div>
      )}

      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          .no-print, .sidebar, .navbar, .modal-overlay, .page-header, .stat-card, .btn-primary { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; margin: 0; padding: 0; }
          .flex-col { gap: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default PembayaranPage;
