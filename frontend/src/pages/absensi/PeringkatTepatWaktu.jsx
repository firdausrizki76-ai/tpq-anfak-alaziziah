import { useState, useEffect, useCallback } from 'react';
import { Trophy, Printer, Loader2 } from 'lucide-react';
import { absensiAPI } from '../../services/api';

const pad = (n) => String(n).padStart(2, '0');
const monthRange = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { dari: `${y}-${pad(m)}-01`, sampai: `${y}-${pad(m)}-${pad(last)}` };
};
const monthLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' }); };

// Aturan peringkat "paling tepat waktu":
//  - Syarat: minimal N hari hadir yang jadwalnya terukur (tepat waktu + terlambat >= N).
//  - Skor = hari tepat waktu / (hari hadir + alfa). Izin & sakit tidak menambah atau mengurangi skor.
//  - Urutan: skor tertinggi, lalu hari tepat waktu terbanyak, lalu alfa paling sedikit, lalu nama.
// Aturan peringkat "paling banyak berangkat":
//  - Skor = jumlah hari hadir dalam bulan itu (minimal 1).
//  - Urutan: hari hadir terbanyak, lalu hari tepat waktu terbanyak, lalu alfa paling sedikit, lalu nama.
const rankAttendance = (rows) => rows
  .filter(r => (r.hadir || 0) > 0)
  .map(r => ({ ...r, terukur: (r.tepat_waktu || 0) + (r.terlambat || 0), skor: r.hadir || 0 }))
  .sort((a, b) => b.skor - a.skor || (b.tepat_waktu || 0) - (a.tepat_waktu || 0) || (a.alfa || 0) - (b.alfa || 0) || a.nama.localeCompare(b.nama));

const rankPunctuality = (rows, minHari) => rows
  .map(r => {
    const terukur = (r.tepat_waktu || 0) + (r.terlambat || 0);
    const penyebut = (r.hadir || 0) + (r.alfa || 0);
    return { ...r, terukur, skor: penyebut ? Math.round((r.tepat_waktu || 0) / penyebut * 1000) / 10 : 0 };
  })
  .filter(r => r.terukur >= minHari)
  .sort((a, b) => b.skor - a.skor || b.tepat_waktu - a.tepat_waktu || a.alfa - b.alfa || a.nama.localeCompare(b.nama));

