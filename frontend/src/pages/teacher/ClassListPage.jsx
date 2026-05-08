import React, { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { kelasAPI } from '../../services/api';

const ClassListPage = () => {
  const navigate = useNavigate();
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guru, setGuru] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('tpq_user'));
    setGuru(userData);
    if (userData && userData.kelas_id) {
      loadSantri(userData.kelas_id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadSantri = async (kelasId) => {
    setLoading(true);
    try {
      const data = await kelasAPI.getSantri(kelasId);
      setSantriList(data || []);
    } catch (e) {
      console.error('Error loading class santri:', e);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-gray-50 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-primary-container)]">Daftar Santri</h2>
          <p className="text-xs text-gray-500">Kelas: {guru?.kelas?.nama_kelas || '-'}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--color-primary-container)] mb-2" size={32} />
          <p className="text-sm text-gray-500">Memuat data santri...</p>
        </div>
      ) : santriList.length === 0 ? (
        <div className="card p-8 text-center bg-white rounded-2xl">
          <Users size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500">Belum ada santri terdaftar di kelas ini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {santriList.map((santri) => (
            <div key={santri.id} className="card p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-[var(--color-primary-container)] font-bold text-lg">
                {santri.nama_lengkap.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{santri.nama_lengkap}</h3>
                <p className="text-xs text-gray-500">{santri.nomor_induk}</p>
                <div className="flex gap-3 mt-2">
                   <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${santri.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {santri.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a href={`tel:${santri.no_hp_wali}`} className="p-2 bg-blue-50 text-blue-600 rounded-full">
                  <Phone size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <p className="text-xs text-amber-800 font-semibold mb-1">Catatan Wali Kelas</p>
        <p className="text-[10px] text-amber-700 leading-relaxed">
          Gunakan menu ini untuk memantau status santri di kelas Anda. Klik ikon telepon untuk menghubungi wali santri jika diperlukan.
        </p>
      </div>
    </div>
  );
};

export default ClassListPage;
