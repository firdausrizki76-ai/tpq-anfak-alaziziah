import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Printer, Loader2, Search } from 'lucide-react';
import { absensiAPI } from '../../services/api';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const monthLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const barColor = (p) => (p >= 90 ? '#10b981' : p >= 75 ? '#f59e0b' : '#ef4444');

// Kehadiran per orang dalam satu bulan terhadap HARI EFEKTIF
// (semua hari dikurangi Kamis dan tanggal libur Kalender Pendidikan; bulan berjalan dihitung sampai hari ini).
const KehadiranBulanan = ({ kelasList = [] }) => {
  const [tipe, setTipe] = useState('santri');
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [kelasId, setKelasId] = useState('');
  const [sort, setSort] = useState('persen_desc');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { bulan, tipe };
      if (tipe === 'santri' && kelasId) params.kelas_id = kelasId;
      setData(await absensiAPI.getKehadiranBulanan(params));
    } catch (e) { setError(e.message); setData(null); }
    setLoading(false);
  }, [bulan, tipe, kelasId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const reset = () => setPrinting(false);
    window.addEventListener('afterprint', reset);
    return () => window.removeEventListener('afterprint', reset);
  }, []);

  const rows = (data?.rows || [])
    .filter(r => !search || r.nama.toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => {
      if (sort === 'nama') return a.nama.localeCompare(b.nama);
      if (sort === 'persen_asc') return a.persen - b.persen || a.nama.localeCompare(b.nama);
      return b.persen - a.persen || a.nama.localeCompare(b.nama);
    });
  const efektif = data?.hari_efektif || 0;
  const avg = data?.rows?.length ? Math.round(data.rows.reduce((a, r) => a + r.persen, 0) / data.rows.length * 10) / 10 : 0;
  const kelasName = kelasList.find(k => k.id === kelasId)?.nama_kelas;
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const doPrint = () => { setPrinting(true); setTimeout(() => window.print(), 100); };
  const cell = { border: '1px solid #000', padding: '4px 6px', textAlign: 'center' };

  return (
    <>
      <div className="card w-full no-print">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="card-title flex items-center gap-2"><CalendarDays size={18} /> Kehadiran Bulanan terhadap Hari Efektif</h3>
          <button className="btn-primary" onClick={doPrint} disabled={loading || rows.length === 0}><Printer size={18} /> Cetak</button>
        </div>

        <div className="flex items-end gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            {[{ id: 'santri', label: 'Santri' }, { id: 'guru', label: 'Guru' }].map(t => (
              <button key={t.id} type="button" onClick={() => { setTipe(t.id); setKelasId(''); }} style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: tipe === t.id ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb', backgroundColor: tipe === t.id ? '#eff6ff' : '#fff', color: tipe === t.id ? '#1d4ed8' : '#6b7280' }}>{t.label}</button>
            ))}
          </div>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Bulan</label><input type="month" className="input-field" value={bulan} onChange={e => e.target.value && setBulan(e.target.value)} /></div>
          {tipe === 'santri' && (
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Kelas</label>
              <select className="input-field" value={kelasId} onChange={e => setKelasId(e.target.value)}><option value="">Semua kelas</option>{kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}</select>
            </div>
          )}
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Urutkan</label>
            <select className="input-field" value={sort} onChange={e => setSort(e.target.value)}><option value="persen_desc">Persentase tertinggi</option><option value="persen_asc">Persentase terendah</option><option value="nama">Nama A–Z</option></select>
          </div>
          <div className="input-with-icon" style={{ maxWidth: 240 }}>
            <Search className="icon" size={18} />
            <input type="text" className="input-field" placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <p role="alert" className="text-red-600 text-sm mb-3">{error}</p>}
        {loading ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>
        : !data ? null
        : (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#eff6ff' }}><div className="text-xs" style={{ color: '#1d4ed8', fontWeight: 700 }}>Hari Efektif</div><div style={{ fontWeight: 800, fontSize: 22, color: '#1d4ed8' }}>{efektif} hari</div></div>
            <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#f8fafc' }}><div className="text-xs" style={{ color: '#475569', fontWeight: 700 }}>Hari Dikecualikan</div><div style={{ fontWeight: 800, fontSize: 22, color: '#475569' }}>{data.dikecualikan.length} hari</div></div>
            <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#f0fdf4' }}><div className="text-xs" style={{ color: '#166534', fontWeight: 700 }}>Rata-rata Kehadiran</div><div style={{ fontWeight: 800, fontSize: 22, color: '#166534' }}>{avg}%</div></div>
          </div>
          <details className="text-xs text-gray-600 mb-4">
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Rincian hari efektif {monthLabel(bulan)}{data.sampai ? ` (dihitung sampai ${fmtDate(data.sampai)})` : ''}</summary>
            <div style={{ marginTop: 6, lineHeight: 1.6 }}>
              <div><strong>Dikecualikan:</strong> {data.dikecualikan.length ? data.dikecualikan.map(d => `${fmtDate(d.tanggal)} (${d.alasan})`).join('; ') : 'tidak ada'}</div>
              <div><strong>Hari efektif:</strong> {data.tanggal_efektif.length ? data.tanggal_efektif.map(d => d.slice(8)).join(', ') : 'belum ada'}</div>
              <div className="text-gray-500">Hari efektif = semua hari dalam bulan dikurangi Kamis (libur mingguan) dan tanggal libur di Kalender Pendidikan. Hari Minggu tetap dihitung. Hanya kehadiran pada hari efektif yang dihitung.</div>
            </div>
          </details>

          {efektif === 0 ? <p className="text-center text-gray-400 py-6">Belum ada hari efektif pada bulan ini (bulan belum dimulai atau seluruhnya libur).</p> : (
            <div className="table-responsive">
              <table className="data-table w-full">
                <thead><tr><th>No</th><th>Nama</th>{tipe === 'santri' && <th>Kelas</th>}<th>Masuk (kali)</th><th>Izin</th><th>Sakit</th><th>Alfa</th><th>Belum Tercatat</th><th style={{ minWidth: 170 }}>% dari Hari Efektif</th></tr></thead>
                <tbody>
                  {rows.length === 0 ? <tr><td colSpan="9" className="text-center py-6 text-gray-400">Tidak ada data</td></tr>
                  : rows.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td className="font-medium">{r.nama}</td>
                      {tipe === 'santri' && <td>{r.kelas}</td>}
                      <td style={{ fontWeight: 700, color: '#166534' }}>{r.hadir} <span className="text-xs text-gray-400">/ {efektif}</span></td>
                      <td>{r.izin}</td><td>{r.sakit}</td>
                      <td style={{ color: r.alfa ? '#991b1b' : undefined, fontWeight: r.alfa ? 700 : 400 }}>{r.alfa}</td>
                      <td className="text-gray-500">{r.belum_tercatat}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 100, overflow: 'hidden' }}><div style={{ width: `${Math.min(r.persen, 100)}%`, height: '100%', backgroundColor: barColor(r.persen) }} /></div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: barColor(r.persen) }}>{r.persen}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>)}
      </div>

      {printing && data && (
        <>
          <style>{`
            @media print {
              @page { size: A4 portrait; margin: 8mm; }
              body * { visibility: hidden; }
              #print-kehadiran-bulanan, #print-kehadiran-bulanan * { visibility: visible; }
              #print-kehadiran-bulanan { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
              html, body, #root, .app-layout, .main-wrapper, .content-area, .content-container, .flex-col {
                overflow: visible !important; height: auto !important; min-height: 0 !important;
                background: transparent !important; box-shadow: none !important;
              }
            }
          `}</style>
          <div id="print-kehadiran-bulanan" className="print-only" style={{ padding: '10mm 12mm', backgroundColor: '#fff', color: '#000', fontFamily: 'serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '3px double #000', paddingBottom: 12, marginBottom: 16 }}>
              <img src="/assets/logoapp.png" alt="Logo TPQ" style={{ width: 70, height: 70, objectFit: 'contain' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }}>TPQ ANFAK AL AZIZAH MAGELANG</div>
                <div style={{ fontSize: 10, fontStyle: 'italic' }}>Alamat: Tepus Wetan, Surodadi, Candimulyo, Magelang • Kontak: 0812-2770-5767</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>Rekap Kehadiran {tipe === 'santri' ? 'Santri' : 'Guru'} terhadap Hari Efektif</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Periode: {monthLabel(bulan)}{tipe === 'santri' && kelasName ? ` • Kelas: ${kelasName}` : ''} • Hari efektif: {efektif} hari • Rata-rata: {avg}%</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: 10.5, fontFamily: 'sans-serif' }}>
              <thead><tr style={{ backgroundColor: '#f1f5f9' }}>
                {['No', 'Nama', ...(tipe === 'santri' ? ['Kelas'] : []), 'Masuk', 'Izin', 'Sakit', 'Alfa', 'Belum Tercatat', '% Kehadiran'].map(h => <th key={h} style={{ border: '1px solid #000', padding: '5px 4px' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td style={cell}>{i + 1}</td>
                    <td style={{ ...cell, textAlign: 'left' }}>{r.nama}</td>
                    {tipe === 'santri' && <td style={cell}>{r.kelas}</td>}
                    <td style={cell}>{r.hadir}</td><td style={cell}>{r.izin}</td><td style={cell}>{r.sakit}</td><td style={cell}>{r.alfa}</td><td style={cell}>{r.belum_tercatat}</td>
                    <td style={{ ...cell, fontWeight: 'bold' }}>{r.persen}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10, marginTop: 8 }}>Hari efektif = hari dalam bulan dikurangi Kamis (libur mingguan) dan tanggal libur Kalender Pendidikan.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, fontSize: 11, pageBreakInside: 'avoid' }}>
              <div style={{ textAlign: 'center', width: 230 }}>
                <p style={{ margin: 0 }}>Magelang, {today}</p>
                <p style={{ margin: '2px 0 55px 0' }}>Kepala TPQ Anfak Al Azizah</p>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>( ..................................................... )</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default KehadiranBulanan;