const PeringkatTepatWaktu = ({ kelasList = [] }) => {
  const [tipe, setTipe] = useState('santri');
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [kelasId, setKelasId] = useState('');
  const [kriteria, setKriteria] = useState('tepat'); // 'tepat' | 'berangkat'
  const [minHari, setMinHari] = useState(5);
  const [topN, setTopN] = useState(3);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { dari, sampai } = monthRange(bulan);
      const params = { tipe, tanggal_mulai: dari, tanggal_selesai: sampai };
      if (tipe === 'santri' && kelasId) params.kelas_id = kelasId;
      setRows(await absensiAPI.getRekap(params) || []);
    } catch (e) { setError(e.message); setRows([]); }
    setLoading(false);
  }, [tipe, bulan, kelasId]);

  useEffect(() => { load(); }, [load]);

  const byAttendance = kriteria === 'berangkat';
  const ranked = byAttendance ? rankAttendance(rows) : rankPunctuality(rows, Number(minHari) || 1);
  const winners = ranked.slice(0, Number(topN) || 3);
  const excluded = rows.length - ranked.length;
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const medals = ['🥇', '🥈', '🥉'];
  const skorText = (r) => (byAttendance ? `${r.skor} hari` : `${r.skor}%`);
  const judul = byAttendance ? 'Kehadiran Terbanyak' : 'Ketepatan Waktu';

  return (
    <>
      <div className="card w-full no-print">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="card-title flex items-center gap-2"><Trophy size={18} /> Peringkat Reward Bulanan</h3>
          <button className="btn-primary" onClick={() => window.print()} disabled={loading || winners.length === 0}><Printer size={18} /> Cetak Daftar Penerima Reward</button>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-600">Peringkat berdasarkan:</span>
          {[{ id: 'tepat', label: 'Paling tepat waktu' }, { id: 'berangkat', label: 'Paling banyak berangkat' }].map(k => (
            <button key={k.id} type="button" onClick={() => setKriteria(k.id)} style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: kriteria === k.id ? '1.5px solid #10b981' : '1.5px solid #e5e7eb', backgroundColor: kriteria === k.id ? '#f0fdf4' : '#fff', color: kriteria === k.id ? '#047857' : '#6b7280' }}>{k.label}</button>
          ))}
        </div>

        <div className="flex items-end gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            {[{ id: 'santri', label: 'Santri' }, { id: 'guru', label: 'Guru' }].map(t => (
              <button key={t.id} type="button" onClick={() => { setTipe(t.id); setKelasId(''); }} style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: tipe === t.id ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb', backgroundColor: tipe === t.id ? '#eff6ff' : '#fff', color: tipe === t.id ? '#1d4ed8' : '#6b7280' }}>{t.label}</button>
            ))}
          </div>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Bulan</label><input type="month" className="input-field" value={bulan} onChange={e => setBulan(e.target.value)} /></div>
          {tipe === 'santri' && (
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Kelas</label>
              <select className="input-field" value={kelasId} onChange={e => setKelasId(e.target.value)}><option value="">Semua kelas</option>{kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}</select>
            </div>
          )}
          {!byAttendance && <div className="form-group" style={{ margin: 0 }}><label className="form-label">Min. hari hadir terukur</label><input type="number" min="1" className="input-field" style={{ width: 110 }} value={minHari} onChange={e => setMinHari(e.target.value)} /></div>}
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Penerima reward</label>
            <select className="input-field" value={topN} onChange={e => setTopN(e.target.value)}>{[1, 3, 5, 10].map(n => <option key={n} value={n}>{n} teratas</option>)}</select>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          {byAttendance
            ? <>Peringkat berdasarkan <strong>jumlah hari hadir</strong> pada {monthLabel(bulan)}. Seri diurutkan dari hari tepat waktu terbanyak, lalu alfa paling sedikit.</>
            : <>Skor = hari <strong>tepat waktu</strong> ÷ (hari hadir + alfa) pada {monthLabel(bulan)}. Izin dan sakit tidak memengaruhi skor. Hanya yang punya minimal {minHari} hari hadir dengan jadwal terukur yang diperingkat. Seri diurutkan dari hari tepat waktu terbanyak, lalu alfa paling sedikit.</>}
          {tipe === 'guru' && !byAttendance && ' Untuk guru, jadwal diambil dari shift kelas yang diampu dan shift tambahan.'}
        </p>

        {error && <p role="alert" className="text-red-600 text-sm mb-3">{error}</p>}
        {loading ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>
        : ranked.length === 0 ? <p className="text-center text-gray-400 py-8">Belum ada data yang memenuhi syarat pada bulan ini.{!byAttendance && ' Pastikan kelas/guru sudah memiliki shift jadwal.'}</p>
        : (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            {winners.slice(0, 3).map((r, i) => (
              <div key={r.id} style={{ padding: 14, borderRadius: 16, border: '1px solid #fde68a', backgroundColor: ['#fffbeb', '#f8fafc', '#fff7ed'][i] }}>
                <div style={{ fontSize: 22 }}>{medals[i]}</div>
                <div style={{ fontWeight: 800, color: '#1e293b' }}>{r.nama}</div>
                {tipe === 'santri' && <div className="text-xs text-gray-500">{r.kelas}</div>}
                <div style={{ fontWeight: 800, color: '#166534', marginTop: 4 }}>{byAttendance ? `${r.skor} hari hadir` : `${r.skor}% tepat waktu`}</div>
                <div className="text-xs text-gray-500">{r.tepat_waktu} tepat • {r.terlambat} terlambat • {r.alfa} alfa</div>
              </div>
            ))}
          </div>
          <div className="table-responsive">
            <table className="data-table w-full">
              <thead><tr><th>Peringkat</th><th>Nama</th>{tipe === 'santri' && <th>Kelas</th>}<th>Hadir</th><th>Tepat Waktu</th><th>Terlambat</th><th>Alfa</th><th>Izin/Sakit</th><th>{byAttendance ? 'Hari Hadir' : 'Skor'}</th></tr></thead>
              <tbody>
                {ranked.map((r, i) => (
                  <tr key={r.id} style={i < winners.length ? { backgroundColor: '#fffbeb' } : {}}>
                    <td style={{ fontWeight: 800 }}>{i + 1}{i < winners.length ? ' ★' : ''}</td>
                    <td className="font-medium">{r.nama}</td>
                    {tipe === 'santri' && <td>{r.kelas}</td>}
                    <td>{r.hadir}</td>
                    <td style={{ color: '#166534', fontWeight: 700 }}>{r.tepat_waktu}</td>
                    <td style={{ color: '#c2410c', fontWeight: 700 }}>{r.terlambat}</td>
                    <td style={{ color: '#991b1b', fontWeight: 700 }}>{r.alfa}</td>
                    <td>{(r.izin || 0) + (r.sakit || 0)}</td>
                    <td style={{ fontWeight: 800 }}>{skorText(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>)}
        {excluded > 0 && !loading && <p className="text-xs text-amber-600 mt-3">{excluded} orang tidak diperingkat {byAttendance ? 'karena belum pernah hadir pada bulan ini' : `karena hari hadir terukur kurang dari ${minHari} atau jadwal belum tersedia`}.</p>}
      </div>

      {/* Dokumen cetak daftar penerima reward */}
      <div className="print-only" style={{ padding: '24px 30px', backgroundColor: '#fff', color: '#000', fontFamily: 'serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '3px double #000', paddingBottom: 12, marginBottom: 16 }}>
          <img src="/assets/logoapp.png" alt="Logo TPQ" style={{ width: 70, height: 70, objectFit: 'contain' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }}>TPQ ANFAK AL AZIZAH</div>
            <div style={{ fontSize: 10, fontStyle: 'italic' }}>Alamat: Tepus Wetan, Surodadi, Candimulyo, Magelang • Kontak: 0812-2770-5767</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>Daftar Penerima Reward {judul} {tipe === 'santri' ? 'Santri' : 'Guru'}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Periode: {monthLabel(bulan)}{tipe === 'santri' && kelasId ? ` • Kelas: ${kelasList.find(k => k.id === kelasId)?.nama_kelas || ''}` : ''}</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: 11, fontFamily: 'sans-serif' }}>
          <thead><tr style={{ backgroundColor: '#f1f5f9' }}>
            {['Peringkat', 'Nama', ...(tipe === 'santri' ? ['Kelas'] : []), 'Hadir', 'Tepat Waktu', 'Terlambat', 'Alfa', byAttendance ? 'Hari Hadir' : 'Skor'].map(h => <th key={h} style={{ border: '1px solid #000', padding: 6 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {winners.map((r, i) => (
              <tr key={r.id}>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center', fontWeight: 'bold' }}>{i + 1}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{r.nama}</td>
                {tipe === 'santri' && <td style={{ border: '1px solid #000', padding: 6 }}>{r.kelas}</td>}
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>{r.hadir}</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>{r.tepat_waktu}</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>{r.terlambat}</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center' }}>{r.alfa}</td>
                <td style={{ border: '1px solid #000', padding: 6, textAlign: 'center', fontWeight: 'bold' }}>{skorText(r)}</td>
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
  );
};

export default PeringkatTepatWaktu;
