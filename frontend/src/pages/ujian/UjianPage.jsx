import React, { useState, useEffect } from 'react';
import { Search, Filter, Award, ArrowRight, Save, X, Calendar, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { ujianAPI, kelasAPI, santriAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const UjianPage = () => {
  const [examData, setExamData] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [selectedSantriIds, setSelectedSantriIds] = useState([]);
  const [nextKelas, setNextKelas] = useState('');
  const [nextKelasId, setNextKelasId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [regSearchQuery, setRegSearchQuery] = useState('');
  const [regFilterKelas, setRegFilterKelas] = useState('');
  const [formData, setFormData] = useState({ nilai: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0], hasil: 'lulus' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ujian, kelas] = await Promise.all([ujianAPI.getAll().catch(() => []), kelasAPI.getAll().catch(() => [])]);
      setExamData(ujian || []); setKelasList(kelas || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = async (type, item) => {
    setSelectedSantri(item);
    if (type === 'register_exam') {
      setLoading(true);
      try {
        const data = await santriAPI.getAll();
        setSantriList(data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    if (type === 'promotion_confirm' && item.santri?.kelas) {
      const currentUrutan = item.santri.kelas.urutan;
      const nextK = kelasList.find(k => k.urutan === currentUrutan + 1);
      setNextKelas(nextK ? nextK.nama_kelas : 'ALUMNI / LULUS');
      setNextKelasId(nextK ? nextK.id : '');
    }
    setActiveModal(type);
  };

  const closeModal = () => { 
    setActiveModal(null); 
    setSelectedSantri(null); 
    setSelectedSantriIds([]);
    setNextKelas(''); 
    setFormData({ nilai: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0], hasil: 'lulus' }); 
  };

  const handleInputChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleToggleSantri = (id) => {
    setSelectedSantriIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleRegisterExam = async () => {
    if (selectedSantriIds.length === 0) return;
    setSaving(true);
    try {
      await ujianAPI.register({ santri_ids: selectedSantriIds });
      await loadData();
      closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await ujianAPI.inputNilai({ santri_id: selectedSantri.santri_id, kelas_dari_id: selectedSantri.kelas_id, nilai_tes: parseInt(formData.nilai), status_tes: formData.hasil, catatan: formData.keterangan });
      await loadData(); 
      
      // Jika lulus, langsung tawarkan naik kelas
      if (formData.hasil === 'lulus') {
        openModal('promotion_confirm', selectedSantri);
      } else {
        closeModal();
      }
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handlePromotionConfirm = async () => {
    setSaving(true);
    try {
      await ujianAPI.naikKelas({ santri_id: selectedSantri.santri_id, kelas_dari_id: selectedSantri.kelas_id, kelas_ke_id: nextKelasId });
      await loadData(); closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const getStatus = (item) => {
    const pct = item.target_hari > 0 ? (item.aktual_hari / item.target_hari) * 100 : 0;
    if (pct >= 100) return 'Siap Ujian';
    return 'Belajar';
  };

  const filteredExam = examData.filter(item => !searchQuery || item.santri?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredReg = santriList.filter(s => {
    const matchesSearch = !regSearchQuery || s.nama_lengkap?.toLowerCase().includes(regSearchQuery.toLowerCase()) || s.nomor_induk?.includes(regSearchQuery);
    const matchesKelas = !regFilterKelas || s.kelas_id === regFilterKelas;
    const isNotAlreadyInExam = !examData.some(e => e.santri_id === s.id && getStatus(e) === 'Siap Ujian');
    return matchesSearch && matchesKelas && isNotAlreadyInExam && s.status === 'aktif';
  });

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center">
        <div><h1 className="page-title">Ujian & Kenaikan Kelas</h1><p className="page-subtitle">Kelola evaluasi akhir jilid dan kenaikan tingkat santri</p></div>
        <button className="btn-primary" onClick={() => openModal('register_exam')}><Plus size={18} /> Daftarkan Ujian</button>
      </div>

      <div className="card w-full">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
            <Search className="icon" size={18} />
            <input type="text" className="input-field" placeholder="Cari nama santri..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>No</th><th>Nama Santri</th><th>Kelas</th><th>Masa Tempuh</th><th>Target</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {loading && !activeModal ? <tr><td colSpan="7" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : filteredExam.length === 0 ? <tr><td colSpan="7" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data pencapaian</td></tr>
              : filteredExam.map((item, i) => {
                const status = getStatus(item);
                const pct = item.target_hari > 0 ? Math.min((item.aktual_hari / item.target_hari) * 100, 100) : 0;
                return (
                  <tr key={item.id}>
                    <td>{i+1}</td>
                    <td className="font-medium">{item.santri?.nama_lengkap || '-'}</td>
                    <td><span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{item.santri?.kelas?.nama_kelas || item.kelas?.nama_kelas || '-'}</span></td>
                    <td>
                      <span className="font-bold">{item.aktual_hari || 0} Hari</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div className={`h-full ${pct >= 100 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </td>
                    <td className="text-gray-500">{item.target_hari || 60} Hari</td>
                    <td>
                      {status === 'Siap Ujian' && <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Siap Ujian</span>}
                      {status === 'Belajar' && <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>Belajar</span>}
                    </td>
                    <td className="text-center">
                      {status === 'Siap Ujian' && <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 mx-auto font-medium" onClick={() => openModal('input_nilai', item)}><Award size={18} /> Input Nilai</button>}
                      {status === 'Belajar' && <span className="text-gray-400 text-sm italic">Proses Belajar</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal === 'register_exam' && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '600px' }}>
          <div className="modal-header"><h2 className="modal-title">Daftarkan Peserta Ujian</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body">
            <div className="flex gap-2 mb-4">
              <div className="input-with-icon flex-1">
                <Search className="icon" size={16} />
                <input type="text" className="input-field text-sm" placeholder="Cari nama santri..." value={regSearchQuery} onChange={(e) => setRegSearchQuery(e.target.value)} />
              </div>
              <select className="input-field text-sm" style={{ width: '150px' }} value={regFilterKelas} onChange={(e) => setRegFilterKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
            </div>
            <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-xl">
              <table className="data-table w-full text-sm">
                <thead className="sticky top-0 bg-white shadow-sm"><tr><th width="40">Pilih</th><th>Nama Santri</th><th>Kelas</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="3" className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto" /></td></tr>
                  : filteredReg.length === 0 ? <tr><td colSpan="3" className="text-center py-8 text-gray-400">Tidak ada santri ditemukan</td></tr>
                  : filteredReg.map(s => (
                    <tr key={s.id} onClick={() => handleToggleSantri(s.id)} className="cursor-pointer hover:bg-blue-50">
                      <td className="text-center"><input type="checkbox" checked={selectedSantriIds.includes(s.id)} onChange={() => {}} /></td>
                      <td className="font-medium">{s.nama_lengkap}</td>
                      <td>{s.kelas?.nama_kelas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} /> <span>{selectedSantriIds.length} santri terpilih untuk didaftarkan ujian.</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button className="btn-primary" onClick={handleRegisterExam} disabled={saving || selectedSantriIds.length === 0}>{saving ? 'Mendaftarkan...' : 'Daftarkan Sekarang'}</button>
          </div>
        </div></div>
      )}

      {activeModal === 'input_nilai' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header"><h2 className="modal-title">Input Hasil Ujian</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={handleSubmitScore}><div className="modal-body">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold shadow-sm">{(selectedSantri.santri?.nama_lengkap || '?').charAt(0)}</div>
              <div><h4 className="font-bold text-gray-800">{selectedSantri.santri?.nama_lengkap}</h4><p className="text-xs text-blue-600">Ujian Kenaikan {selectedSantri.santri?.kelas?.nama_kelas || selectedSantri.kelas?.nama_kelas}</p></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group"><label className="form-label">Skor Ujian (0-100)</label><input type="number" name="nilai" className="input-field" value={formData.nilai} onChange={handleInputChange} required /></div>
                <div className="form-group"><label className="form-label">Hasil</label><select name="hasil" className="input-field" value={formData.hasil} onChange={handleInputChange}><option value="lulus">Lulus</option><option value="remidi">Remedi</option></select></div>
              </div>
              <div className="form-group"><label className="form-label">Catatan</label><textarea name="keterangan" className="input-field" rows="3" style={{ resize: 'none' }} value={formData.keterangan} onChange={handleInputChange}></textarea></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Hasil'}</button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'promotion_confirm' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '400px' }}>
          <div className="modal-header border-none"><h2 className="modal-title">Konfirmasi Kenaikan</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4"><Award size={40} /></div>
            <p className="text-gray-600 mb-4">Ujian Selesai! Naikkan santri ini sekarang?</p>
            <div className="flex items-center justify-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-center"><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">DARI</p><span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{selectedSantri.santri?.kelas?.nama_kelas || selectedSantri.kelas?.nama_kelas}</span></div>
              <ArrowRight className="text-emerald-500" size={24} />
              <div className="text-center"><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">KE</p><span className="badge badge-success">{nextKelas}</span></div>
            </div>
            <h4 className="font-bold text-gray-800 mt-4">{selectedSantri.santri?.nama_lengkap}</h4>
          </div>
          <div className="modal-footer border-none pt-0">
            <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Nanti Saja</button>
            <button className="btn-primary" style={{ backgroundColor: '#10b981' }} onClick={handlePromotionConfirm} disabled={saving}>{saving ? 'Memproses...' : 'Ya, Naikkan Sekarang'}</button>
          </div>
        </div></div>
      )}
    </div>
  );
};

export default UjianPage;
