import React, { useState, useEffect } from 'react';
import { Users, Phone, Loader2, ArrowLeft, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { kelasAPI, santriAPI, tabunganAPI } from '../../services/api';

const ClassListPage = () => {
  const navigate = useNavigate();
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guru, setGuru] = useState(null);
  const [kelasNames, setKelasNames] = useState('-');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('tpq_user'));
    setGuru(userData);
    if (userData) {
      loadSantri(userData);
    } else {
      setLoading(false);
    }
  }, []);

  const loadSantri = async (userData) => {
    setLoading(true);
    try {
      // Fetch kelas list and find all classes where wali_kelas_id = guru.id
      const kelasList = await kelasAPI.getAll();
      const myClasses = (kelasList || []).filter(k => k.wali_kelas_id === userData.id || k.wali_kelas?.id === userData.id);
      
      setKelasNames(myClasses.map(c => c.nama_kelas).join(', ') || '-');

      if (myClasses.length > 0) {
        // Fetch students for all classes
        const studentsPromises = myClasses.map(k => kelasAPI.getSantri(k.id));
        const studentsResults = await Promise.all(studentsPromises);
        
        const allStudents = [];
        studentsResults.forEach((students, index) => {
          const className = myClasses[index].nama_kelas;
          (students || []).forEach(s => {
            allStudents.push({
              ...s,
              nama_kelas_custom: className
            });
          });
        });

        // Fetch tabungan
        const tabunganData = await tabunganAPI.getAll({ guru_id: userData.id }).catch(() => []);
        const saldoMap = {};
        (tabunganData || []).forEach(s => { saldoMap[s.id] = s.saldo || 0; });

        const enriched = allStudents.map(s => ({
          ...s,
          saldo: saldoMap[s.id] || 0
        }));
        
        setSantriList(enriched);
      }
    } catch (e) {
      console.error('Error loading class santri:', e);
    }
    setLoading(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  // Resolve kelas name from guru data
  const kelasName = kelasNames;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '96px', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', margin: '-16px -16px 0 -16px', padding: '40px 24px 24px 24px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 2px 15px rgba(0,0,0,0.03)', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#475569', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Daftar Santri</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', margin: '4px 0 0 0' }}>
              Kelas: {kelasName} • {santriList.length} santri
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={40} color="#059669" className="animate-spin" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Memuat data...</p>
        </div>
      ) : santriList.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '48px', textAlign: 'center', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', marginBottom: '16px' }}>
            <Users size={40} />
          </div>
          <p style={{ color: '#475569', fontWeight: 'bold', margin: 0 }}>Tidak Ada Data</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', margin: 0 }}>Belum ada santri terdaftar di kelas ini.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          {santriList.map((santri) => (
            <div key={santri.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#064e3b', fontWeight: '900', fontSize: '18px', border: '1px solid white', flexShrink: 0 }}>
                {santri.nama_lengkap.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{santri.nama_lengkap}</h3>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: '600' }}>{santri.nomor_induk}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                   <span style={{ 
                     fontSize: '10px', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px',
                     backgroundColor: santri.status === 'aktif' ? '#dcfce7' : '#f1f5f9',
                     color: santri.status === 'aktif' ? '#15803d' : '#64748b'
                   }}>
                    {(santri.status || 'aktif')}
                  </span>
                  {santri.nama_kelas_custom && (
                    <span style={{ 
                      fontSize: '10px', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb'
                    }}>
                     {santri.nama_kelas_custom}
                    </span>
                  )}
                  {santri.saldo > 0 && (
                    <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wallet size={12} /> {formatRp(santri.saldo)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <a href={`tel:${santri.no_hp_wali}`} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '12px', transition: 'all 0.2s', textDecoration: 'none' }}>
                  <Phone size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Panel */}
      <div style={{ marginTop: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #fef3c7', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', backgroundColor: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
          <Users size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '10px', fontWeight: '900', color: '#d97706', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0' }}>Catatan Wali Kelas</h4>
          <p style={{ fontSize: '11px', color: '#92400e', lineHeight: 1.5, fontWeight: '500', margin: 0 }}>
            Pantau status santri di kelas Anda. Klik ikon telepon biru untuk menghubungi wali santri secara langsung.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClassListPage;
