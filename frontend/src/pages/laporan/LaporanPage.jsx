import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Wallet, GraduationCap, CheckCircle2, Loader2, X } from 'lucide-react';
import { laporanAPI } from '../../services/api';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import '../dashboard/Dashboard.css';

const LaporanPage = () => {
  const [loading, setLoading] = useState({});
  const [keuanganData, setKeuanganData] = useState(null);
  const [absensiData, setAbsensiData] = useState(null);
  const [tabunganData, setTabunganData] = useState(null);

  const getInitialDates = (presetType) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    
    if (presetType === 'this_month') {
      const start = new Date(y, m, 1);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    }
    if (presetType === 'last_month') {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    }
    return { startDate: '', endDate: '' };
  };

  const [preset, setPreset] = useState('this_month');
  const [startDate, setStartDate] = useState(getInitialDates('this_month').startDate);
  const [endDate, setEndDate] = useState(getInitialDates('this_month').endDate);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setPreset(val);
    if (val !== 'custom' && val !== 'all') {
      const dates = getInitialDates(val);
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    } else if (val === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  useEffect(() => {
    loadSummary(startDate, endDate);
  }, [startDate, endDate]);

  const loadSummary = async (start = startDate, end = endDate) => {
    try {
      const params = {};
      if (start) params.dari = start;
      if (end) params.sampai = end;

      const [keu, abs, tab] = await Promise.all([
        laporanAPI.getKeuangan(params).catch(() => null), 
        laporanAPI.getAbsensi(params).catch(() => null),
        laporanAPI.getTabungan(params).catch(() => null)
      ]);
      setKeuanganData(keu); 
      setAbsensiData(abs);
      setTabunganData(tab);
    } catch (e) { console.error(e); }
  };

  const flattenData = (type, data) => {
    if (type === 'keuangan') {
      return data.map(p => ({
        'Tanggal': new Date(p.created_at).toLocaleDateString('id-ID'),
        'Nama Santri': p.santri?.nama_lengkap || '-',
        'NIS': p.santri?.nomor_induk || '-',
        'Jenis': p.jenis?.nama || '-',
        'Bulan': p.bulan || '-',
        'Tahun': p.tahun || '-',
        'Nominal': p.nominal,
        'Status': p.status === 'lunas' ? 'Lunas' : 'Belum Lunas'
      }));
    }
    if (type === 'absensi') {
      return data.map(a => ({
        'Tanggal': a.tanggal,
        'Nama Santri': a.santri?.nama_lengkap || '-',
        'NIS': a.santri?.nomor_induk || '-',
        'Kelas': a.santri?.kelas?.nama_kelas || '-',
        'Status': a.status.toUpperCase(),
        'Keterangan': a.keterangan || '-'
      }));
    }
    if (type === 'tabungan') {
      return data.map(t => ({
        'Tanggal': t.tanggal,
        'Nama Santri': t.santri?.nama_lengkap || '-',
        'Kelas': t.santri?.kelas?.nama_kelas || '-',
        'Jenis': t.jenis === 'setor' ? 'Setoran' : 'Penarikan',
        'Nominal': t.nominal,
        'Saldo Akhir': t.saldo_setelah,
        'Keterangan': t.keterangan || '-'
      }));
    }
    if (type === 'santri') {
      return data.map(h => ({
        'Tanggal': h.tanggal_naik || h.created_at,
        'Nama Santri': h.santri?.nama_lengkap || '-',
        'NIS': h.santri?.nomor_induk || '-',
        'Dari Kelas': h.kelas_dari?.nama_kelas || '-',
        'Ke Kelas': h.kelas_ke?.nama_kelas || '-',
        'Nilai': h.nilai_tes || '-',
        'Status': h.status_tes || '-',
        'Catatan': h.catatan || '-'
      }));
    }
    return data;
  };

  const getColumns = (type) => {
    if (type === 'keuangan') return ['Tanggal', 'Santri', 'Jenis', 'Periode', 'Nominal', 'Status'];
    if (type === 'absensi') return ['Tanggal', 'Santri', 'Kelas', 'Status', 'Ket'];
    if (type === 'tabungan') return ['Tanggal', 'Santri', 'Jenis', 'Nominal', 'Saldo', 'Ket'];
    if (type === 'santri') return ['Tanggal', 'Santri', 'Dari', 'Ke', 'Nilai', 'Status'];
    return [];
  };

  const getRow = (type, item) => {
    if (type === 'keuangan') return [new Date(item.created_at).toLocaleDateString('id-ID'), item.santri?.nama_lengkap, item.jenis?.nama, `${item.bulan}/${item.tahun}`, formatRp(item.nominal), item.status];
    if (type === 'absensi') return [item.tanggal, item.santri?.nama_lengkap, item.santri?.kelas?.nama_kelas, item.status, item.keterangan || '-'];
    if (type === 'tabungan') return [item.tanggal, item.santri?.nama_lengkap, item.jenis, formatRp(item.nominal), formatRp(item.saldo_setelah), item.keterangan || '-'];
    if (type === 'santri') return [item.tanggal_naik || '-', item.santri?.nama_lengkap, item.kelas_dari?.nama_kelas, item.kelas_ke?.nama_kelas, item.nilai_tes, item.status_tes];
    return [];
  };

  const handleDownload = async (type, format) => {
    const key = `${type}_${format}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const params = {};
      if (startDate) params.dari = startDate;
      if (endDate) params.sampai = endDate;

      let result;
      if (type === 'keuangan') result = await laporanAPI.getKeuangan(params);
      else if (type === 'absensi') result = await laporanAPI.getAbsensi(params);
      else if (type === 'tabungan') result = await laporanAPI.getTabungan(params);
      else if (type === 'santri') result = await laporanAPI.getAkademik(params);

      if (!result || !result.data) throw new Error('Data tidak ditemukan');

      if (format === 'Excel') {
        const ws = XLSX.utils.json_to_sheet(flattenData(type, result.data));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");
        XLSX.writeFile(wb, `Laporan_${type}_${new Date().getTime()}.xlsx`);
      } else {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`LAPORAN ${type.toUpperCase()}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
        
        doc.autoTable({
          startY: 30,
          head: [getColumns(type)],
          body: result.data.map(item => getRow(type, item)),
          theme: 'grid',
          headStyles: { fillGray: [44, 62, 80], textColor: [255, 255, 255] },
        });
        doc.save(`Laporan_${type}_${new Date().getTime()}.pdf`);
      }
    } catch (e) {
      alert('Gagal mengunduh laporan: ' + e.message);
    }
    setLoading(prev => ({ ...prev, [key]: false }));
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
      {summary && <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600" style={{ flex: 1 }}>{summary}</div>}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button className="btn-primary justify-center bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50" onClick={() => handleDownload(type, 'Excel')} disabled={loading[`${type}_Excel`]}>
          {loading[`${type}_Excel`] ? <Loader2 size={16} className="animate-spin" /> : <><Download size={16} /> Excel</>}
        </button>
        <button className="btn-primary justify-center" onClick={() => handleDownload(type, 'PDF')} disabled={loading[`${type}_PDF`]}>
          {loading[`${type}_PDF`] ? <Loader2 size={16} className="animate-spin" /> : <><FileText size={16} /> PDF</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6"><h1 className="page-title">Pusat Laporan</h1><p className="page-subtitle">Unduh rekapitulasi data TPQ untuk periode tertentu</p></div>
      
      {/* Global Filter Bar */}
      <div className="card mb-6" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="var(--color-primary-container)" />
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Periode Laporan:</span>
        </div>
        <select 
          className="input-field" 
          style={{ width: '180px', backgroundColor: 'white' }} 
          value={preset} 
          onChange={handlePresetChange}
        >
          <option value="this_month">Bulan Ini</option>
          <option value="last_month">Bulan Lalu</option>
          <option value="all">Semua Periode</option>
          <option value="custom">Rentang Kustom</option>
        </select>
        
        {preset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Dari:</span>
            <input 
              type="date" 
              className="input-field" 
              style={{ width: '150px', padding: '6px 12px' }} 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <span style={{ fontSize: '13px', color: '#64748b' }}>Sampai:</span>
            <input 
              type="date" 
              className="input-field" 
              style={{ width: '150px', padding: '6px 12px' }} 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
        )}
        
        {startDate && endDate && (
          <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
            Menampilkan data: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s/d {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      <div className="grid grid-2-cols gap-6">
        <ReportCard type="keuangan" title="Laporan Keuangan" description="Rekap syahriah, pemasukan, dan pengeluaran." icon={Wallet} colorClass="bg-emerald-100 text-emerald-600"
          summary={keuanganData ? (
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-gray-800 border-b pb-1 mb-2">
                <span>Total Dana Masuk</span>
                <span>{formatRp(keuanganData.totalMasuk)}</span>
              </div>
              {Object.entries(keuanganData.perKategori || {}).map(([cat, vals]) => (
                <div key={cat} className="flex justify-between text-xs">
                  <span className="text-gray-500">{cat}</span>
                  <span className="font-medium text-emerald-600">{formatRp(vals.masuk)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1 border-t mt-1 text-red-500">
                <span>Tunggakan</span>
                <span>{formatRp(keuanganData.totalTunggakan)}</span>
              </div>
            </div>
          ) : null} />
        <ReportCard type="absensi" title="Laporan Absensi" description="Rekapitulasi kehadiran santri." icon={CheckCircle2} colorClass="bg-blue-100 text-blue-600"
          summary={absensiData ? `Hadir: ${absensiData.hadir} | Sakit: ${absensiData.sakit} | Izin: ${absensiData.izin} | Alfa: ${absensiData.alfa}` : null} />
        <ReportCard type="tabungan" title="Laporan Tabungan" description="Rekap setoran dan penarikan tabungan." icon={FileText} colorClass="bg-orange-100 text-orange-600" 
          summary={tabunganData ? `Total Setor: ${formatRp(tabunganData.totalSetor)} | Total Tarik: ${formatRp(tabunganData.totalTarik)}` : null} />
        <ReportCard type="santri" title="Laporan Akademik" description="Perkembangan hafalan dan nilai santri." icon={GraduationCap} colorClass="bg-purple-100 text-purple-600" />
      </div>
    </div>
  );
};

export default LaporanPage;
