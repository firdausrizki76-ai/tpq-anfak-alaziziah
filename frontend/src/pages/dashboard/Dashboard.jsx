import React, { useState, useEffect } from 'react';
import { Users, UserCheck, AlertCircle, Wallet, TrendingUp, Loader2, GraduationCap, UserX, UserMinus } from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import './Dashboard.css';

const StatCard = ({ title, value, subtext, icon: Icon, trend, loading, extraInfo }) => (
  <div className="card stat-card">
    <div className="stat-card-header flex justify-between items-center mb-4">
      <div className="stat-title">{title}</div>
      <div className="stat-icon-wrapper">
        <Icon size={20} className="stat-icon" />
      </div>
    </div>
    <div className="stat-value">{loading ? <Loader2 size={24} className="animate-spin" /> : value}</div>
    <div className="stat-footer flex items-center gap-2 mt-2">
      {trend && <TrendingUp size={14} className="trend-icon" />}
      <span className="stat-subtext">{subtext}</span>
    </div>
    {extraInfo && !loading && (
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        {extraInfo.map((info, i) => (
          <span key={i} style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '6px',
            backgroundColor: info.bg || '#f1f5f9',
            color: info.color || '#64748b',
            fontWeight: '600'
          }}>
            {info.label}: {info.value}
          </span>
        ))}
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [aktivitas, setAktivitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, aktData] = await Promise.all([
        dashboardAPI.getStats().catch(() => null),
        dashboardAPI.getAktivitas().catch(() => [])
      ]);
      if (statsData) setStats(statsData);
      setAktivitas(aktData || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (n) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

  return (
    <div className="dashboard-page flex-col gap-6">
      <div className="page-header mb-6">
        <h1 className="page-title">Dashboard Utama</h1>
        <p className="page-subtitle">Ringkasan aktivitas dan data TPQ hari ini.</p>
      </div>

      <div className="stats-grid grid-5-cols mb-6">
        <StatCard 
          title="Total Santri" 
          value={stats?.totalSantriAktif ?? stats?.totalSantri ?? '—'} 
          subtext="Santri aktif terdaftar" 
          icon={Users} 
          trend={true}
          loading={loading}
          extraInfo={stats ? [
            { label: 'Keluar', value: stats.totalSantriKeluar || 0, bg: '#fef2f2', color: '#991b1b' },
            { label: 'Khotam', value: stats.totalSantriKhotam || 0, bg: '#f0fdf4', color: '#166534' }
          ] : null}
        />
        <StatCard 
          title="Hadir Hari Ini (Santri)" 
          value={stats ? `${stats.hadirHariIni} / ${stats.totalSantriAktif ?? stats.totalSantri}` : '—'} 
          subtext={stats ? `Tingkat kehadiran ${(stats.totalSantriAktif ?? stats.totalSantri) > 0 ? Math.round((stats.hadirHariIni / (stats.totalSantriAktif ?? stats.totalSantri)) * 100) : 0}%` : '—'} 
          icon={UserCheck}
          loading={loading}
        />
        <StatCard 
          title="Guru" 
          value={stats ? `${stats.hadirGuruHariIni} / ${stats.totalGuruAktif ?? stats.totalGuru}` : '—'} 
          subtext={stats ? `Hadir hari ini ${(stats.totalGuruAktif ?? stats.totalGuru) > 0 ? Math.round((stats.hadirGuruHariIni / (stats.totalGuruAktif ?? stats.totalGuru)) * 100) : 0}%` : '—'} 
          icon={UserCheck}
          loading={loading}
          extraInfo={stats ? [
            { label: 'Aktif', value: stats.totalGuruAktif || 0, bg: '#f0fdf4', color: '#166534' },
            { label: 'Nonaktif', value: stats.totalGuruNonaktif || 0, bg: '#fef2f2', color: '#991b1b' }
          ] : null}
        />
        <StatCard 
          title="Tunggakan Syahriah" 
          value={stats ? formatRp(stats.tunggakan) : '—'} 
          subtext="Total tunggakan belum lunas" 
          icon={AlertCircle}
          loading={loading}
        />
        <StatCard 
          title="Total Tabungan" 
          value={stats ? formatRp(stats.totalTabungan) : '—'} 
          subtext="Total saldo seluruh santri" 
          icon={Wallet} 
          trend={true}
          loading={loading}
        />
      </div>

      <div className="charts-grid grid-2-cols mb-6">
        <div className="card chart-card featured">
          <h3 className="card-title">Tren Kehadiran (30 Hari)</h3>
          <div className="mock-chart flex items-end justify-between mt-4" style={{ position: 'relative' }}>
            {stats?.kehadiranTrendDetail?.length > 0 ? stats.kehadiranTrendDetail.map((d, i) => {
              const maxVal = Math.max(...stats.kehadiranTrendDetail.map(x => x.hadir), 1);
              const height = (d.hadir / maxVal) * 100;
              const pct = d.totalAktif > 0 ? Math.round((d.hadir / d.totalAktif) * 100) : 0;
              const showLabel = i % 5 === 0 || i === 29;
              return (
                <div key={i} className="chart-bar-wrapper" style={{ position: 'relative' }}>
                  {/* Percentage label on top */}
                  <div style={{ 
                    fontSize: '8px', 
                    fontWeight: '700', 
                    color: 'var(--color-primary-container)', 
                    textAlign: 'center', 
                    marginBottom: '2px',
                    opacity: showLabel ? 1 : 0,
                    minHeight: '12px'
                  }}>
                    {pct}%
                  </div>
                  <div className="chart-bar" style={{ height: `${height}%` }} title={`${d.tanggal}: ${d.hadir} hadir (${pct}%)`}></div>
                  {/* Date label at bottom */}
                  {showLabel && (
                    <div style={{ 
                      fontSize: '7px', 
                      color: 'var(--color-outline)', 
                      textAlign: 'center', 
                      marginTop: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      {new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </div>
                  )}
                </div>
              );
            }) : stats?.kehadiranTrend?.length > 0 ? stats.kehadiranTrend.map((h, i) => {
              const maxVal = Math.max(...stats.kehadiranTrend, 1);
              const height = (h / maxVal) * 100;
              return (
                <div key={i} className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: `${height}%` }} title={`${h} santri`}></div>
                </div>
              );
            }) : (
              <div className="w-full text-center py-10 text-gray-400">Belum ada data kehadiran</div>
            )}
          </div>
        </div>
        
        <div className="card chart-card">
          <h3 className="card-title">Distribusi Santri per Kelas</h3>
          <div className="mock-chart flex items-end mt-4" style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '16px', gap: '12px', height: '240px' }}>
            {stats?.distribusiKelas?.length > 0 ? stats.distribusiKelas.map((k, i) => {
              const maxVal = Math.max(...stats.distribusiKelas.map(x => x.value), 1);
              const height = (k.value / maxVal) * 100;
              return (
                <div key={i} style={{ height: '100%', minWidth: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {/* Count label on top of bar */}
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    color: 'var(--color-primary-container)', 
                    marginBottom: '4px',
                    textAlign: 'center'
                  }}>
                    {k.value}
                  </div>
                  <div className="chart-bar alt" style={{ height: `${height}%`, width: '100%', minHeight: '4px' }} title={`${k.label}: ${k.value} santri`}></div>
                  <div style={{ fontSize: '10px', marginTop: '8px', color: 'var(--color-outline)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                    {k.label.length > 5 ? k.label.substring(0, 5) + '..' : k.label}
                  </div>
                </div>
              );
            }) : (
              <div className="w-full text-center py-10 text-gray-400">Belum ada data kelas</div>
            )}
          </div>
        </div>
      </div>

      <div className="card table-card">
        <h3 className="card-title mb-4">Aktivitas Terbaru</h3>
        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Santri</th>
                <th>Kelas</th>
                <th>Aktivitas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {aktivitas.length > 0 ? aktivitas.map((a, i) => (
                <tr key={i}>
                  <td>{a.waktu_scan ? new Date(a.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}</td>
                  <td>{a.santri?.nama_lengkap || '-'}</td>
                  <td>{a.santri?.kelas?.nama_kelas || '-'}</td>
                  <td>Absensi Kehadiran</td>
                  <td><span className={`badge ${a.status === 'hadir' ? 'badge-success' : ''}`}>{a.status || '-'}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center" style={{ color: 'var(--color-outline)', padding: '40px 16px' }}>
                    {loading ? 'Memuat data...' : 'Belum ada aktivitas hari ini'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
