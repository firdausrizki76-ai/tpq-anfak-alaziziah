import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Search, Filter, Loader2, User, CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
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
      const params = {
        tanggal: filter.tanggal
      };
      
      if (user.kelas_id) {
        params.kelas = user.kelas_id;
      }
      
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

  // Helper for inline styles to ensure it looks good even if Tailwind fails
  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    border: '1px solid #f1f5f9',
    borderRadius: '16px',
    padding: '4px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '12px',
    width: '100%'
  };

  const iconStyle = {
    color: '#94a3b8',
    marginRight: '12px',
    flexShrink: 0
  };

  const inputInnerStyle = {
    border: 'none',
    outline: 'none',
    padding: '12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    backgroundColor: 'transparent',
    width: '100%',
    fontFamily: 'inherit'
  };

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Header Section */}
      <div className="bg-[var(--color-primary-container)] -mx-4 -mt-4 p-6 pt-10 pb-12 rounded-b-[40px] shadow-lg relative overflow-hidden" style={{ backgroundColor: '#064e3b' }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition-all active:scale-95"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white m-0">Riwayat Absensi</h2>
            <p className="text-xs text-white/70 font-medium m-0">
              {user.kelas?.nama_kelas || 'Semua Kelas'} • {new Date(filter.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 -mt-8 relative z-20 px-2">
        {[
          { label: 'Hadir', val: stats.hadir, color: 'bg-green-500', text: 'text-green-600', hex: '#10b981' },
          { label: 'Sakit', val: stats.sakit, color: 'bg-blue-500', text: 'text-blue-600', hex: '#3b82f6' },
          { label: 'Izin', val: stats.izin, color: 'bg-amber-500', text: 'text-amber-600', hex: '#f59e0b' },
          { label: 'Alfa', val: stats.alfa, color: 'bg-red-500', text: 'text-red-600', hex: '#ef4444' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-3 shadow-md flex flex-col items-center border border-gray-50">
            <span className={`text-[10px] font-black uppercase tracking-tighter ${item.text}`} style={{ color: item.hex }}>{item.label}</span>
            <span className="text-lg font-black text-gray-800">{item.val}</span>
            <div className={`w-4 h-1 rounded-full mt-1 ${item.color} opacity-30`} style={{ backgroundColor: item.hex, opacity: 0.3 }}></div>
          </div>
        ))}
      </div>

      {/* Filter Section - Using Inline Styles for Robustness */}
      <div className="mt-4 px-1">
        <div style={inputContainerStyle}>
          <Calendar size={18} style={iconStyle} />
          <input 
            type="date" 
            style={inputInnerStyle}
            value={filter.tanggal}
            onChange={(e) => setFilter({...filter, tanggal: e.target.value})}
          />
        </div>

        <div style={inputContainerStyle}>
          <Search size={18} style={iconStyle} />
          <input 
            type="text" 
            placeholder="Cari nama atau NIS santri..."
            style={inputInnerStyle}
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
          />
        </div>
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-emerald-600 rounded-full animate-spin mb-4" style={{ borderColor: '#f1f5f9', borderTopColor: '#059669' }}></div>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Sinkronisasi...</p>
          </div>
        ) : filteredAbsensi.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
              <Clock size={40} />
            </div>
            <p className="text-gray-600 font-bold m-0">Tidak Ada Data</p>
            <p className="text-xs text-gray-400 mt-2 m-0 max-w-[200px] leading-relaxed">Belum ada absensi yang tercatat untuk kriteria ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">
              Ditemukan {filteredAbsensi.length} Santri
            </p>
            {filteredAbsensi.map((a) => (
              <div key={a.id} className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex items-center gap-4">
                <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-[#064e3b] font-black text-lg border border-white">
                  {a.santri?.nama_lengkap?.charAt(0) || <User size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm truncate m-0">{a.santri?.nama_lengkap}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-bold">{a.santri?.nomor_induk}</span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(a.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                    a.status === 'hadir' ? 'bg-green-100 text-green-700' :
                    a.status === 'sakit' ? 'bg-blue-100 text-blue-700' :
                    a.status === 'izin' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Panel */}
      {!loading && (
        <div className="mt-4 p-5 bg-white rounded-[24px] border border-blue-50 shadow-sm flex items-start gap-4">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Informasi</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium m-0">
              Data ini adalah rekapan resmi santri kelas <span className="text-blue-600 font-bold">{user.kelas?.nama_kelas || 'Anda'}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistoryPage;
;
