import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle, AlertCircle, Loader2, Wallet, ArrowUpCircle, X, Save } from 'lucide-react';
import { pembayaranAPI, jenisPembayaranAPI } from '../../services/api';

const StudentTagihanPage = () => {
  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wajibBalance, setWajibBalance] = useState(0);
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({ nominal: '', catatan: '' });
  const [saving, setSaving] = useState(false);
  const [jenisList, setJenisList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('tpq_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user && user.id) {
        const [data, jt] = await Promise.all([
          pembayaranAPI.getAll({ santri_id: user.id }).catch(() => []),
          jenisPembayaranAPI.getAll().catch(() => [])
        ]);
        setTagihan(data || []);
        setJenisList(jt || []);
        
        // Calculate Tabungan Wajib balance: sum of all paid bills of type Tabungan Wajib minus withdrawals
        const balance = (data || [])
          .filter(t => t.status === 'lunas' && (t.jenis?.nama || t.jenis_pembayaran?.nama || '').toLowerCase().includes('tabungan wajib'))
          .reduce((sum, t) => sum + t.nominal, 0);
        setWajibBalance(balance);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const userStr = localStorage.getItem('tpq_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || !user.id) return;
    
    if (parseInt(formData.nominal) > wajibBalance) {
      alert('Saldo tidak mencukupi!');
      return;
    }

    const wajibType = jenisList.find(j => j.nama.toLowerCase().includes('tabungan wajib'));
    if (!wajibType) {
      alert('Jenis tagihan "Tabungan Wajib" tidak ditemukan! Silakan hubungi admin.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        santri_id: user.id,
        jenis_pembayaran_id: wajibType.id,
        nominal: -parseInt(formData.nominal), // negative nominal for withdrawal
        status: 'lunas',
        tanggal_bayar: new Date().toISOString().split('T')[0],
        catatan: formData.catatan || 'Penarikan Tabungan Wajib Mandiri',
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear(),
        tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
      };
      await pembayaranAPI.create(payload);
      alert('Penarikan Tabungan Wajib berhasil dilakukan!');
      setFormData({ nominal: '', catatan: '' });
      setActiveModal(null);
      await loadData();
    } catch (error) {
      alert(error.message || 'Terjadi kesalahan');
    }
    setSaving(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  const belumLunas = tagihan.filter(t => t.status === 'belum');
  const lunas = tagihan.filter(t => t.status === 'lunas');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', paddingBottom: '96px', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>Tagihan Saya</h2>

      {/* Saldo Tabungan Wajib Card */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', 
          borderRadius: '24px', 
          padding: '24px', 
          color: 'white', 
          boxShadow: '0 10px 25px rgba(79, 70, 229, 0.25)', 
          position: 'relative', 
          overflow: 'hidden',
          marginBottom: '8px'
        }}
      >
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15, transform: 'rotate(-15deg)' }}>
          <Wallet size={120} />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ color: '#c7d2fe', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Saldo Tabungan Wajib</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ fontSize: '32px', fontWeight: '900', margin: '0', letterSpacing: '-0.5px' }}>{formatRp(wajibBalance)}</h3>
            <button 
              onClick={() => setActiveModal('tarik')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(4px)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
            >
              <ArrowUpCircle size={16} /> Tarik Saldo
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 size={32} color="#059669" className="animate-spin" />
        </div>
      ) : (
        <>
          {/* Belum Lunas */}
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> Belum Lunas ({belumLunas.length})
            </h3>
            {belumLunas.length === 0 ? (
              <div style={{ backgroundColor: '#f0fdf4', borderRadius: '24px', padding: '24px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                <CheckCircle size={32} color="#16a34a" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '14px', color: '#15803d', fontWeight: 'bold', margin: 0 }}>Semua tagihan sudah lunas!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {belumLunas.map(t => (
                  <div key={t.id} style={{ backgroundColor: 'white', borderRadius: '24px', padding: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '4px solid #f97316', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0', fontSize: '15px' }}>{t.jenis?.nama || 'Tagihan'}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: '600' }}>Periode: {t.bulan}/{t.tahun}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '900', color: '#ea580c', fontSize: '16px', margin: '0 0 4px 0' }}>{formatRp(t.nominal)}</p>
                        <span style={{ fontSize: '10px', padding: '4px 10px', backgroundColor: '#ffedd5', color: '#9a3412', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          BELUM LUNAS
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sudah Lunas */}
          {lunas.length > 0 && (
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} /> Riwayat Transaksi & Pelunasan ({lunas.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lunas.map(t => (
                  <div key={t.id} style={{ backgroundColor: 'white', borderRadius: '24px', padding: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', color: '#475569', margin: '0 0 4px 0', fontSize: '15px' }}>{t.jenis?.nama || 'Tagihan'}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 2px 0', fontWeight: '600' }}>Periode: {t.bulan}/{t.tahun}</p>
                        {t.tanggal_bayar && <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 2px 0' }}>Tanggal: {new Date(t.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                        {t.catatan && <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>Catatan: {t.catatan}</p>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '900', color: t.nominal < 0 ? '#ef4444' : '#16a34a', fontSize: '16px', margin: '0 0 4px 0' }}>{t.nominal < 0 ? '' : '+'}{formatRp(t.nominal)}</p>
                        <span style={{ fontSize: '10px', padding: '4px 10px', backgroundColor: t.nominal < 0 ? '#fef2f2' : '#dcfce7', color: t.nominal < 0 ? '#b91c1c' : '#15803d', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {t.nominal < 0 ? 'PENARIKAN' : 'LUNAS'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Tarik Saldo Wajib */}
      {activeModal === 'tarik' && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000, 
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
        >
          <div 
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '24px', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              width: '100%', 
              maxWidth: '450px', 
              overflow: 'hidden',
              fontFamily: 'sans-serif'
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpCircle size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Tarik Tabungan Wajib</h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Saldo Tabungan Wajib</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#4f46e5' }}>{formatRp(wajibBalance)}</span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Nominal Penarikan (Rp)</label>
                  <input 
                    type="number" 
                    name="nominal" 
                    value={formData.nominal} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Masukkan nominal"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  {parseInt(formData.nominal) > wajibBalance && (
                    <p style={{ color: '#ef4444', fontSize: '11px', fontWeight: '600', margin: '6px 0 0 0' }}>Saldo tidak mencukupi!</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Keperluan / Catatan</label>
                  <textarea 
                    name="catatan" 
                    value={formData.catatan} 
                    onChange={handleInputChange} 
                    placeholder="Keperluan penarikan..."
                    rows="3" 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', resize: 'none' }}
                  ></textarea>
                </div>
              </div>

              <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)} 
                  style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={saving || parseInt(formData.nominal) > wajibBalance} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '10px 20px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: (saving || parseInt(formData.nominal) > wajibBalance) ? '#94a3b8' : '#4f46e5', 
                    color: 'white', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    cursor: (saving || parseInt(formData.nominal) > wajibBalance) ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Konfirmasi Tarik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTagihanPage;
