import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Printer, Loader2 } from 'lucide-react';
import { prestasiAPI, guruAPI } from '../../services/api';
import { normalizeProgres } from '../../utils/progres';

const pad = (n) => String(n).padStart(2, '0');
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

// Statistik persentase status progres (L dan L-) per hari atau per bulan.
// Dasar hitung: jumlah catatan prestasi yang diinput; catatan tanpa status dikecualikan dari persentase.
const StatistikProgres = ({ kelasList = [] }) => {
  const [mode, setMode] = useState('harian'); // 'harian' | 'bulanan'
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [kelasId, setKelasId] = useState('');
  const [guruId, setGuruId] = useState('');
  const [guruList, setGuruList] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let current = true;
    guruAPI.getAll().then(g => { if (current) setGuruList(g || []); }).catch(() => {});
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    const run = async () => {
      setLoading(true); setError('');
      try {
        const params = {};
        if (mode === 'harian') {
          const [y, m] = bulan.split('-').map(Number);
          params.dari = `${y}-${pad(m)}-01`;
          params.sampai = `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`;
        } else {
          params.dari = `${tahun}-01-01`;
          params.sampai = `${tahun}-12-31`;
        }
        if (kelasId) params.kelas_id = kelasId;
        if (guruId) params.guru_id = guruId;
        const data = await prestasiAPI.getAll(params);
        if (current) setRows(data || []);
      } catch (e) { if (current) { setError(e.message); setRows([]); } }
      if (current) setLoading(false);
    };
    run();
    return () => { current = false; };
  }, [mode, bulan, tahun, kelasId, guruId]);

  const { buckets, total } = useMemo(() => {
    const map = new Map();
    const all = { catatan: 0, l: 0, lm: 0, tanpa: 0 };
    rows.forEach(r => {
      const key = mode === 'harian' ? r.tanggal : String(r.tanggal).slice(0, 7);
      if (!map.has(key)) map.set(key, { key, catatan: 0, l: 0, lm: 0, tanpa: 0 });
      const b = map.get(key);
      const st = normalizeProgres(r.status);
      b.catatan++; all.catatan++;
      if (st === 'lanjut') { b.l++; all.l++; } else if (st === 'ulang') { b.lm++; all.lm++; } else { b.tanpa++; all.tanpa++; }
    });
    return { buckets: [...map.values()].sort((a, b) => a.key.localeCompare(b.key)), total: all };
  }, [rows, mode]);

  const label = (key) => {
    if (mode === 'harian') { const [y, m, d] = key.split('-'); return `${d}/${m}/${y}`; }
    const [y, m] = key.split('-'); return `${MONTHS[Number(m) - 1]} ${y}`;
  };
  const shortLabel = (key) => (mode === 'harian' ? key.slice(8) : MONTHS[Number(key.slice(5, 7)) - 1].slice(0, 3));
  const periodLabel = mode === 'harian' ? `${MONTHS[Number(bulan.slice(5, 7)) - 1]} ${bulan.slice(0, 4)}` : `Tahun ${tahun}`;
  const known = total.l + total.lm;
  const kelasName = kelasList.find(k => k.id === kelasId)?.nama_kelas;
  const guruName = guruList.find(g => g.id === guruId)?.nama_lengkap;
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const doPrint = () => { setPrinting(true); setTimeout(() => window.print(), 100); };
  useEffect(() => {
    const reset = () => setPrinting(false);
    window.addEventListener('afterprint', reset);
    return () => window.removeEventListener('afterprint', reset);
  }, []);

  const th = { border: '1px solid #000', padding: '5px 6px' };
  const td = { border: '1px solid #000', padding: '4px 6px', textAlign: 'center' };

  return (
    <>
      <div className="card w-full no-print" style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="card-title flex items-center gap-2"><BarChart3 size={18} /> Statistik Status Progres</h3>
          <button className="btn-primary" onClick={doPrint} disabled={loading || buckets.length === 0}><Printer size={18} /> Cetak</button>
        </div>

        <div className="flex items-end gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            {[{ id: 'harian', label: 'Per Hari' }, { id: 'bulanan', label: 'Per Bulan' }].map(t => (
              <button key={t.id} type="button" onClick={() => setMode(t.id)} style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: mode === t.id ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb', backgroundColor: mode === t.id ? '#eff6ff' : '#fff', color: mode === t.id ? '#1d4ed8' : '#6b7280' }}>{t.label}</button>
            ))}
          </div>
          {mode === 'harian'
            ? <div className="form-group" style={{ margin: 0 }}><label className="form-label">Bulan</label><input type="month" className="input-field" value={bulan} onChange={e => setBulan(e.target.value)} /></div>
            : <div className="form-group" style={{ margin: 0 }}><label className="form-label">Tahun</label><input type="number" className="input-field" style={{ width: 100 }} value={tahun} onChange={e => setTahun(e.target.value)} /></div>}
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Kelas</label>
            <select className="input-field" value={kelasId} onChange={e => setKelasId(e.target.value)}><option value="">Semua kelas</option>{kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}</select>
          </div>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Guru</label>
            <select className="input-field" value={guruId} onChange={e => setGuruId(e.target.value)}><option value="">Semua guru</option>{guruList.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}</select>
          </div>
        </div>

        {error && <p role="alert" className="text-red-600 text-sm mb-3">{error}</p>}
        {loading ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>
        : buckets.length === 0 ? <p className="text-center text-gray-400 py-8">Belum ada catatan prestasi pada periode ini</p>
        : (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Total Catatan', value: total.catatan, color: '#334155', bg: '#f8fafc' },
              { label: 'L (Lanjut)', value: `${total.l} (${pct(total.l, known)}%)`, color: '#166534', bg: '#dcfce7' },
              { label: 'L- (Ulang)', value: `${total.lm} (${pct(total.lm, known)}%)`, color: '#991b1b', bg: '#fee2e2' },
            ].map(c => (
              <div key={c.label} style={{ padding: 12, borderRadius: 12, backgroundColor: c.bg }}>
                <div className="text-xs" style={{ color: c.color, fontWeight: 700 }}>{c.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Grafik batang bertumpuk 100% */}
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 150, minWidth: buckets.length * 26, padding: '4px 0' }}>
              {buckets.map(b => {
                const kn = b.l + b.lm;
                return (
                  <div key={b.key} title={`${label(b.key)}: L ${pct(b.l, kn)}% • L- ${pct(b.lm, kn)}% (${b.catatan} catatan)`} style={{ flex: 1, minWidth: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: kn ? '100%' : 4, display: 'flex', flexDirection: 'column-reverse', borderRadius: 4, overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                      <div style={{ height: `${pct(b.l, kn)}%`, backgroundColor: '#10b981' }} />
                      <div style={{ height: `${pct(b.lm, kn)}%`, backgroundColor: '#ef4444' }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{shortLabel(b.key)}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs" style={{ display: 'flex', gap: 16, marginTop: 6, color: '#475569' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, backgroundColor: '#10b981', borderRadius: 2 }} /> L (Lanjut)</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, backgroundColor: '#ef4444', borderRadius: 2 }} /> L- (Ulang)</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table w-full">
              <thead><tr><th>{mode === 'harian' ? 'Tanggal' : 'Bulan'}</th><th>Catatan</th><th style={{ color: '#166534' }}>L</th><th style={{ color: '#166534' }}>% L</th><th style={{ color: '#991b1b' }}>L-</th><th style={{ color: '#991b1b' }}>% L-</th></tr></thead>
              <tbody>
                {[...buckets].reverse().map(b => (
                  <tr key={b.key}>
                    <td className="font-medium">{label(b.key)}</td>
                    <td>{b.catatan}{b.tanpa ? <span className="text-xs text-gray-400"> ({b.tanpa} tanpa status)</span> : null}</td>
                    <td style={{ color: '#166534', fontWeight: 700 }}>{b.l}</td>
                    <td style={{ fontWeight: 700 }}>{pct(b.l, b.l + b.lm)}%</td>
                    <td style={{ color: '#991b1b', fontWeight: 700 }}>{b.lm}</td>
                    <td style={{ fontWeight: 700 }}>{pct(b.lm, b.l + b.lm)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">Persentase dihitung dari jumlah catatan prestasi yang diinput pada periode tersebut. Catatan lama berstatus "lancar" dihitung sebagai L.</p>
        </>)}
      </div>

      {printing && (
        <>
          <style>{`
            @media print {
              @page { size: A4 portrait; margin: 8mm; }
              body * { visibility: hidden; }
              #print-statistik-progres, #print-statistik-progres * { visibility: visible; }
              #print-statistik-progres { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
              html, body, #root, .app-layout, .main-wrapper, .content-area, .content-container, .flex-col {
                overflow: visible !important; height: auto !important; min-height: 0 !important;
                background: transparent !important; box-shadow: none !important;
              }
            }
          `}</style>
          <div id="print-statistik-progres" className="print-only" style={{ padding: '10mm 12mm', backgroundColor: '#fff', color: '#000', fontFamily: 'serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '3px double #000', paddingBottom: 12, marginBottom: 16 }}>
              <img src="/assets/logoapp.png" alt="Logo TPQ" style={{ width: 70, height: 70, objectFit: 'contain' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }}>TPQ ANFAK AL AZIZAH MAGELANG</div>
                <div style={{ fontSize: 10, fontStyle: 'italic' }}>Alamat: Tepus Wetan, Surodadi, Candimulyo, Magelang • Kontak: 0812-2770-5767</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>Statistik Status Progres {mode === 'harian' ? 'Harian' : 'Bulanan'}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Periode: {periodLabel} • Kelas: {kelasName || 'Semua'} • Guru: {guruName || 'Semua'}</div>
              <div style={{ fontSize: 12 }}>Total catatan: {total.catatan} • L: {total.l} ({pct(total.l, known)}%) • L-: {total.lm} ({pct(total.lm, known)}%)</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: 11, fontFamily: 'sans-serif' }}>
              <thead><tr style={{ backgroundColor: '#f1f5f9' }}>
                {[mode === 'harian' ? 'Tanggal' : 'Bulan', 'Catatan', 'L', '% L', 'L-', '% L-'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {buckets.map(b => (
                  <tr key={b.key}>
                    <td style={{ ...td, textAlign: 'left' }}>{label(b.key)}</td>
                    <td style={td}>{b.catatan}</td>
                    <td style={td}>{b.l}</td>
                    <td style={{ ...td, fontWeight: 'bold' }}>{pct(b.l, b.l + b.lm)}%</td>
                    <td style={td}>{b.lm}</td>
                    <td style={{ ...td, fontWeight: 'bold' }}>{pct(b.lm, b.l + b.lm)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28, fontSize: 11, pageBreakInside: 'avoid' }}>
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

export default StatistikProgres;
