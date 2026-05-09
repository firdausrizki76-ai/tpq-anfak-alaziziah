import React, { useState, useEffect } from 'react';
import { QrCode, BookOpen, Clock, AlertCircle, Lock, X, Save, Loader2 } from 'lucide-react';
import { authAPI } from '../../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('tpq_user'));
    setStudent(userData);
  }, []);

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

  if (!student) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="flex-col gap-4">
      <div className="card text-center py-6 mb-4 relative overflow-hidden featured">
        <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none"></div>
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 border-4 border-white shadow flex items-center justify-center overflow-hidden">
           <img 
            src={student.foto_url ? `https://lh3.googleusercontent.com/d/${student.foto_url.split('id=')[1]}=s400` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nama_lengkap}`} 
            alt="Santri" 
            className="w-full h-full object-cover" 
          />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-primary-container)]">{student.nama_lengkap}</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm">NIS: {student.nomor_induk} • Kelas: {student.kelas?.nama_kelas || '-'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4 flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-full text-[var(--color-primary-container)] mb-2">
            <QrCode size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600">Scan Absen</h3>
        </div>
        <div className="card p-4 flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
            <BookOpen size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600">Pelajaran</h3>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--color-primary-container)]">Status</h3>
          <span className="text-xs text-[var(--color-gold)] font-bold">Detail</span>
        </div>
        <div className="flex-col gap-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-emerald-600" />
              <span className="text-sm font-medium">Status Kehadiran</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Aktif</span>
          </div>
        </div>
      </div>
      
      <div className="flex-col gap-4 mb-8">
        <button className="btn-primary w-full justify-center bg-white text-gray-600 border-gray-200" onClick={() => setShowPasswordModal(true)}>
          <Lock size={18} /> Ganti Password
        </button>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title text-lg">Ganti Password</h2>
              <X className="modal-close" onClick={() => setShowPasswordModal(false)} />
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label text-sm">Password Lama</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={passwordForm.oldPassword} 
                    onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-sm">Password Baru</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={passwordForm.newPassword} 
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                    minLength={6}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-sm">Konfirmasi Password Baru</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={passwordForm.confirmPassword} 
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-primary flex-1 bg-gray-100 text-gray-600 border-none" onClick={() => setShowPasswordModal(false)}>Batal</button>
                <button type="submit" className="btn-primary flex-1" disabled={savingPassword}>
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
