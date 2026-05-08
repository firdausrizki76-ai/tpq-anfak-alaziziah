import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, QrCode, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { absensiAPI, kelasAPI } from '../../services/api';
import '../student/StudentDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [guru, setGuru] = useState(null);
  const [stats, setStats] = useState({ hadir: 0, total: 0 });
  const [loading, setLoading] = useState(true);

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
      // Get today's attendance for guru's class
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

  if (!guru) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="flex-col gap-4">
      <div className="card text-center py-6 mb-4 relative overflow-hidden featured">
        <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none"></div>
        <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 border-4 border-white shadow flex items-center justify-center overflow-hidden">
           <img 
            src={guru.foto_url ? `https://lh3.googleusercontent.com/d/${guru.foto_url.split('id=')[1]}=s400` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${guru.nama_lengkap}`} 
            alt="Guru" 
            className="w-full h-full object-cover" 
          />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-primary-container)]">{guru.nama_lengkap}</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm">{guru.jabatan || 'Guru'} {guru.kelas?.nama_kelas ? `| Wali Kelas: ${guru.kelas.nama_kelas}` : ''}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4 flex-col items-center text-center cursor-pointer hover:bg-emerald-50 transition-colors" onClick={() => navigate('/guru/absen')}>
          <div className="p-3 bg-emerald-100 rounded-full text-[var(--color-primary-container)] mb-2">
            <QrCode size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600">Scan Santri</h3>
        </div>
        <div className="card p-4 flex-col items-center text-center cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => navigate('/guru/kelas')}>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
            <Users size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600">Daftar Kelas</h3>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--color-primary-container)]">Status Kelas Hari Ini</h3>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <span className="font-semibold text-sm">Kehadiran Kelas</span>
          </div>
          <span className="font-bold text-lg text-[var(--color-primary-container)]">
            {loading ? '...' : `${stats.hadir}/${stats.total}`}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-blue-500" />
            <span className="font-semibold text-sm">Target Pencapaian</span>
          </div>
          <span className="font-bold text-lg text-[var(--color-primary-container)]">85%</span>
        </div>
      </div>

    </div>
  );
};

export default TeacherDashboard;
