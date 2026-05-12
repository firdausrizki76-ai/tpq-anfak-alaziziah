import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { pembayaranAPI } from '../../services/api';

const StudentTagihanPage = () => {
  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('tpq_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user && user.id) {
        const data = await pembayaranAPI.getAll({ santri_id: user.id }).catch(() => []);
        setTagihan(data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  const belumLunas = tagihan.filter(t => t.status === 'belum');
  const lunas = tagihan.filter(t => t.status === 'lunas');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', paddingBottom: '96px', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>Tagihan Saya</h2>

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
                <CheckCircle size={16} /> Sudah Lunas ({lunas.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lunas.map(t => (
                  <div key={t.id} style={{ backgroundColor: 'white', borderRadius: '24px', padding: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', color: '#475569', margin: '0 0 4px 0', fontSize: '15px' }}>{t.jenis?.nama || 'Tagihan'}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 2px 0', fontWeight: '600' }}>Periode: {t.bulan}/{t.tahun}</p>
                        {t.tanggal_bayar && <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Dibayar: {new Date(t.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '900', color: '#475569', fontSize: '16px', margin: '0 0 4px 0' }}>{formatRp(t.nominal)}</p>
                        <span style={{ fontSize: '10px', padding: '4px 10px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          LUNAS
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
    </div>
  );
};

export default StudentTagihanPage;
