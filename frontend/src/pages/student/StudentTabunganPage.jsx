import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { tabunganAPI } from '../../services/api';

const StudentTabunganPage = () => {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('tpq_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user && user.id) {
        const data = await tabunganAPI.getRiwayat(user.id).catch(() => []);
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
          <p style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Total Saldo Aktif</p>
          <h3 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>{formatRp(saldo)}</h3>
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
    </div>
  );
};

export default StudentTabunganPage;
