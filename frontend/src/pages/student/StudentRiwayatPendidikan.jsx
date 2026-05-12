import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowLeft, Loader2, Award, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ujianAPI } from '../../services/api';

const StudentRiwayatPendidikan = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('tpq_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user && user.id) {
        const data = await ujianAPI.getHistory(user.id);
        setHistory(data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', paddingBottom: '96px', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', margin: '-16px -16px 0 -16px', padding: '40px 24px 24px 24px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 2px 15px rgba(0,0,0,0.03)', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#475569', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Riwayat Pendidikan</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', margin: '4px 0 0 0' }}>Histori Kenaikan Kelas</p>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', marginTop: '8px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={32} color="#059669" className="animate-spin" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Memuat data...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', margin: '0 auto 16px auto' }}>
              <BookOpen size={32} />
            </div>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#64748b' }}>Belum Ada Riwayat</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>Data riwayat kelas santri belum tersedia di sistem.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', left: '20px', top: '24px', bottom: '24px', width: '2px', backgroundColor: '#f1f5f9', zIndex: 0 }}></div>
            
            {history.map((item, idx) => {
              const hasNaik = !!item.kelas_ke;
              return (
                <div key={item.id || idx} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '40px', height: '40px', 
                    backgroundColor: hasNaik ? '#dcfce7' : '#fef3c7', 
                    borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: hasNaik ? '#16a34a' : '#d97706', 
                    flexShrink: 0, 
                    border: '4px solid white', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                  }}>
                    {hasNaik ? <GraduationCap size={18} /> : <BookOpen size={18} />}
                  </div>
                  
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h4 style={{ fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0', fontSize: '14px' }}>
                          {item.kelas_dari?.nama_kelas || 'Kelas Awal'}
                        </h4>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: '600' }}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                      <span style={{ 
                        fontSize: '10px', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px',
                        backgroundColor: hasNaik ? '#dcfce7' : '#fef3c7',
                        color: hasNaik ? '#16a34a' : '#92400e'
                      }}>
                        {hasNaik ? 'Naik Kelas' : 'Proses'}
                      </span>
                    </div>
                    
                    {hasNaik && (
                      <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                          <Award size={14} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{item.kelas_dari?.nama_kelas}</span>
                          <ArrowRight size={14} color="#94a3b8" />
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>{item.kelas_ke?.nama_kelas}</span>
                        </div>
                      </div>
                    )}

                    {item.tanggal_naik && (
                      <p style={{ fontSize: '10px', color: '#64748b', margin: '8px 0 0 0', fontWeight: '500' }}>
                        Tanggal Naik: {new Date(item.tanggal_naik).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRiwayatPendidikan;
