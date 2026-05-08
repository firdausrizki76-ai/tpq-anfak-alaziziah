import React, { useState, useEffect } from 'react';
import { Save, Building, Phone, Mail, Lock, User, CheckCircle, Loader2 } from 'lucide-react';
import { pengaturanAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const PengaturanPage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    nama_lembaga: '', alamat: '', no_telepon: '', email: '', nominal_syahriah: '50000', tahun_ajaran: ''
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await pengaturanAPI.get();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch (e) { console.error(e); }
    setLoading(false);
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

  if (loading) return <div className="flex items-center justify-center" style={{ minHeight: '300px' }}><Loader2 size={32} className="animate-spin" /></div>;

  return (
    <div className="flex-col gap-6 w-full">
      <div className="page-header mb-6">
        <h1 className="page-title">Pengaturan Sistem</h1>
        <p className="page-subtitle">Konfigurasi data institusi dan preferensi aplikasi</p>
      </div>

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

        <div className="space-y-6">
          <div className="card w-full">
            <h3 className="font-bold text-lg text-[var(--color-primary-container)] mb-6 border-b pb-4 flex items-center gap-2">
              <User size={20} className="text-gold" /> Akun Admin
            </h3>
            
            <form className="space-y-4">
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-with-icon w-full">
                  <User className="icon" size={18} />
                  <input type="text" className="input-field w-full" defaultValue="admin_utama" disabled />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Kata Sandi Baru</label>
                <div className="input-with-icon w-full">
                  <Lock className="icon" size={18} />
                  <input type="password" className="input-field w-full" placeholder="••••••••" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Kata Sandi</label>
                <div className="input-with-icon w-full">
                  <Lock className="icon" size={18} />
                  <input type="password" className="input-field w-full" placeholder="••••••••" />
                </div>
              </div>

              <button type="button" className="btn-primary w-full justify-center bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 mt-2">
                Update Kata Sandi
              </button>
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
      </div>
    </div>
  );
};

export default PengaturanPage;
