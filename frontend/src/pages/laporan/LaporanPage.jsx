import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Wallet, GraduationCap, CheckCircle2, Loader2 } from 'lucide-react';
import { laporanAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const LaporanPage = () => {
  const [loading, setLoading] = useState({});
  const [keuanganData, setKeuanganData] = useState(null);
  const [absensiData, setAbsensiData] = useState(null);

  useEffect(() => { loadSummary(); }, []);

  const loadSummary = async () => {
    try {
      const [keu, abs] = await Promise.all([laporanAPI.getKeuangan().catch(() => null), laporanAPI.getAbsensi().catch(() => null)]);
      setKeuanganData(keu); setAbsensiData(abs);
    } catch (e) { console.error(e); }
  };

  const handleDownload = (type, format) => {
    const key = `${type}_${format}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    setTimeout(() => { setLoading(prev => ({ ...prev, [key]: false })); alert(`Laporan ${type} (${format}) sedang diunduh...`); }, 2000);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  const ReportCard = ({ title, description, icon: Icon, colorClass, type, summary }) => (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-3 rounded-lg ${colorClass}`}><Icon size={24} /></div>
        <div>
          <h3 className="font-bold text-lg text-[var(--color-primary-container)]">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {summary && <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">{summary}</div>}
      <div className="flex gap-2 items-center">
        <Calendar size={16} className="text-gray-400" />
        <select className="input-field" style={{ flex: 1 }}>
          <option>Bulan Ini (Mei 2026)</option><option>Bulan Lalu</option><option>Semester Ini</option><option>Tahun Ajaran</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button className="btn-primary justify-center bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50" onClick={() => handleDownload(type, 'Excel')} disabled={loading[`${type}_Excel`]}>
          {loading[`${type}_Excel`] ? <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div> : <><Download size={16} /> Excel</>}
        </button>
        <button className="btn-primary justify-center" onClick={() => handleDownload(type, 'PDF')} disabled={loading[`${type}_PDF`]}>
          {loading[`${type}_PDF`] ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FileText size={16} /> PDF</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6"><h1 className="page-title">Pusat Laporan</h1><p className="page-subtitle">Unduh rekapitulasi data TPQ untuk periode tertentu</p></div>
      <div className="grid grid-2-cols gap-6">
        <ReportCard type="keuangan" title="Laporan Keuangan" description="Rekap syahriah, pemasukan, dan pengeluaran." icon={Wallet} colorClass="bg-emerald-100 text-emerald-600"
          summary={keuanganData ? `Total masuk: ${formatRp(keuanganData.totalMasuk)} | Tunggakan: ${formatRp(keuanganData.totalTunggakan)}` : null} />
        <ReportCard type="absensi" title="Laporan Absensi" description="Rekapitulasi kehadiran santri." icon={CheckCircle2} colorClass="bg-blue-100 text-blue-600"
          summary={absensiData ? `Hadir: ${absensiData.hadir} | Sakit: ${absensiData.sakit} | Izin: ${absensiData.izin} | Alfa: ${absensiData.alfa}` : null} />
        <ReportCard type="tabungan" title="Laporan Tabungan" description="Rekap setoran dan penarikan tabungan." icon={FileText} colorClass="bg-orange-100 text-orange-600" />
        <ReportCard type="santri" title="Laporan Akademik" description="Perkembangan hafalan dan nilai santri." icon={GraduationCap} colorClass="bg-purple-100 text-purple-600" />
      </div>
    </div>
  );
};

export default LaporanPage;
