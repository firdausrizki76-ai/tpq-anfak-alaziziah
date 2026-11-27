import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { materiAPI } from '../services/api';

// Pilih satu atau beberapa materi dari template kelas, plus isian bebas jika materi tidak ada di daftar.
// Controlled: selected (array nama materi), custom (teks), onChange({ selected, custom }).
const MateriPicker = ({ kelasId, selected, custom, onChange }) => {
  const [materi, setMateri] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null);
  const [filter, setFilter] = useState('');
  const loading = !!kelasId && loadedFor !== kelasId;

  useEffect(() => {
    if (!kelasId) return undefined;
    let current = true;
    materiAPI.getAll({ kelas_id: kelasId })
      .then(data => { if (current) { setMateri(data || []); setLoadedFor(kelasId); } })
      .catch(() => { if (current) { setMateri([]); setLoadedFor(kelasId); } });
    return () => { current = false; };
  }, [kelasId]);

  const toggle = (nama) => onChange({ selected: selected.includes(nama) ? selected.filter(n => n !== nama) : [...selected, nama], custom });
  const visible = (kelasId ? materi : []).filter(m => !filter || m.nama.toLowerCase().includes(filter.toLowerCase()));
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 12 };

  return (
    <div>
      {!kelasId ? <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>Pilih santri terlebih dahulu agar daftar materi kelasnya muncul.</p>
      : loading ? <div style={{ padding: 8 }}><Loader2 size={16} className="animate-spin" /></div>
      : materi.length === 0 ? <p style={{ fontSize: 11, color: '#b45309', margin: '0 0 8px' }}>Kelas ini belum punya daftar materi. Ketik materi di kolom bawah, atau minta admin mengisi daftar di menu Kelas.</p>
      : (<>
        {materi.length > 12 && <input type="text" placeholder="Cari materi..." value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto', padding: 2 }}>
          {visible.map(m => {
            const on = selected.includes(m.nama);
            return (
              <button key={m.id} type="button" onClick={() => toggle(m.nama)} style={{ padding: '6px 10px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontWeight: on ? 700 : 500, border: on ? '1px solid #059669' : '1px solid #e2e8f0', backgroundColor: on ? '#dcfce7' : '#f8fafc', color: on ? '#064e3b' : '#475569' }}>
                {on ? '✓ ' : ''}{m.nama}
              </button>
            );
          })}
          {visible.length === 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>Tidak ada materi yang cocok.</span>}
        </div>
        {selected.length > 0 && <p style={{ fontSize: 11, color: '#047857', margin: '6px 0 0' }}>Terpilih: {selected.join(', ')}</p>}
      </>)}
      <input type="text" placeholder="Materi lain (ketik sendiri jika tidak ada di daftar)" value={custom} onChange={e => onChange({ selected, custom: e.target.value })} style={{ ...inputStyle, marginTop: 8 }} />
    </div>
  );
};

export default MateriPicker;
