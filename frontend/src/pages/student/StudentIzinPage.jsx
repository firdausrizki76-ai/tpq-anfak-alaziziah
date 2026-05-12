import React, { useState } from 'react';
import { FileText, ArrowLeft, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { absensiAPI } from '../../services/api';

const StudentIzinPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.keterangan.trim()) {
      alert('Keterangan izin harus diisi');
      return;
    }

    setLoading(true);
    try {
      const userStr = localStorage.getItem('tpq_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user || !user.id) throw new Error('Sesi tidak valid');

      await absensiAPI.create({
        santri_id: user.id,
        kelas_id: user.kelas_id || null,
        tanggal: formData.tanggal,
        status: 'izin',
        keterangan: formData.keterangan
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/siswa');
      }, 2000);
    } catch (error) {
      alert(error.message || 'Gagal mengirim pengajuan izin');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', paddingBottom: '96px', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-family-body, sans-serif)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', margin: '-16px -16px 0 -16px', padding: '40px 24px 24px 24px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 2px 15px rgba(0,0,0,0.03)', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#475569', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Pengajuan Izin</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', margin: '4px 0 0 0' }}>Formulir ketidakhadiran santri</p>
          </div>
        </div>
      </div>

      {success ? (
        <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', marginTop: '16px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', margin: '0 auto 16px auto' }}>
            <CheckCircle size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>Izin Berhasil Dikirim</h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Pengajuan izin telah tercatat di sistem. Mengalihkan kembali...</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <FileText size={20} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Form Izin</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Pilih tanggal dan isi alasan</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Tanggal Izin</label>
              <input 
                type="date" 
                value={formData.tanggal}
                onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                required
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#334155', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Alasan / Keterangan Lengkap</label>
              <textarea 
                value={formData.keterangan}
                onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                placeholder="Misal: Sakit demam, atau keperluan keluarga ke luar kota..."
                required
                rows={4}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#334155', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#059669', color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', boxShadow: '0 4px 15px rgba(5,150,105,0.2)', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Kirim Izin</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentIzinPage;
