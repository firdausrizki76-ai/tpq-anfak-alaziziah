import React, { useState, useEffect } from 'react';
import { 
  Award, CheckCircle2, Calendar, BookOpen, User, 
  Plus, Loader2, Sparkles, AlertCircle, RefreshCw, Trash2, ArrowRight
} from 'lucide-react';
import { prestasiAPI, kelasAPI, santriAPI, pengaturanAPI } from '../../services/api';
import MateriPicker from '../../components/MateriPicker';
import { composeMateri } from '../../utils/materi';
import { PROGRES_OPTIONS, progresInfo } from '../../utils/progres';

const TeacherPrestasiPage = () => {
  const [kelasList, setKelasList] = useState([]);
  const [allSantri, setAllSantri] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [kategoriList, setKategoriList] = useState([
    'Qiraati', 'Doa & Tachfid'
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');

  const [form, setForm] = useState({
    santri_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Qiraati',
    materi_pilih: [],
    materi_lain: '',
    halaman_ayat: '',
    nilai: 'A (Sangat Lancar)',
    status: 'lanjut',
    catatan: ''
  });

  useEffect(() => {
    loadClasses();
    loadTodayPrestasi();
    loadKategori();
  }, []);

  const loadKategori = async () => {
    try {
      const settings = await pengaturanAPI.get();
      if (settings?.kategori_prestasi) {
        const parsed = JSON.parse(settings.kategori_prestasi);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setKategoriList(parsed);
          setForm(prev => ({ ...prev, kategori: parsed.includes(prev.kategori) ? prev.kategori : parsed[0] }));
        }
      }
    } catch (_) {}
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const [kelas, santri] = await Promise.all([kelasAPI.getAll(), santriAPI.getAll({ status: 'aktif' })]);
      setKelasList(kelas || []);
      setAllSantri(santri || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Guru wali kelas hanya melihat santri kelasnya; guru lain (non-wali) melihat semua santri aktif.
  const myClassIds = kelasList.filter(k => k.wali_kelas_id === user.id || k.wali_kelas?.id === user.id).map(k => k.id);
  const santriList = (myClassIds.length ? allSantri.filter(s => myClassIds.includes(s.kelas_id)) : allSantri)
    .slice().sort((x, y) => (x.nama_lengkap || '').localeCompare(y.nama_lengkap || ''));
  const chosenSantri = allSantri.find(s => s.id === form.santri_id);
  const chosenKelas = kelasList.find(k => k.id === chosenSantri?.kelas_id);

  const loadTodayPrestasi = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await prestasiAPI.getAll({ tanggal: today, guru_id: user.id });
      setTodayRecords(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.santri_id) {
      alert('Pilih santri terlebih dahulu.');
      return;
    }
    const jilid_surat = composeMateri(form.materi_pilih, form.materi_lain);
    if (!jilid_surat) {
      alert('Pilih atau ketik minimal satu materi.');
      return;
    }

    setSubmitting(true);
    try {
      const { materi_pilih: _p, materi_lain: _l, ...payload } = form;
      await prestasiAPI.create({
        ...payload,
        jilid_surat,
        guru_id: user.id
      });
      setSuccessMsg('Alhamdulillah! Catatan prestasi santri berhasil disimpan.');
      setTimeout(() => setSuccessMsg(''), 4000);
      
      // Reset form specific fields while keeping santri selected or switching
      setForm(prev => ({
        ...prev,
        materi_pilih: [],
        materi_lain: '',
        halaman_ayat: '',
        catatan: ''
      }));

      loadTodayPrestasi();
    } catch (e) {
      alert('Gagal menyimpan prestasi: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus catatan prestasi ini?')) return;
    try {
      await prestasiAPI.delete(id);
      loadTodayPrestasi();
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
  };

  return (
    <div style={{ padding: '16px' }} className="space-y-4">
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
        color: 'white',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 14px rgba(6, 78, 59, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '10px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={26} color="#fbbf24" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Input Prestasi Santri</h1>
            <p style={{ fontSize: '11px', color: '#a7f3d0', margin: '2px 0 0 0' }}>
              Catat mutaba'ah harian, kelancaran Qiraati, dan hafalan surat
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 16px',
          borderRadius: '14px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM INPUT PRESTASI HARIAN */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} color="#059669" /> Formulir Harian Santri
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Pilih Kelas & Tanggal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Kelas (otomatis)
              </label>
              <div style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: 'bold',
                color: chosenKelas ? '#064e3b' : '#94a3b8',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box'
              }}>
                {chosenKelas ? chosenKelas.nama_kelas : 'Otomatis dari santri'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Tanggal
              </label>
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm(prev => ({ ...prev, tanggal: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Pilih Santri */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
              Nama Santri <span style={{ color: '#e11d48' }}>*</span>
            </label>
            <select
              value={form.santri_id}
              onChange={(e) => setForm(prev => ({ ...prev, santri_id: e.target.value, materi_pilih: [] }))}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #059669',
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#064e3b',
                backgroundColor: '#f0fdf4'
              }}
            >
              <option value="">-- Pilih Santri ({santriList.length} Anak) --</option>
              {santriList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nama_lengkap} ({kelasList.find(k => k.id === s.kelas_id)?.nama_kelas || '-'})
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Prestasi */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Bidang / Kategori
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {kategoriList.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, kategori: cat, materi_pilih: [] }))}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: form.kategori === cat ? '1px solid #059669' : '1px solid #e2e8f0',
                    backgroundColor: form.kategori === cat ? '#dcfce7' : '#f8fafc',
                    color: form.kategori === cat ? '#064e3b' : '#64748b',
                    fontSize: '11px',
                    fontWeight: form.kategori === cat ? 'bold' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Materi (dari template kelas) */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Materi / Jilid / Surat <span style={{ color: '#e11d48' }}>*</span> <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>(boleh pilih lebih dari satu)</span>
            </label>
            <MateriPicker
              kelasId={chosenKelas?.id || ''}
              kategori={form.kategori}
              selected={form.materi_pilih}
              custom={form.materi_lain}
              onChange={({ selected, custom }) => setForm(prev => ({ ...prev, materi_pilih: selected, materi_lain: custom }))}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
              Halaman / Ayat
            </label>
            <input
              type="text"
              placeholder="Hal 14 / Ayat 1-10"
              value={form.halaman_ayat}
              onChange={(e) => setForm(prev => ({ ...prev, halaman_ayat: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Nilai & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Nilai / Tingkat Kelancaran
              </label>
              <select
                value={form.nilai}
                onChange={(e) => setForm(prev => ({ ...prev, nilai: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="A (Sangat Lancar)">A (Sangat Lancar / Mumtaz)</option>
                <option value="B (Lancar)">B (Lancar / Jayyid)</option>
                <option value="C (Cukup Lancar)">C (Cukup / Maqbul)</option>
                <option value="D (Mengulang)">D (Mengulang / Rasib)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Status Progres
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: progresInfo(form.status)?.color || '#0f172a',
                  backgroundColor: '#ffffff'
                }}
              >
                {PROGRES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.long}</option>)}
              </select>
            </div>
          </div>

          {/* Catatan / Pesan untuk Orang Tua */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
              Catatan / Evaluasi Ustadz
            </label>
            <input
              type="text"
              placeholder="Contoh: Makhraj huruf 'Ain bagus, perbaiki mad thobi'i di rumah"
              value={form.catatan}
              onChange={(e) => setForm(prev => ({ ...prev, catatan: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px',
              borderRadius: '14px',
              backgroundColor: '#059669',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              marginTop: '4px'
            }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {submitting ? 'Menyimpan...' : 'Simpan Catatan Prestasi Santri'}
          </button>
        </form>
      </div>

      {/* DAFTAR INPUTAN HARI INI */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Input Prestasi Hari Ini ({todayRecords.length})
          </h3>
          <button
            type="button"
            onClick={loadTodayPrestasi}
            style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>

        {todayRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 8px', color: '#94a3b8', fontSize: '12px' }}>
            Belum ada catatan prestasi yang diinputkan hari ini.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {todayRecords.map(item => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                    {item.santri?.nama_lengkap || '-'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600', marginTop: '2px' }}>
                    {item.kategori} &bull; {item.jilid_surat} {item.halaman_ayat ? `(${item.halaman_ayat})` : ''}
                  </div>
                  {item.catatan && (
                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                      "{item.catatan}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {progresInfo(item.status) && (
                    <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '8px', backgroundColor: progresInfo(item.status).bg, color: progresInfo(item.status).color }}>
                      {progresInfo(item.status).label}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                    {item.nilai || '-'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherPrestasiPage;
