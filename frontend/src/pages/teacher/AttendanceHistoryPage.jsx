import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Search, Filter, Loader2, User, CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { absensiAPI, kelasAPI } from '../../services/api';

const AttendanceHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [absensi, setAbsensi] = useState([]);
  const [managedClassesText, setManagedClassesText] = useState('-');
  const [filter, setFilter] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    search: ''
  });

  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');

  useEffect(() => {
    loadAttendance();
  }, [filter.tanggal]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      // 1. Fetch managed classes
      const kelasList = await kelasAPI.getAll();
      const myClasses = (kelasList || []).filter(k => k.wali_kelas_id === user.id || k.wali_kelas?.id === user.id);
      const myClassIds = myClasses.map(c => c.id);
      setManagedClassesText(myClasses.map(c => c.nama_kelas).join(', ') || '-');

      const params = {
        tanggal: filter.tanggal
      };
      
      const data = await absensiAPI.getAll(params);
      
      // 2. Filter to only show attendance from classes managed by this teacher
      const filteredByClass = (data || []).filter(a => myClassIds.includes(a.santri?.kelas_id));
      setAbsensi(filteredByClass);
    } catch (e) {
      console.error('Error loading attendance:', e);
    }
    setLoading(false);
  };

  const filteredAbsensi = absensi.filter(a => 
    a.santri?.nama_lengkap?.toLowerCase().includes(filter.search.toLowerCase()) ||
    a.santri?.nomor_induk?.toLowerCase().includes(filter.search.toLowerCase())
  );

  const stats = {
    hadir: filteredAbsensi.filter(a => a.status === 'hadir').length,
    sakit: filteredAbsensi.filter(a => a.status === 'sakit').length,
    izin: filteredAbsensi.filter(a => a.status === 'izin').length,
    alfa: filteredAbsensi.filter(a => a.status === 'alfa').length,
    total: filteredAbsensi.length
  };

  // Helper for inline styles to ensure it looks good even if Tailwind fails
  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    border: '1px solid #f1f5f9',
    borderRadius: '16px',
    padding: '4px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '12px',
    width: '100%'
  };

  const iconStyle = {
    color: '#94a3b8',
    marginRight: '12px',
    flexShrink: 0
  };

  const inputInnerStyle = {
    border: 'none',
    outline: 'none',
    padding: '12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    backgroundColor: 'transparent',
    width: '100%',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '96px', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      {/* Clean White Header Section */}
      <div style={{ backgroundColor: 'white', margin: '-16px -16px 0 -16px', padding: '40px 24px 24px 24px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 2px 15px rgba(0,0,0,0.03)', borderBottom: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 10 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#475569', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Riwayat Absensi</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', margin: '4px 0 0 0' }}>
              {managedClassesText} • {new Date(filter.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '-12px', position: 'relative', zIndex: 20, padding: '0 8px' }}>
        {[
          { label: 'Hadir', val: stats.hadir, hex: '#10b981' },
          { label: 'Sakit', val: stats.sakit, hex: '#3b82f6' },
          { label: 'Izin', val: stats.izin, hex: '#f59e0b' },
          { label: 'Alfa', val: stats.alfa, hex: '#ef4444' }
        ].map((item, idx) => (
          <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px', color: item.hex }}>{item.label}</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginTop: '4px' }}>{item.val}</span>
            <div style={{ width: '16px', height: '4px', borderRadius: '4px', marginTop: '4px', backgroundColor: item.hex, opacity: 0.3 }}></div>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      <div style={{ marginTop: '16px', padding: '0 4px' }}>
        <div style={inputContainerStyle}>
          <Calendar size={18} style={iconStyle} />
          <input 
            type="date" 
            style={inputInnerStyle}
            value={filter.tanggal}
            onChange={(e) => setFilter({...filter, tanggal: e.target.value})}
          />
        </div>

        <div style={inputContainerStyle}>
          <Search size={18} style={iconStyle} />
          <input 
            type="text" 
            placeholder="Cari nama atau NIS santri..."
            style={inputInnerStyle}
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
          />
        </div>
      </div>

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={40} color="#059669" className="loading-spinner" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Sinkronisasi...</p>
          </div>
        ) : filteredAbsensi.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '48px', textAlign: 'center', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', marginBottom: '16px' }}>
              <Clock size={40} />
            </div>
            <p style={{ color: '#475569', fontWeight: 'bold', margin: 0 }}>Tidak Ada Data</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', margin: 0, maxWidth: '200px', lineHeight: 1.5 }}>Belum ada absensi yang tercatat untuk kriteria ini.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', padding: '0 8px', margin: '0 0 4px 0' }}>
              Ditemukan {filteredAbsensi.length} Santri
            </p>
            {filteredAbsensi.map((a) => (
              <div key={a.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', backgroundColor: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#064e3b', fontWeight: '900', fontSize: '18px', border: '1px solid white' }}>
                  {a.santri?.nama_lengkap?.charAt(0) || <User size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{a.santri?.nama_lengkap}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{a.santri?.nomor_induk}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>•</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{new Date(a.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ 
                    fontSize: '10px', padding: '4px 12px', borderRadius: '20px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px',
                    backgroundColor: a.status === 'hadir' ? '#dcfce7' : a.status === 'sakit' ? '#dbeafe' : a.status === 'izin' ? '#fef3c7' : '#fee2e2',
                    color: a.status === 'hadir' ? '#15803d' : a.status === 'sakit' ? '#1d4ed8' : a.status === 'izin' ? '#b45309' : '#b91c1c'
                  }}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Panel */}
      {!loading && (
        <div style={{ marginTop: '16px', padding: '20px', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #eff6ff', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
            <AlertCircle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0' }}>Informasi</h4>
            <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5, fontWeight: '500', margin: 0 }}>
              Data ini adalah rekapan resmi santri kelas <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{managedClassesText}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistoryPage;
;
