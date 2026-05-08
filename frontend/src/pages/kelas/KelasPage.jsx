import React, { useState, useEffect } from 'react';
import { Search, Edit, X, Save, Download, Users, ArrowUpRight, BookOpen, User, Loader2 } from 'lucide-react';
import { kelasAPI, guruAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const KelasPage = () => {
  const [kelasList, setKelasList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [santriInKelas, setSantriInKelas] = useState([]);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [formData, setFormData] = useState({ deskripsi: '', wali_kelas_id: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { 
      const [data, guruData] = await Promise.all([
        kelasAPI.getAll().catch(() => []),
        guruAPI.getAll().catch(() => [])
      ]);
      setKelasList(data || []); 
      setGuruList(guruData || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openViewSantri = async (kelas) => {
    setSelectedKelas(kelas); setActiveModal('view_santri'); setLoadingSantri(true);
    try { const data = await kelasAPI.getSantri(kelas.id); setSantriInKelas(data || []); } catch (e) { console.error(e); setSantriInKelas([]); }
    setLoadingSantri(false);
  };

  const openEdit = (kelas) => {
    setSelectedKelas(kelas); setFormData({ deskripsi: kelas.deskripsi || '', wali_kelas_id: kelas.wali_kelas_id || '' }); setActiveModal('edit');
  };

  const closeModal = () => { setActiveModal(null); setSelectedKelas(null); setSantriInKelas([]); };
  const handleInputChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await kelasAPI.update(selectedKelas.id, formData); await loadData(); closeModal(); } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleExport = () => {
    const csv = ['Urutan,Kode,Nama,Jumlah Santri', ...kelasList.map(k => `${k.urutan},${k.kode_kelas},${k.nama_kelas},${k.jumlah_santri||0}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'data_kelas_tpq.csv'; a.click();
  };

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center">
        <div><h1 className="page-title">Data Kelas</h1><p className="page-subtitle">Manajemen kelas dan rombongan belajar (18 level Qiraati)</p></div>
      </div>

      <div className="card w-full">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
            <Search className="icon" size={18} />
            <input type="text" className="input-field" placeholder="Cari nama kelas..." />
          </div>
          <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={handleExport}>
            <Download size={18} /> Export Data
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>Urutan</th><th>Kode Kelas</th><th>Nama Kelas</th><th>Wali Kelas</th><th>Jumlah Santri</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : kelasList.map(kelas => (
                <tr key={kelas.id}>
                  <td>{kelas.urutan}</td><td>{kelas.kode_kelas}</td><td className="font-medium">{kelas.nama_kelas}</td>
                  <td>{kelas.wali_kelas?.nama_lengkap || '-'}</td>
                  <td>{kelas.jumlah_santri || 0} Santri</td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Lihat Santri" onClick={() => openViewSantri(kelas)}><Users size={18} /></button>
                      <button className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Edit Kelas" onClick={() => openEdit(kelas)}><Edit size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal === 'edit' && selectedKelas && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header"><h2 className="modal-title">Edit Kelas: {selectedKelas.nama_kelas}</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={handleSubmit}><div className="modal-body space-y-4">
            <div className="form-group">
              <label className="form-label">Wali Kelas</label>
              <select name="wali_kelas_id" value={formData.wali_kelas_id} onChange={handleInputChange} className="input-field">
                <option value="">-- Pilih Wali Kelas --</option>
                {guruList.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Deskripsi</label><textarea name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} className="input-field" rows="3" style={{ resize: 'none' }}></textarea></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}><Save size={18} /> Simpan</button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'view_santri' && selectedKelas && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><BookOpen size={24} /></div>
              <div><h2 className="modal-title">Daftar Santri - {selectedKelas.nama_kelas}</h2><p className="text-xs text-gray-500">{selectedKelas.jumlah_santri || 0} santri terdaftar</p></div>
            </div>
            <X className="modal-close" onClick={closeModal} />
          </div>
          <div className="modal-body">
            {loadingSantri ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
            : santriInKelas.length === 0 ? <p className="text-center text-gray-400 py-8">Belum ada santri di kelas ini</p>
            : <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {santriInKelas.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 border"><User size={16} /></div>
                    <div><p className="text-sm font-medium text-gray-800">{s.nama_lengkap}</p><p className="text-xs text-gray-400">NIS: {s.nomor_induk}</p></div>
                  </div>
                  <span className="badge badge-success text-[10px] py-1 px-2">{s.status}</span>
                </div>
              ))}
            </div>}
          </div>
          <div className="modal-footer"><button className="btn-primary" onClick={closeModal}>Tutup</button></div>
        </div></div>
      )}
    </div>
  );
};

export default KelasPage;
