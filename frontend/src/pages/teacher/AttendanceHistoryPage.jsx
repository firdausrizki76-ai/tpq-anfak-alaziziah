import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Search, Filter, Loader2, User, CheckCircle, AlertCircle, Clock, ChevronRight, UserCheck, Users } from 'lucide-react';
import { absensiAPI, kelasAPI } from '../../services/api';

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const AttendanceHistoryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('guru'); // 'guru' | 'santri'
  const [loading, setLoading] = useState(true);
  const [loadingMyAttendance, setLoadingMyAttendance] = useState(true);
  
  // Santri class attendance state
  const [absensi, setAbsensi] = useState([]);
  const [managedClassesText, setManagedClassesText] = useState('-');
  const [filter, setFilter] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    search: ''
  });

  // Teacher personal attendance state
  const [myAttendanceList, setMyAttendanceList] = useState([]);
  const [myFilterBulan, setMyFilterBulan] = useState('all');
  const [myFilterTahun, setMyFilterTahun] = useState(String(new Date().getFullYear()));

  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');

  useEffect(() => {
    loadClassAttendance();
  }, [filter.tanggal]);

  useEffect(() => {
    loadMyAttendance();
  }, [user.id]);

  const loadMyAttendance = async () => {
    setLoadingMyAttendance(true);
    try {
      const data = await absensiAPI.getAll({ role: 'guru', guru_id: user.id });
      setMyAttendanceList(data || []);
    } catch (e) {
      console.error('Error loading my teacher attendance:', e);
    }
    setLoadingMyAttendance(false);
  };

  const loadClassAttendance = async () => {
    setLoading(true);
    try {
      const kelasList = await kelasAPI.getAll();
      const myClasses = (kelasList || []).filter(k => k.wali_kelas_id === user.id || k.wali_kelas?.id === user.id);
      const myClassIds = myClasses.map(c => c.id);
      setManagedClassesText(myClasses.map(c => c.nama_kelas).join(', ') || '-');

      const params = {
        tanggal: filter.tanggal
      };
      
      const data = await absensiAPI.getAll(params);
      const filteredByClass = (data || []).filter(a => myClassIds.includes(a.santri?.kelas_id));
      setAbsensi(filteredByClass);
    } catch (e) {
      console.error('Error loading class attendance:', e);
    }
    setLoading(false);
  };

  // Filtered personal teacher attendance
  const filteredMyAttendance = useMemo(() => {
    return myAttendanceList.filter(item => {
      if (!item.tanggal) return false;
      const d = new Date(item.tanggal + 'T00:00:00');
      const matchYear = String(d.getFullYear()) === myFilterTahun;
      const matchMonth = myFilterBulan === 'all' || d.getMonth() === parseInt(myFilterBulan);
      return matchYear && matchMonth;
    }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [myAttendanceList, myFilterBulan, myFilterTahun]);

  const myStats = useMemo(() => {
    const list = filteredMyAttendance;
    const hadir = list.filter(a => a.status === 'hadir').length;
    const izin = list.filter(a => a.status === 'izin').length;
    const sakit = list.filter(a => a.status === 'sakit').length;
    const alfa = list.filter(a => a.status === 'alfa').length;
    const total = list.length;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { hadir, izin, sakit, alfa, total, persentase };
  }, [filteredMyAttendance]);

  // Filtered class student attendance
  const filteredClassAbsensi = absensi.filter(a => 
    a.santri?.nama_lengkap?.toLowerCase().includes(filter.search.toLowerCase()) ||
    a.santri?.nomor_induk?.toLowerCase().includes(filter.search.toLowerCase())
  );

  const classStats = {
    hadir: filteredClassAbsensi.filter(a => a.status === 'hadir').length,
    sakit: filteredClassAbsensi.filter(a => a.status === 'sakit').length,
    izin: filteredClassAbsensi.filter(a => a.status === 'izin').length,
    alfa: filteredClassAbsensi.filter(a => a.status === 'alfa').length,
    total: filteredClassAbsensi.length
  };

  const formatWaktu = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
    } catch {
      return '-';
    }
  };

  const formatTanggalIndo = (tanggalStr) => {
    if (!tanggalStr) return '-';
    try {
      const date = new Date(tanggalStr + 'T00:00:00');
      return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return tanggalStr;
    }
  };

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
      {/* Header Section */}
      <div style={{ backgroundColor: 'white', margin: '-16px -16px 0 -16px', padding: '32px 24px 20px 24px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 2px 15px rgba(0,0,0,0.03)', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#475569', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0, fontFamily: 'var(--font-family-display, serif)' }}>
              Riwayat Presensi
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', margin: '4px 0 0 0' }}>
              {user.nama_lengkap} {managedClassesText !== '-' ? `• Wali: ${managedClassesText}` : ''}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '4px', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('guru')}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              backgroundColor: activeTab === 'guru' ? '#ffffff' : 'transparent',
              color: activeTab === 'guru' ? '#064e3b' : '#64748b',
              boxShadow: activeTab === 'guru' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <UserCheck size={16} /> Absensi Saya (Guru)
          </button>
          <button
            onClick={() => setActiveTab('santri')}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              backgroundColor: activeTab === 'santri' ? '#ffffff' : 'transparent',
              color: activeTab === 'santri' ? '#064e3b' : '#64748b',
              boxShadow: activeTab === 'santri' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Users size={16} /> Absensi Kelas Santri
          </button>
        </div>
      </div>

      {/* ================= TAB 1: ABSENSI SAYA (GURU) ================= */}
      {activeTab === 'guru' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filter Bulan & Tahun */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              value={myFilterBulan} 
              onChange={(e) => setMyFilterBulan(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '600', color: '#334155', backgroundColor: '#ffffff', outline: 'none' }}
            >
              <option value="all">Semua Bulan</option>
              {BULAN_NAMES.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={myFilterTahun} 
              onChange={(e) => setMyFilterTahun(e.target.value)}
              style={{ width: '100px', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '600', color: '#334155', backgroundColor: '#ffffff', outline: 'none' }}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'Hadir', val: myStats.hadir, hex: '#10b981', bg: '#f0fdf4' },
              { label: 'Izin', val: myStats.izin, hex: '#f59e0b', bg: '#fef3c7' },
              { label: 'Sakit', val: myStats.sakit, hex: '#3b82f6', bg: '#eff6ff' },
              { label: 'Alfa', val: myStats.alfa, hex: '#ef4444', bg: '#fef2f2' }
            ].map((item, idx) => (
              <div key={idx} style={{ backgroundColor: item.bg, borderRadius: '16px', padding: '12px 8px', textAlign: 'center', border: `1px solid ${item.hex}30` }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: item.hex }}>{item.val}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: item.hex, marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* List Kehadiran Guru */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0' }}>
              Catatan Presensi Guru ({filteredMyAttendance.length})
            </h3>

            {loadingMyAttendance ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 8px', color: '#064e3b' }} />
                <p style={{ fontSize: '12px' }}>Memuat data presensi guru...</p>
              </div>
            ) : filteredMyAttendance.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                <Clock size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', margin: 0 }}>
                  Belum ada catatan presensi pada periode ini.
                </p>
              </div>
            ) : (
              filteredMyAttendance.map(item => {
                const isHadir = item.status === 'hadir';
                const isIzin = item.status === 'izin';
                const isSakit = item.status === 'sakit';
                const isAlfa = item.status === 'alfa';
                const badgeBg = isHadir ? '#dcfce7' : isIzin ? '#fef3c7' : isSakit ? '#dbeafe' : '#fee2e2';
                const badgeColor = isHadir ? '#15803d' : isIzin ? '#b45309' : isSakit ? '#1d4ed8' : '#b91c1c';

                return (
                  <div 
                    key={item.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                        {formatTanggalIndo(item.tanggal)}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: badgeBg,
                        color: badgeColor
                      }}>
                        {item.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} style={{ color: '#10b981' }} />
                        <span>Datang: <strong>{formatWaktu(item.waktu_datang || item.waktu_scan)}</strong></span>
                      </div>
                      {item.waktu_pulang && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} style={{ color: '#f59e0b' }} />
                          <span>Pulang: <strong>{formatWaktu(item.waktu_pulang)}</strong></span>
                        </div>
                      )}
                    </div>

                    {item.keterangan && (
                      <div style={{ fontSize: '11px', color: '#475569', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '8px', borderLeft: '3px solid #cbd5e1' }}>
                        Catatan: {item.keterangan}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ABSENSI SANTRI KELAS ================= */}
      {activeTab === 'santri' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'Hadir', val: classStats.hadir, hex: '#10b981' },
              { label: 'Sakit', val: classStats.sakit, hex: '#3b82f6' },
              { label: 'Izin', val: classStats.izin, hex: '#f59e0b' },
              { label: 'Alfa', val: classStats.alfa, hex: '#ef4444' }
            ].map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px', color: item.hex }}>{item.label}</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginTop: '4px' }}>{item.val}</span>
                <div style={{ width: '16px', height: '4px', borderRadius: '4px', marginTop: '4px', backgroundColor: item.hex, opacity: 0.3 }}></div>
              </div>
            ))}
          </div>

          {/* Filter Section */}
          <div>
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
            ) : filteredClassAbsensi.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '48px', textAlign: 'center', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', marginBottom: '16px' }}>
                  <Clock size={40} />
                </div>
                <p style={{ color: '#475569', fontWeight: 'bold', margin: 0 }}>Tidak Ada Data</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', margin: 0, maxWidth: '200px', lineHeight: 1.5 }}>Belum ada absensi santri yang tercatat untuk tanggal ini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', padding: '0 8px', margin: '0 0 4px 0' }}>
                  Ditemukan {filteredClassAbsensi.length} Santri
                </p>
                {filteredClassAbsensi.map((a) => (
                  <div key={a.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', backgroundColor: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#064e3b', fontWeight: '900', fontSize: '18px', border: '1px solid white' }}>
                      {a.santri?.nama_lengkap?.charAt(0) || <User size={20} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{a.santri?.nama_lengkap}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{a.santri?.nomor_induk}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>•</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{new Date(a.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB</span>
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
        </div>
      )}
    </div>
  );
};

export default AttendanceHistoryPage;
