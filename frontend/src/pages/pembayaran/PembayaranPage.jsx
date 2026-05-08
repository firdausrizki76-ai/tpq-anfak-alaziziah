import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Printer, CheckCircle, AlertCircle, X, Save, Receipt, CreditCard, Calendar, Users, Settings, Loader2 } from 'lucide-react';
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
                  <td className="text-center">{p.status === 'lunas' && <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" onClick={() => handlePrint(p)}><Printer size={18} /></button>}</td>
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
                  <div className="form-group"><label className="form-label">Metode</label><select name="metode_bayar" className="input-field" value={formData.metode_bayar} onChange={handleInputChange}><option value="tunai">Tunai</option><option value="transfer">Transfer</option></select></div>
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
        <div className="modal-overlay no-print">
          {/* ... existing modal code ... */}
        </div>
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
