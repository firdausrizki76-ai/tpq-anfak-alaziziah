import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { pembayaranAPI } from '../../services/api';

const StudentTagihanPage = () => {
  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('tpq_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user && user.id) {
        const data = await pembayaranAPI.getAll({ santri_id: user.id }).catch(() => []);
        setTagihan(data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  const belumLunas = tagihan.filter(t => t.status === 'belum');
  const lunas = tagihan.filter(t => t.status === 'lunas');

  return (
    <div className="student-container pb-20">
      <h2 className="student-page-title mb-6">Tagihan Saya</h2>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : (
        <>
          {/* Belum Lunas */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-orange-600 uppercase mb-3 flex items-center gap-2">
              <AlertCircle size={16} /> Belum Lunas ({belumLunas.length})
            </h3>
            {belumLunas.length === 0 ? (
              <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-100">
                <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm text-emerald-700 font-semibold">Semua tagihan sudah lunas!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {belumLunas.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-orange-400 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{t.jenis?.nama || 'Tagihan'}</p>
                        <p className="text-xs text-gray-500">Periode: {t.bulan}/{t.tahun}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600 text-lg">{formatRp(t.nominal)}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">BELUM LUNAS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sudah Lunas */}
          {lunas.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-emerald-600 uppercase mb-3 flex items-center gap-2">
                <CheckCircle size={16} /> Sudah Lunas ({lunas.length})
              </h3>
              <div className="space-y-3">
                {lunas.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 opacity-80">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-700">{t.jenis?.nama || 'Tagihan'}</p>
                        <p className="text-xs text-gray-500">Periode: {t.bulan}/{t.tahun}</p>
                        {t.tanggal_bayar && <p className="text-[10px] text-gray-400">Dibayar: {new Date(t.tanggal_bayar).toLocaleDateString('id-ID')}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-600">{formatRp(t.nominal)}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">LUNAS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentTagihanPage;
