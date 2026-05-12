import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, AlertCircle, Lock, X, Save, Loader2, Wallet, Receipt, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI, tabunganAPI, pembayaranAPI, santriAPI } from '../../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [saldo, setSaldo] = useState(0);
  const [tagihan, setTagihan] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('tpq_user'));
    if (userData) {
      setStudent(userData);
      loadStudentData(userData);
    }
  }, []);

  const loadStudentData = async (user) => {
    setLoadingData(true);
    try {
      // Fetch fresh student data to get class details
      const freshSantri = await santriAPI.getById(user.id).catch(() => null);
      if (freshSantri) {
        setStudent(prev => ({ ...prev, ...freshSantri }));
        // Update local storage so other pages have fresh data
        const currentUser = JSON.parse(localStorage.getItem('tpq_user') || '{}');
        localStorage.setItem('tpq_user', JSON.stringify({ ...currentUser, ...freshSantri }));
      }

      // Fetch saldo from tabungan API
      const riwayat = await tabunganAPI.getRiwayat(user.id).catch(() => []);
      if (riwayat && riwayat.length > 0) {
        setSaldo(riwayat[0].saldo_setelah || 0);
      }

      // Fetch unpaid bills
      const bills = await pembayaranAPI.getAll({ santri_id: user.id, status: 'belum' }).catch(() => []);
      setTagihan(bills || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingData(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Konfirmasi password baru tidak cocok');
      return;
    }
    
    setSavingPassword(true);
    try {
      await authAPI.changePassword({
        role: 'siswa',
        id: student.id,
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

  if (!student) return <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', paddingBottom: '96px', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      {/* Profile Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <div style={{ width: '100px', height: '100px', backgroundColor: '#f1f5f9', borderRadius: '50%', margin: '0 auto 16px auto', border: '4px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
           <img 
            src={student.foto_url ? `https://lh3.googleusercontent.com/d/${student.foto_url.split('id=')[1]}=s400` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nama_lengkap}`} 
            alt="Santri" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>{student.nama_lengkap}</h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>
          NIS: {student.nomor_induk} • Kelas: <span style={{ color: '#059669', fontWeight: 'bold' }}>{student.kelas?.nama_kelas || student.nama_kelas || '-'}</span>
        </p>
      </div>

      {/* Saldo Tabungan Card */}
      <div 
        onClick={() => navigate('/siswa/tabungan')}
        style={{ 
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', 
          borderRadius: '24px', 
          padding: '24px', 
          color: 'white', 
          boxShadow: '0 10px 25px rgba(5, 150, 105, 0.25)', 
          position: 'relative', 
          overflow: 'hidden', 
          cursor: 'pointer' 
        }}
      >
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15, transform: 'rotate(-15deg)' }}>
          <Wallet size={120} />
        </div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Saldo Tabungan</p>
          <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>{loadingData ? '...' : formatRp(saldo)}</h3>
          <p style={{ fontSize: '12px', color: '#6ee7b7', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
            Tap untuk lihat riwayat <span style={{ fontSize: '14px' }}>→</span>
          </p>
        </div>
      </div>

      {/* Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div 
          onClick={() => navigate('/siswa/tagihan')}
          style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}
        >
          <div style={{ padding: '16px', backgroundColor: '#fff7ed', borderRadius: '50%', color: '#ea580c', marginBottom: '12px' }}>
            <Receipt size={28} />
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>Cek Tagihan</h3>
          {tagihan.length > 0 && (
            <span style={{ fontSize: '10px', marginTop: '8px', backgroundColor: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
              {tagihan.length} Belum Lunas
            </span>
          )}
        </div>
        
        <div 
          onClick={() => navigate('/siswa/izin')}
          style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}
        >
          <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '50%', color: '#2563eb', marginBottom: '12px' }}>
            <FileText size={28} />
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>Pengajuan Izin</h3>
        </div>
      </div>

      {/* Riwayat Pendidikan Quick Link */}
      <div 
        onClick={() => navigate('/siswa/riwayat-pendidikan')}
        style={{ backgroundColor: '#f0fdf4', borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', border: '1px solid #dcfce7', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}
      >
        <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '16px', color: '#16a34a' }}>
          <BookOpen size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: '0 0 4px 0' }}>Riwayat Pendidikan</h3>
          <p style={{ fontSize: '11px', color: '#15803d', margin: 0, fontWeight: '500' }}>Lihat histori kelas dan nilai ujian</p>
        </div>
        <div style={{ color: '#16a34a', fontWeight: 'bold' }}>→</div>
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
                  <input type="password" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Password Baru</label>
                  <input type="password" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} minLength={6} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Konfirmasi Password Baru</label>
                  <input type="password" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
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

export default StudentDashboard;
