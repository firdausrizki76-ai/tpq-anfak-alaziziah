import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, QrCode, BookOpen, CheckCircle, Loader2, Lock, X, Save } from 'lucide-react';
import { absensiAPI, kelasAPI, authAPI } from '../../services/api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [guru, setGuru] = useState(null);
  const [stats, setStats] = useState({ hadir: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('tpq_user'));
    setGuru(userData);
    if (userData) {
      loadStats(userData);
    }
  }, []);

  const loadStats = async (userData) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [absensiRes, kelasSantri] = await Promise.all([
        absensiAPI.getAll({ tanggal: today }),
        userData.kelas_id ? kelasAPI.getSantri(userData.kelas_id) : Promise.resolve([])
      ]);

      const totalSiswa = kelasSantri?.length || 0;
      const hadirSiswa = (absensiRes || []).filter(a => 
        kelasSantri.some(s => s.id === a.santri_id) && a.status === 'hadir'
      ).length;

      setStats({ hadir: hadirSiswa, total: totalSiswa });
    } catch (e) {
      console.error('Error loading teacher stats:', e);
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Konfirmasi password baru tidak cocok');
      return;
    }
    
    setSavingPassword(true);
    try {
      await authAPI.changePassword({
        role: 'guru',
        id: guru.id,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      alert('Password berhasil diperbarui');
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      alert(e.message);
    }
    setSavingPassword(false);
  };

  if (!guru) return <div style={{ padding: '32px', textAlign: 'center' }}><Loader2 size={32} color="#059669" className="animate-spin" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', paddingBottom: '96px', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      {/* Profile Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <div style={{ width: '100px', height: '100px', backgroundColor: '#f1f5f9', borderRadius: '50%', margin: '0 auto 16px auto', border: '4px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
           <img 
            src={guru.foto_url ? `https://lh3.googleusercontent.com/d/${guru.foto_url.split('id=')[1]}=s400` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${guru.nama_lengkap}`} 
            alt="Guru" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>{guru.nama_lengkap}</h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>
          {guru.jabatan || 'Guru'} {guru.kelas?.nama_kelas ? `• Wali Kelas: ` : ''}
          {guru.kelas?.nama_kelas && <span style={{ color: '#059669', fontWeight: 'bold' }}>{guru.kelas.nama_kelas}</span>}
        </p>
      </div>

      {/* Action Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div 
          onClick={() => navigate('/guru/absen')}
          style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}
        >
          <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '50%', color: '#064e3b', marginBottom: '12px' }}>
            <QrCode size={28} />
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>Scan Santri</h3>
        </div>
        <div 
          onClick={() => navigate('/guru/kelas')}
          style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}
        >
          <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '50%', color: '#1d4ed8', marginBottom: '12px' }}>
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>Daftar Kelas</h3>
        </div>
      </div>

      {/* Status Kelas Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <h3 style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', fontSize: '16px' }}>Status Kelas Hari Ini</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={20} color="#22c55e" />
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>Kehadiran Kelas</span>
          </div>
          <span style={{ fontWeight: '900', fontSize: '18px', color: '#064e3b' }}>
            {loading ? '...' : `${stats.hadir}/${stats.total}`}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={20} color="#3b82f6" />
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>Target Pencapaian</span>
          </div>
          <span style={{ fontWeight: '900', fontSize: '18px', color: '#064e3b' }}>85%</span>
        </div>
      </div>

      {/* Settings */}
      <div style={{ marginTop: '8px' }}>
        <button 
          onClick={() => setShowPasswordModal(true)}
          style={{ width: '100%', padding: '16px', backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
        >
          <Lock size={18} /> Ganti Password
        </button>
      </div>

      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Ganti Password</h2>
              <X style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowPasswordModal(false)} />
            </div>
            <form onSubmit={handlePasswordChange}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Password Lama</label>
                  <input type="password" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Password Baru</label>
                  <input type="password" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} minLength={6} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Konfirmasi Password Baru</label>
                  <input type="password" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
                </div>
              </div>
              <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
                <button type="button" style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setShowPasswordModal(false)}>Batal</button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', backgroundColor: '#059669', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={savingPassword}>
                  {savingPassword ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
