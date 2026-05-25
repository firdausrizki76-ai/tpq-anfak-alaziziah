import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Loader2, Save, X } from 'lucide-react';
import { tabunganAPI } from '../../services/api';

const StudentTabunganPage = () => {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [user, setUser] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({ nominal: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('tpq_user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      setUser(currentUser);
      
      if (currentUser && currentUser.id) {
        const data = await tabunganAPI.getRiwayat(currentUser.id).catch(() => []);
        setRiwayat(data || []);
        
        // Use saldo_setelah from latest transaction for accuracy
        if (data && data.length > 0) {
          setSaldo(data[0].saldo_setelah || 0);
        }
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
    if (!user || !user.id) return;
    if (parseInt(formData.nominal) > saldo) {
      alert('Saldo tidak mencukupi!');
      return;
    }
    setSaving(true);
    try {
      await tabunganAPI.transact({
        santri_id: user.id,
        jenis: 'tarik',
        nominal: parseInt(formData.nominal),
        tanggal: formData.tanggal,
        keterangan: formData.keterangan || 'Penarikan mandiri oleh siswa',
        recorded_by: user.id
      });
      alert('Penarikan tabungan berhasil!');
      setFormData({ nominal: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0] });
      setActiveModal(null);
      await loadData();
    } catch (error) {
      alert(error.message || 'Terjadi kesalahan');
    }
    setSaving(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', paddingBottom: '96px', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>Tabungan Saya</h2>

      {/* Saldo Tabungan Card */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', 
          borderRadius: '24px', 
          padding: '24px', 
          color: 'white', 
          boxShadow: '0 10px 25px rgba(5, 150, 105, 0.25)', 
          position: 'relative', 
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15, transform: 'rotate(-15deg)' }}>
          <Wallet size={120} />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Total Saldo Wajib & Sukarela</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ fontSize: '32px', fontWeight: '900', margin: '0', letterSpacing: '-0.5px' }}>{formatRp(saldo)}</h3>
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

      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <h3 style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', fontSize: '16px' }}>Riwayat Transaksi</h3>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Loader2 className="animate-spin text-emerald-500" size={32} color="#059669" /></div>
        ) : riwayat.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
            <Wallet size={48} style={{ margin: '0 auto 12px auto', opacity: 0.2 }} />
            <p style={{ margin: 0, fontWeight: '500' }}>Belum ada riwayat transaksi</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
            {riwayat.map((trx, idx) => (
              <div key={trx.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: trx.jenis === 'setor' ? '#dcfce7' : '#ffedd5', color: trx.jenis === 'setor' ? '#16a34a' : '#ea580c' }}>
                    {trx.jenis === 'setor' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>{trx.jenis === 'setor' ? 'Setoran' : 'Penarikan'}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: '500' }}>{new Date(trx.tanggal || trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {trx.keterangan && <p style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', margin: 0, fontStyle: 'italic' }}>{trx.keterangan}</p>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '900', fontSize: '14px', color: trx.jenis === 'setor' ? '#16a34a' : '#ea580c', marginBottom: '2px' }}>
                    {trx.jenis === 'setor' ? '+' : '-'}{formatRp(trx.nominal)}
                  </div>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, fontWeight: '600' }}>Saldo: {formatRp(trx.saldo_setelah)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tarik Saldo */}
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
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpCircle size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Tarik Saldo Tabungan</h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Saldo Tersedia</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#047857' }}>{formatRp(saldo)}</span>
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
                  {parseInt(formData.nominal) > saldo && (
                    <p style={{ color: '#ef4444', fontSize: '11px', fontWeight: '600', margin: '6px 0 0 0' }}>Saldo tidak mencukupi!</p>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Tanggal</label>
                  <input 
                    type="date" 
                    name="tanggal" 
                    value={formData.tanggal} 
                    onChange={handleInputChange} 
                    required 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Keterangan / Keperluan</label>
                  <textarea 
                    name="keterangan" 
                    value={formData.keterangan} 
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
                  disabled={saving || parseInt(formData.nominal) > saldo} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '10px 20px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: (saving || parseInt(formData.nominal) > saldo) ? '#94a3b8' : '#ea580c', 
                    color: 'white', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    cursor: (saving || parseInt(formData.nominal) > saldo) ? 'not-allowed' : 'pointer' 
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

export default StudentTabunganPage;
