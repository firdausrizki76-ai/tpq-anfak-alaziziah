import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, X, Save, User, UserCheck, Calendar, Phone, MapPin, Loader2 } from 'lucide-react';
import { santriAPI, kelasAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const SantriPage = () => {
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  const [activeModal, setActiveModal] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [formData, setFormData] = useState({
    nomor_induk: '', nama_lengkap: '', kelas_id: '', wali_kelas_id: '',
    status: 'aktif', no_hp_wali: '', alamat: '', tanggal_lahir: '', jenis_kelamin: 'L',
    foto: null, kk: null, akte: null
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [santri, kelas] = await Promise.all([
        santriAPI.getAll().catch(() => []),
        kelasAPI.getAll().catch(() => [])
      ]);
      setSantriList(santri || []);
      setKelasList(kelas || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = (type, santri = null) => {
    setActiveModal(type);
    if (santri) {
      setSelectedSantri(santri);
      setFormData({
        nomor_induk: santri.nomor_induk || '',
        nama_lengkap: santri.nama_lengkap || '',
        kelas_id: santri.kelas_id || '',
        wali_kelas_id: santri.wali_kelas_id || '',
        status: santri.status || 'aktif',
        no_hp_wali: santri.no_hp_wali || '',
        alamat: santri.alamat || '',
        tanggal_lahir: santri.tanggal_lahir || '',
        jenis_kelamin: santri.jenis_kelamin || 'L',
        foto: null, kk: null, akte: null
      });
    } else {
      setFormData({
        nomor_induk: '', nama_lengkap: '', kelas_id: '', wali_kelas_id: '',
        status: 'aktif', no_hp_wali: '', alamat: '', tanggal_lahir: '', jenis_kelamin: 'L',
        foto: null, kk: null, akte: null
      });
    }
  };

  const closeModal = () => { setActiveModal(null); setSelectedSantri(null); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build FormData
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      if (activeModal === 'add') {
        await santriAPI.create(submitData);
      } else {
        await santriAPI.update(selectedSantri.id, submitData);
      }
      await loadData();
      closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await santriAPI.delete(selectedSantri.id);
      await loadData();
      closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleExport = () => {
    const headers = ['No', 'NIS', 'Nama', 'Kelas', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredList.map((s, i) => `${i + 1},${s.nomor_induk},${s.nama_lengkap},${s.kelas?.nama_kelas || '-'},${s.status}`)
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_santri_tpq.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredList = santriList.filter(s => {
    const matchSearch = !searchQuery || s.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) || s.nomor_induk?.includes(searchQuery);
    const matchKelas = !filterKelas || s.kelas_id === filterKelas;
    return matchSearch && matchKelas;
  });

  const getDirectGDriveLink = (link) => {
    if (!link) return null;
    
    let fileId = '';
    
    // Deteksi ID dari berbagai format link GDrive
    if (link.includes('/file/d/')) {
      fileId = link.split('/d/')[1].split('/')[0];
    } else if (link.includes('id=')) {
      fileId = link.split('id=')[1].split('&')[0];
    } else if (link.includes('drive.google.com/uc?')) {
      // Jika link sudah format uc?, ambil ID-nya saja
      const urlObj = new URL(link);
      fileId = urlObj.searchParams.get('id');
    }

    if (fileId) {
      // Kita gunakan format lh3 dengan tambahan parameter size agar lebih cepat di-load
      return `https://lh3.googleusercontent.com/d/${fileId}=s400`;
    }
    
    return link;
  };

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6 flex justify-between items-center">
        <div>
          <h1 className="page-title">Data Santri</h1>
          <p className="page-subtitle">Kelola data seluruh santri TPQ Anfak Al Azizah</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('add')}>
          <Plus size={18} /> Tambah Santri
        </button>
      </div>

      <div className="card w-full">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1">
            <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
              <Search className="icon" size={18} />
              <input type="text" className="input-field" placeholder="Cari nama atau NIS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="input-with-icon">
              <Filter className="icon" size={18} />
              <select className="input-field" style={{ paddingLeft: '40px' }} value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" style={{ backgroundColor: 'white', color: 'var(--color-primary-container)', border: '1px solid var(--color-surface-container-highest)', borderBottom: '2px solid var(--color-gold)' }} onClick={handleExport}>
            <Download size={18} /> Export Data
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>No</th><th>NIS</th><th>Nama Lengkap</th><th>Kelas</th><th>Status</th><th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan="6" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data santri</td></tr>
              ) : filteredList.map((santri, index) => (
                <tr key={santri.id}>
                  <td>{index + 1}</td>
                  <td>{santri.nomor_induk}</td>
                  <td className="font-medium">{santri.nama_lengkap}</td>
                  <td>{santri.kelas?.nama_kelas || '-'}</td>
                  <td>
                    <span className={`badge ${santri.status === 'aktif' ? 'badge-success' : ''}`} style={santri.status !== 'aktif' ? { backgroundColor: '#f1f5f9', color: '#64748b' } : {}}>
                      {santri.status}
                    </span>
                  </td>
                  <td className="flex justify-center gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" onClick={() => openModal('view', santri)}><Eye size={18} /></button>
                    <button className="p-2 text-orange-600 hover:bg-orange-50 rounded" onClick={() => openModal('edit', santri)}><Edit size={18} /></button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded" onClick={() => openModal('delete', santri)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{activeModal === 'add' ? 'Tambah Santri Baru' : 'Edit Data Santri'}</h2>
              <X className="modal-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">NIS</label>
                    <input type="text" name="nomor_induk" value={formData.nomor_induk} onChange={handleInputChange} className="input-field" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} className="input-field" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kelas</label>
                    <select name="kelas_id" value={formData.kelas_id} onChange={handleInputChange} className="input-field" required>
                      <option value="">Pilih Kelas</option>
                      {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jenis Kelamin</label>
                    <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} className="input-field">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal Lahir</label>
                    <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. HP Wali</label>
                    <input type="text" name="no_hp_wali" value={formData.no_hp_wali} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="input-field">
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                      <option value="lulus">Lulus</option>
                      <option value="pindah">Pindah</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alamat</label>
                    <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} className="input-field" rows="2" style={{ resize: 'none' }}></textarea>
                  </div>
                  
                  {/* File Uploads */}
                  <div className="col-span-2 pt-4 mt-2 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Upload Dokumen (Opsional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="form-group">
                        <label className="form-label text-sm">Pas Foto (Max 5MB)</label>
                        <input type="file" name="foto" accept="image/*" onChange={handleFileChange} className="input-field p-2 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="form-group">
                        <label className="form-label text-sm">Scan KK (Max 5MB)</label>
                        <input type="file" name="kk" accept="image/*,application/pdf" onChange={handleFileChange} className="input-field p-2 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="form-group">
                        <label className="form-label text-sm">Scan Akte Kelahiran</label>
                        <input type="file" name="akte" accept="image/*,application/pdf" onChange={handleFileChange} className="input-field p-2 border border-gray-300 rounded text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
                <button 
                  type="submit" 
                  className={`btn-primary ${saving ? 'opacity-80 cursor-wait' : ''}`} 
                  disabled={saving}
                  style={saving ? { background: 'linear-gradient(90deg, var(--color-primary) 0%, #1a4d2e 100%)', animation: 'pulse 2s infinite' } : {}}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      <span>Menyimpan & Upload...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      <span>Simpan Data</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {activeModal === 'view' && selectedSantri && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Detail Santri</h2>
              <X className="modal-close" onClick={closeModal} />
            </div>
            <div className="modal-body">
              <div className="flex flex-col items-center mb-6">
                {selectedSantri.foto_url ? (
                  <img 
                    src={getDirectGDriveLink(selectedSantri.foto_url)} 
                    alt="Foto Santri" 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gold mb-3 shadow-sm" 
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3"><User size={48} /></div>
                )}
                
                {/* Fallback link untuk foto jika gambar pecah */}
                {selectedSantri.foto_url && (
                  <a href={selectedSantri.foto_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline mb-2">
                    Buka Foto Asli ↗
                  </a>
                )}
                
                <h3 className="text-xl font-bold text-gray-800">{selectedSantri.nama_lengkap}</h3>
                <p className="text-gray-500">{selectedSantri.nomor_induk}</p>
                <span className={`mt-2 badge ${selectedSantri.status === 'aktif' ? 'badge-success' : ''}`}>{selectedSantri.status}</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <UserCheck size={20} className="text-gray-400" />
                    <div><p className="text-xs text-gray-500">Kelas</p><p className="font-medium text-gray-800">{selectedSantri.kelas?.nama_kelas || '-'}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={20} className="text-gray-400" />
                    <div><p className="text-xs text-gray-500">Tanggal Lahir</p><p className="font-medium text-gray-800">{selectedSantri.tanggal_lahir || '-'}</p></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={20} className="text-gray-400" />
                  <div><p className="text-xs text-gray-500">No. HP Wali</p><p className="font-medium text-gray-800">{selectedSantri.no_hp_wali || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin size={20} className="text-gray-400" />
                  <div><p className="text-xs text-gray-500">Alamat</p><p className="font-medium text-gray-800">{selectedSantri.alamat || '-'}</p></div>
                </div>

                {/* Dokumen Section */}
                {(selectedSantri.kk_url || selectedSantri.akte_url) && (
                  <div className="pt-4 border-t border-gray-100 mt-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dokumen Lampiran</h4>
                    <div className="flex flex-col gap-2">
                      {selectedSantri.kk_url && (
                        <a href={selectedSantri.kk_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-all border border-blue-100">
                          <span className="flex items-center gap-2 font-medium"><Download size={16} /> Kartu Keluarga</span>
                          <Eye size={16} />
                        </a>
                      )}
                      {selectedSantri.akte_url && (
                        <a href={selectedSantri.akte_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-all border border-emerald-100">
                          <span className="flex items-center gap-2 font-medium"><Download size={16} /> Akte Kelahiran</span>
                          <Eye size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={closeModal}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {activeModal === 'delete' && selectedSantri && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header border-none">
              <h2 className="modal-title">Hapus Santri</h2>
              <X className="modal-close" onClick={closeModal} />
            </div>
            <div className="modal-body text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
              <p className="text-gray-600 mb-2">Apakah Anda yakin ingin menghapus data santri ini?</p>
              <p className="font-bold text-gray-800 text-lg">{selectedSantri.nama_lengkap}</p>
              <p className="text-sm text-gray-400 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="modal-footer border-none pt-0">
              <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
              <button className="btn-primary" style={{ backgroundColor: '#dc2626' }} onClick={handleDelete} disabled={saving}>
                {saving ? 'Menghapus...' : 'Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SantriPage;
