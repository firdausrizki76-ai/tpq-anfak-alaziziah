import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Search, Filter, Loader2, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { absensiAPI } from '../../services/api';

const AttendanceHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [absensi, setAbsensi] = useState([]);
  const [filter, setFilter] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    search: ''
  });

  const user = JSON.parse(localStorage.getItem('tpq_user') || '{}');

  useEffect(() => {
    loadAttendance();
  }, [filter.tanggal]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      // Teachers only see their own class attendance
      const params = {
        tanggal: filter.tanggal,
        kelas: user.kelas_id
      };
      const data = await absensiAPI.getAll(params);
      setAbsensi(data || []);
    } catch (e) {
      console.error('Error loading attendance:', e);
    }
    setLoading(false);
  };

  const filteredAbsensi = absensi.filter(a => 
    a.santri?.nama_lengkap?.toLowerCase().includes(filter.search.toLowerCase()) ||
    a.santri?.nomor_induk?.toLowerCase().includes(filter.search.toLowerCase())
  );

  const stats = {
    hadir: filteredAbsensi.filter(a => a.status === 'hadir').length,
    sakit: filteredAbsensi.filter(a => a.status === 'sakit').length,
    izin: filteredAbsensi.filter(a => a.status === 'izin').length,
    alfa: filteredAbsensi.filter(a => a.status === 'alfa').length,
    total: filteredAbsensi.length
  };

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-primary-container)]">Riwayat Absensi</h2>
          <p className="text-xs text-gray-500">Kelas: {user.kelas?.nama_kelas || '-'}</p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Pilih Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="date" 
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filter.tanggal}
                onChange={(e) => setFilter({...filter, tanggal: e.target.value})}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Cari Santri</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Nama / NIS..."
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-50">
          <div className="text-center">
            <p className="text-[10px] font-bold text-green-500 uppercase">Hadir</p>
            <p className="text-lg font-bold text-gray-700">{stats.hadir}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Sakit</p>
            <p className="text-lg font-bold text-gray-700">{stats.sakit}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-amber-500 uppercase">Izin</p>
            <p className="text-lg font-bold text-gray-700">{stats.izin}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-red-500 uppercase">Alfa</p>
            <p className="text-lg font-bold text-gray-700">{stats.alfa}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
            <p className="text-sm text-gray-500 font-medium">Memuat data...</p>
          </div>
        ) : filteredAbsensi.length === 0 ? (
          <div className="card p-8 text-center bg-white rounded-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
              <Clock size={32} />
            </div>
            <p className="text-gray-500 font-medium">Tidak ada data absensi</p>
            <p className="text-xs text-gray-400 mt-1">Silakan pilih tanggal lain atau lakukan scan absensi.</p>
          </div>
        ) : (
          filteredAbsensi.map((a) => (
            <div key={a.id} className="card p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg border border-gray-100">
                {a.santri?.nama_lengkap?.charAt(0) || <User size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm">{a.santri?.nama_lengkap}</h3>
                <p className="text-[10px] text-gray-500 font-medium">{a.santri?.nomor_induk} • {new Date(a.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                {a.keterangan && <p className="text-[10px] text-gray-400 mt-1 italic">"{a.keterangan}"</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  a.status === 'hadir' ? 'bg-green-100 text-green-700' :
                  a.status === 'sakit' ? 'bg-blue-100 text-blue-700' :
                  a.status === 'izin' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {a.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
        <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
          Menampilkan data absensi santri kelas Anda pada tanggal {new Date(filter.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </p>
      </div>
    </div>
  );
};

export default AttendanceHistoryPage;
