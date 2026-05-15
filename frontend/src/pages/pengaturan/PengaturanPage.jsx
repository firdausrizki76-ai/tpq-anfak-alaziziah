import React, { useState, useEffect } from 'react';
import { Save, Building, Phone, Mail, Lock, User, CheckCircle, Loader2, Users, Plus, Trash2, Edit, X } from 'lucide-react';
import { pengaturanAPI, userAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const PengaturanPage = () => {
  const [activeTab, setActiveTab] = useState('profil');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    nama_lembaga: '', alamat: '', no_telepon: '', email: '', nominal_syahriah: '50000', tahun_ajaran: ''
  });

  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    nama_lengkap: '', username: '', password: '', role: 'admin'
  });

  useEffect(() => { 
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await pengaturanAPI.get();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const data = await userAPI.getAll();
      setUsers(data || []);
    } catch (e) { console.error(e); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await pengaturanAPI.save(settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) { alert(e.message); }
    setIsSaving(false);
  };

  const handleOpenUserModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setUserFormData({
        nama_lengkap: user.nama_lengkap,
        username: user.username,
        password: user.password,
        role: user.role
      });
    } else {
      setSelectedUser(null);
      setUserFormData({
        nama_lengkap: '',
        username: '',
        password: '',
        role: 'admin'
      });
    }
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (selectedUser) {
        await userAPI.update(selectedUser.id, userFormData);
      } else {
        await userAPI.create(userFormData);
      }
      await loadUsers();
      setShowUserModal(false);
    } catch (e) { alert(e.message); }
    setIsSaving(false);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Yakin ingin menghapus akun ini?')) return;
    try {
      await userAPI.delete(id);
      await loadUsers();
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="flex items-center justify-center" style={{ minHeight: '300px' }}><Loader2 size={32} className="animate-spin" /></div>;

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6">
        <h1 className="page-title">Pengaturan Sistem</h1>
        <p className="page-subtitle">Konfigurasi data institusi dan manajemen akun pengelola</p>
      </div>

      {/* Tab Switcher - Pill Style */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'profil', label: 'Profil Lembaga', icon: <Building size={16} /> },
          { id: 'akun', label: 'Manajemen Akun', icon: <Users size={16} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '10px 20px', 
                borderRadius: '24px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                border: isActive ? '1px solid #059669' : '1px solid #e2e8f0',
                backgroundColor: isActive ? '#ecfdf5' : 'white',
                color: isActive ? '#059669' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'profil' ? (
        <div className="grid grid-2-cols gap-6 items-start">
          <div className="card w-full">
            <h3 className="font-bold text-lg text-[var(--color-primary-container)] mb-6 border-b pb-4 flex items-center gap-2">
              <Building size={20} className="text-gold" /> Profil TPQ
            </h3>
            
            <form onSubmit={handleSave} className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Nama Lembaga</label>
                <div className="input-with-icon w-full">
                  <Building className="icon" size={18} />
                  <input type="text" name="nama_lembaga" className="input-field w-full" value={settings.nama_lembaga} onChange={handleChange} />
                </div>
              </div>
              
              <div className="form-group mt-4">
                <label className="form-label">Alamat Lengkap</label>
                <textarea name="alamat" className="input-field w-full" rows="3" style={{ resize: 'none' }} value={settings.alamat} onChange={handleChange}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="form-group">
                  <label className="form-label">Nomor Telepon</label>
                  <div className="input-with-icon w-full">
                    <Phone className="icon" size={18} />
                    <input type="text" name="no_telepon" className="input-field w-full" value={settings.no_telepon} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Utama</label>
                  <div className="input-with-icon w-full">
                    <Mail className="icon" size={18} />
                    <input type="email" name="email" className="input-field w-full" value={settings.email} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4">
                <div className="form-group">
                  <label className="form-label">Nominal Syahriah (Rp)</label>
                  <input type="number" name="nominal_syahriah" className="input-field w-full" value={settings.nominal_syahriah} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Ajaran</label>
                  <input type="text" name="tahun_ajaran" className="input-field w-full" value={settings.tahun_ajaran} onChange={handleChange} placeholder="2025/2026" />
                </div>
              </div>

              <div className="flex justify-end mt-6 gap-3 items-center">
                {showSuccess && (
                  <span className="text-emerald-600 text-sm flex items-center gap-1 font-medium">
                    <CheckCircle size={16} /> Berhasil disimpan
                  </span>
                )}
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><Save size={18} /> Simpan Perubahan</>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="card w-full bg-blue-50 border-blue-100">
            <h4 className="font-bold text-blue-800 mb-2">Pusat Bantuan</h4>
            <p className="text-sm text-blue-600 mb-4">Jika Anda mengalami kendala pada sistem, hubungi tim teknis kami.</p>
            <button className="btn-primary w-full justify-center bg-blue-600 hover:bg-blue-700">
              Hubungi Support
            </button>
          </div>
        </div>
      ) : (
        <div className="card w-full">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-bold text-lg text-[var(--color-primary-container)] flex items-center gap-2">
              <Users size={20} className="text-gold" /> Manajemen Akun Pengelola
            </h3>
            <button className="btn-primary py-2 px-4 text-sm" onClick={() => handleOpenUserModal()}>
              <Plus size={16} /> Tambah Akun
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Lengkap</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400 italic">Belum ada akun tambahan. Admin utama menggunakan rincian di database pengaturan.</td>
                  </tr>
                ) : (
                  users.map((user, idx) => (
                    <tr key={user.id}>
                      <td>{idx + 1}</td>
                      <td className="font-bold">{user.nama_lengkap}</td>
                      <td>{user.username}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-success' : 'badge-primary'}`} style={user.role === 'kepala' ? { backgroundColor: '#e0f2fe', color: '#0369a1' } : {}}>
                          {user.role === 'admin' ? 'Admin' : 'Kepala Lembaga'}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors" onClick={() => handleOpenUserModal(user)}><Edit size={16} /></button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDeleteUser(user.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedUser ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
              <X className="modal-close" onClick={() => setShowUserModal(false)} />
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    value={userFormData.nama_lengkap} 
                    onChange={(e) => setUserFormData({...userFormData, nama_lengkap: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    value={userFormData.username} 
                    onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="text" 
                    className="input-field w-full" 
                    value={userFormData.password} 
                    onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select 
                    className="input-field w-full" 
                    value={userFormData.role} 
                    onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                  >
                    <option value="admin">Admin</option>
                    <option value="kepala">Kepala Lembaga</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">* Role Kepala Lembaga tidak dapat melihat menu Tabungan dan Pembayaran.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-primary bg-gray-100 text-gray-500" onClick={() => setShowUserModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PengaturanPage;
