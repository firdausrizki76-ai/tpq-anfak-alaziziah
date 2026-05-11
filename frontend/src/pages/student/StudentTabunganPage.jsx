import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { tabunganAPI } from '../../services/api';

const StudentTabunganPage = () => {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('tpq_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user && user.id) {
        const data = await tabunganAPI.getRiwayat(user.id).catch(() => []);
        setRiwayat(data || []);
        
        // Use saldo_setelah from latest transaction for accuracy
        if (data && data.length > 0) {
          setSaldo(data[0].saldo_setelah || 0);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const formatRp = (n) => `Rp ${(n||0).toLocaleString('id-ID')}`;

  return (
    <div className="student-container pb-20">
      <h2 className="student-page-title mb-6">Tabungan Saya</h2>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Wallet size={80} />
        </div>
        <p className="text-emerald-100 font-medium mb-1">Total Saldo Aktif</p>
        <h3 className="text-4xl font-bold">{formatRp(saldo)}</h3>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Riwayat Transaksi</h3>
        
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
        ) : riwayat.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Wallet size={48} className="mx-auto mb-3 opacity-20" />
            <p>Belum ada riwayat transaksi</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {riwayat.map((trx, idx) => (
              <div key={trx.id || idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.jenis === 'setor' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                    {trx.jenis === 'setor' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{trx.jenis === 'setor' ? 'Setoran' : 'Penarikan'}</p>
                    <p className="text-xs text-gray-400">{new Date(trx.tanggal || trx.created_at).toLocaleDateString('id-ID')}</p>
                    {trx.keterangan && <p className="text-[10px] text-gray-400 mt-0.5 italic">{trx.keterangan}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${trx.jenis === 'setor' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {trx.jenis === 'setor' ? '+' : '-'}{formatRp(trx.nominal)}
                  </div>
                  <p className="text-[10px] text-gray-400">Saldo: {formatRp(trx.saldo_setelah)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTabunganPage;
