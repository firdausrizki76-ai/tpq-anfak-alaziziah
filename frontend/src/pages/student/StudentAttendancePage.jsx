import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Clock, AlertCircle, FileText, Loader2, Filter } from 'lucide-react';
import { absensiAPI } from '../../services/api';

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const StudentAttendancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceList, setAttendanceList] = useState([]);
  const [filterBulan, setFilterBulan] = useState('all');
  const [filterTahun, setFilterTahun] = useState(String(new Date().getFullYear()));

  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');

  useEffect(() => {
    loadStudentAttendance();
  }, [user.id]);

  const loadStudentAttendance = async () => {
    setLoading(true);
    try {
      // Ambil data absensi untuk santri yang sedang login
      const data = await absensiAPI.getAll({ role: 'santri', santri_id: user.id });
      setAttendanceList(data || []);
    } catch (e) {
      console.error('Error loading student attendance:', e);
    }
    setLoading(false);
  };

  const filteredAttendance = useMemo(() => {
    return attendanceList.filter(item => {
      if (!item.tanggal) return false;
      const d = new Date(item.tanggal + 'T00:00:00');
      const matchYear = String(d.getFullYear()) === filterTahun;
      const matchMonth = filterBulan === 'all' || d.getMonth() === parseInt(filterBulan);
      return matchYear && matchMonth;
    }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [attendanceList, filterBulan, filterTahun]);

  const stats = useMemo(() => {
    const list = filteredAttendance;
    const hadir = list.filter(a => a.status === 'hadir').length;
    const izin = list.filter(a => a.status === 'izin').length;
    const sakit = list.filter(a => a.status === 'sakit').length;
    const alfa = list.filter(a => a.status === 'alfa').length;
    const total = list.length;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { hadir, izin, sakit, alfa, total, persentase };
  }, [filteredAttendance]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '96px', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', margin: '-16px -16px 0 -16px', padding: '24px 20px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '10px', color: '#475569', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#064e3b', margin: 0, fontFamily: 'var(--font-family-display, serif)' }}>
              Riwayat Absensi Santri
            </h1>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              {user.nama_lengkap || 'Santri TPQ Anfak Al Azizah'}
            </p>
          </div>
        </div>

        {/* Filter Bulan & Tahun */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={filterBulan} 
            onChange={(e) => setFilterBulan(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600', color: '#334155', backgroundColor: '#f8fafc', outline: 'none' }}
          >
            <option value="all">Semua Bulan</option>
            {BULAN_NAMES.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select 
            value={filterTahun} 
            onChange={(e) => setFilterTahun(e.target.value)}
            style={{ width: '100px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600', color: '#334155', backgroundColor: '#f8fafc', outline: 'none' }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <div style={{ backgroundColor: '#f0fdf4', borderRadius: '14px', padding: '12px 8px', textAlign: 'center', border: '1px solid #dcfce7' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a' }}>{stats.hadir}</div>
          <div style={{ fontSize: '10px', color: '#15803d', fontWeight: '600' }}>Hadir</div>
        </div>
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '14px', padding: '12px 8px', textAlign: 'center', border: '1px solid #dbeafe' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>{stats.izin}</div>
          <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: '600' }}>Izin</div>
        </div>
        <div style={{ backgroundColor: '#fefce8', borderRadius: '14px', padding: '12px 8px', textAlign: 'center', border: '1px solid #fef08a' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#ca8a04' }}>{stats.sakit}</div>
          <div style={{ fontSize: '10px', color: '#a16207', fontWeight: '600' }}>Sakit</div>
        </div>
        <div style={{ backgroundColor: '#fef2f2', borderRadius: '14px', padding: '12px 8px', textAlign: 'center', border: '1px solid #fee2e2' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>{stats.alfa}</div>
          <div style={{ fontSize: '10px', color: '#b91c1c', fontWeight: '600' }}>Alpa</div>
        </div>
      </div>

      {/* Persentase Kehadiran Bar */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '14px 16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Tingkat Kehadiran:</span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#064e3b' }}>{stats.persentase}%</span>
        </div>
        <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              backgroundColor: stats.persentase >= 80 ? '#10b981' : stats.persentase >= 60 ? '#f59e0b' : '#ef4444', 
              width: `${stats.persentase}%`,
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} 
          />
        </div>
      </div>

      {/* List Presensi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0' }}>
          Histori Absensi ({filteredAttendance.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '12px' }}>Memuat riwayat absensi...</p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '36px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
            <Calendar size={32} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', margin: 0 }}>
              Belum ada catatan absensi pada periode ini.
            </p>
          </div>
        ) : (
          filteredAttendance.map(item => {
            const isHadir = item.status === 'hadir';
            const isIzin = item.status === 'izin';
            const isSakit = item.status === 'sakit';
            const isAlfa = item.status === 'alfa';

            const badgeBg = isHadir ? '#dcfce7' : isIzin ? '#dbeafe' : isSakit ? '#fef9c3' : '#fee2e2';
            const badgeColor = isHadir ? '#15803d' : isIzin ? '#1d4ed8' : isSakit ? '#a16207' : '#b91c1c';

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

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} style={{ color: '#10b981' }} />
                    <span>Masuk: <strong>{formatWaktu(item.waktu_datang || item.waktu_scan)}</strong></span>
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
  );
};

export default StudentAttendancePage;
