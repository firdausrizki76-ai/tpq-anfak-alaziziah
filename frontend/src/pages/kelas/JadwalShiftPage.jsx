import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Loader2, Clock, Users, GraduationCap } from 'lucide-react';
import { shiftAPI, kelasAPI, guruAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ZONES = { 'Asia/Jakarta': 'WIB', 'Asia/Jakarta': 'WITA', 'Asia/Jayapura': 'WIT' };
const emptyForm = { nama: '', hari: [1, 2, 3, 4, 5], jam_mulai: '16:00', jam_selesai: '17:30', zona_waktu: 'Asia/Jakarta', urutan: 1 };

const dayLabel = (hari = []) => hari.map(h => DAYS[h].slice(0, 3)).join(', ') || '-';
const shiftLabel = (s) => `${s.nama} (${dayLabel(s.hari)} ${s.jam_mulai}–${s.jam_selesai} ${ZONES[s.zona_waktu] || ''})`;

const JadwalShiftPage = () => {
  const [shifts, setShifts] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'shift' | 'guru'
  const [editingShift, setEditingShift] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [guruShiftIds, setGuruShiftIds] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [s, k, g] = await Promise.all([
      shiftAPI.getAll().catch(e => { setError(`${e.message}. Pastikan SQL "shift_jadwal_target_tempuh.sql" sudah dijalankan di Supabase.`); return []; }),
      kelasAPI.getAll().catch(() => []),
      guruAPI.getAll().catch(() => []),
    ]);
    setShifts(s || []); setKelasList(k || []); setGuruList((g || []).filter(x => x.status === 'aktif'));
    setLoading(false);
  };

  const closeModal = () => { setModal(null); setEditingShift(null); setSelectedGuru(null); setError(''); };

  const openShift = (shift = null) => {
    setEditingShift(shift); setError('');
    setForm(shift ? { nama: shift.nama, hari: shift.hari || [], jam_mulai: shift.jam_mulai, jam_selesai: shift.jam_selesai, zona_waktu: shift.zona_waktu, urutan: shift.urutan || 1 } : { ...emptyForm, urutan: shifts.length + 1, nama: `Shift ${shifts.length + 1}` });
    setModal('shift');
  };

  const toggleDay = (d) => setForm(f => ({ ...f, hari: f.hari.includes(d) ? f.hari.filter(x => x !== d) : [...f.hari, d].sort() }));

  const saveShift = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, zona_waktu: 'Asia/Jakarta' };
      if (editingShift) await shiftAPI.update(editingShift.id, payload); else await shiftAPI.create(payload);
      await loadData(); closeModal();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const deleteShift = async (shift) => {
    const used = (shift.kelas?.length || 0) + (shift.jumlah_guru || 0);
    const warn = used ? `Shift dipakai ${shift.kelas.length} kelas dan ${shift.jumlah_guru} guru. Jadwal kelas lama tetap tersimpan, tetapi tidak lagi mengikuti shift. ` : '';
    if (!window.confirm(`${warn}Hapus ${shift.nama}?`)) return;
    try { await shiftAPI.delete(shift.id); await loadData(); } catch (err) { window.alert(err.message); }
  };

  const openGuru = (guru) => { setSelectedGuru(guru); setGuruShiftIds(guru.shift_ids || []); setError(''); setModal('guru'); };

  const saveGuruShift = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try { await guruAPI.setShift(selectedGuru.id, guruShiftIds); await loadData(); closeModal(); } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const waliKelasOf = (guru) => kelasList.filter(k => k.wali_kelas_id === guru.id);
  const shiftsOf = (guru) => shifts.filter(s => (guru.shift_ids || []).includes(s.id));

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center">
        <div>
          <h1 className="page-title">Jadwal & Shift</h1>
          <p className="page-subtitle">Atur shift (hari & jam) sekali, lalu kelas dan guru tinggal memilih shift.</p>
        </div>
        <button className="btn-primary" onClick={() => openShift()}><Plus size={18} /> Tambah Shift</button>
      </div>

      {error && !modal && <p role="alert" className="text-red-600 text-sm">{error}</p>}

      <div className="card w-full">
        <h3 className="card-title mb-4 flex items-center gap-2"><Clock size={18} /> Daftar Shift</h3>
        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>Shift</th><th>Hari</th><th>Jam</th><th>Kelas Memakai</th><th>Guru Memakai</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="text-center" style={{ padding: 40 }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : shifts.length === 0 ? <tr><td colSpan="6" className="text-center text-gray-400" style={{ padding: 32 }}>Belum ada shift. Klik "Tambah Shift" untuk membuat.</td></tr>
              : shifts.map(s => (
                <tr key={s.id}>
                  <td className="font-medium">{s.nama}</td>
                  <td>{s.hari.map(h => DAYS[h]).join(', ')}</td>
                  <td>{s.jam_mulai}–{s.jam_selesai} {ZONES[s.zona_waktu]}</td>
                  <td className="text-xs">{s.kelas?.length ? s.kelas.map(k => k.nama_kelas).join(', ') : <span className="text-gray-400">-</span>}</td>
                  <td>{s.jumlah_guru || 0} guru</td>
                  <td><div className="flex justify-center gap-2">
                    <button className="p-2 text-orange-600 hover:bg-orange-50 rounded" title="Edit" onClick={() => openShift(s)}><Edit size={18} /></button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Hapus" onClick={() => deleteShift(s)}><Trash2 size={18} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card w-full">
        <h3 className="card-title mb-1 flex items-center gap-2"><GraduationCap size={18} /> Jadwal Guru</h3>
        <p className="text-xs text-gray-500 mb-4">
          Guru wali kelas otomatis mengikuti shift kelas yang diampu (diatur di menu Kelas). Guru yang <strong>bukan wali kelas</strong> (atau punya tugas tambahan) diatur di sini dengan memilih satu atau lebih shift. Jam datang dan pulang guru dihitung dari awal sampai akhir seluruh jadwalnya pada hari itu.
        </p>
        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>Guru</th><th>Peran</th><th>Jadwal dari Kelas</th><th>Shift Tambahan</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {guruList.map(g => {
                const wali = waliKelasOf(g);
                return (
                  <tr key={g.id}>
                    <td className="font-medium">{g.nama_lengkap}<div className="text-xs text-gray-400">{g.jabatan || ''}</div></td>
                    <td>{wali.length ? <span className="badge badge-success">Wali {wali.map(k => k.nama_kelas).join(', ')}</span> : <span className="badge badge-info">Non-wali kelas</span>}</td>
                    <td className="text-xs">{wali.length ? wali.map(k => <div key={k.id}>{k.nama_kelas}: {k.jadwal?.length ? [...new Set(k.jadwal.map(j => `${DAYS[j.hari].slice(0, 3)} ${j.mulai}–${j.selesai}`))].join(', ') : <span className="text-gray-400">belum diatur</span>}</div>) : <span className="text-gray-400">-</span>}</td>
                    <td className="text-xs">{shiftsOf(g).length ? shiftsOf(g).map(s => <div key={s.id}>{shiftLabel(s)}</div>) : <span className={wali.length ? 'text-gray-400' : 'text-red-500'}>{wali.length ? '-' : 'Belum diatur'}</span>}</td>
                    <td><div className="flex justify-center"><button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Atur shift guru" onClick={() => openGuru(g)}><Users size={18} /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'shift' && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: 560 }}>
          <div className="modal-header"><h2 className="modal-title">{editingShift ? 'Edit' : 'Tambah'} Shift</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={saveShift}><div className="modal-body space-y-4">
            <div className="form-group"><label className="form-label">Nama Shift</label><input required className="input-field" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Contoh: Shift 1" /></div>
            <div className="form-group">
              <label className="form-label">Hari</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DAYS.map((d, i) => (
                  <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: form.hari.includes(i) ? '1.5px solid #10b981' : '1.5px solid #e5e7eb', backgroundColor: form.hari.includes(i) ? '#f0fdf4' : '#fff', color: form.hari.includes(i) ? '#047857' : '#6b7280' }}>
                    <input type="checkbox" checked={form.hari.includes(i)} onChange={() => toggleDay(i)} style={{ display: 'none' }} />{d}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">Jam Mulai</label><input required type="time" className="input-field" value={form.jam_mulai} onChange={e => setForm(f => ({ ...f, jam_mulai: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Jam Selesai</label><input required type="time" className="input-field" value={form.jam_selesai} onChange={e => setForm(f => ({ ...f, jam_selesai: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Zona Waktu</label><div className="input-field" style={{ backgroundColor: '#f8fafc', fontWeight: 700, color: '#047857' }}>WIB</div></div>
            </div>
            {editingShift && (editingShift.kelas?.length > 0 || editingShift.jumlah_guru > 0) && <p className="text-xs text-amber-600">Perubahan akan langsung diterapkan ke {editingShift.kelas.length} kelas dan {editingShift.jumlah_guru} guru yang memakai shift ini. Catatan absensi lama tidak berubah.</p>}
            {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}><Save size={18} /> Simpan</button>
          </div></form>
        </div></div>
      )}

      {modal === 'guru' && selectedGuru && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: 520 }}>
          <div className="modal-header"><h2 className="modal-title">Shift Guru: {selectedGuru.nama_lengkap}</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={saveGuruShift}><div className="modal-body space-y-3">
            {shifts.length === 0 ? <p className="text-sm text-gray-500">Buat shift terlebih dahulu.</p> : shifts.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: guruShiftIds.includes(s.id) ? '#f0fdf4' : '#fff' }}>
                <input type="checkbox" checked={guruShiftIds.includes(s.id)} onChange={() => setGuruShiftIds(ids => ids.includes(s.id) ? ids.filter(x => x !== s.id) : [...ids, s.id])} />
                <span className="text-sm"><strong>{s.nama}</strong> — {s.hari.map(h => DAYS[h]).join(', ')}, {s.jam_mulai}–{s.jam_selesai} {ZONES[s.zona_waktu]}</span>
              </label>
            ))}
            {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}><Save size={18} /> Simpan</button>
          </div></form>
        </div></div>
      )}
    </div>
  );
};

export default JadwalShiftPage;
