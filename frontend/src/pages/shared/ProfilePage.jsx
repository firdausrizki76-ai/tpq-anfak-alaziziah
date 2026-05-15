import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, LogOut, Loader2, Camera, ShieldCheck, Heart, Star, BookOpen, Users } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('tpq_user'));
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tpq_token');
    localStorage.removeItem('tpq_user');
    navigate('/login');
  };

  const getDirectGDriveLink = (link) => {
    if (!link) return null;
    let fileId = '';
    if (link.includes('/file/d/')) fileId = link.split('/d/')[1].split('/')[0];
    else if (link.includes('id=')) fileId = link.split('id=')[1].split('&')[0];
    else if (link.includes('drive.google.com/uc?')) {
      const urlObj = new URL(link);
      fileId = urlObj.searchParams.get('id');
    }
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}=s400` : link;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
      <Loader2 size={40} color="#059669" className="animate-spin" />
    </div>
  );

  if (!user) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
      Data profil tidak ditemukan. Silakan login kembali.
    </div>
  );

  const isStudent = user.role === 'siswa';

  return (
    <div style={{ 
      padding: '16px', 
      paddingBottom: '100px', 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh',
      fontFamily: 'var(--font-family-body, sans-serif)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Header Profile Section */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '32px', 
        padding: '32px 24px', 
        textAlign: 'center', 
        marginBottom: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '100px', 
          background: isStudent ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
          zIndex: 1
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '40px', 
            margin: '0 auto 16px auto', 
            border: '6px solid white', 
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {user.foto_url ? (
              <img 
                src={getDirectGDriveLink(user.foto_url)} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <User size={60} color="#94a3b8" />
            )}
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            {user.nama_lengkap} {user.nama_panggilan && <span style={{ fontWeight: '400', fontSize: '18px', color: '#64748b' }}>({user.nama_panggilan})</span>}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              backgroundColor: isStudent ? '#dcfce7' : '#ecfdf5', 
              color: isStudent ? '#059669' : '#065f46', 
              padding: '4px 14px', 
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {isStudent ? 'Santri' : 'Guru / Staf'}
            </span>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
              {isStudent ? `NIS: ${user.nomor_induk}` : `NIP: ${user.nip || '-'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Personal Details */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#059669" /> Data Pribadi
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isStudent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Kelas Sekarang</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.kelas?.nama_kelas || user.nama_kelas || '-'}</p>
                </div>
              </div>
            )}
            
            {!isStudent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Jabatan</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.jabatan || '-'}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <CreditCard size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>NIK</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.nik || '-'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <Calendar size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Tempat, Tanggal Lahir</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>
                  {user.tempat_lahir || '-'}, {user.tanggal_lahir || '-'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <User size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Jenis Kelamin</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Family Details (For Student) */}
        {isStudent && (
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="#059669" /> Data Keluarga
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Nama Ayah</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.nama_ayah || '-'}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Nama Ibu</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.nama_ibu || '-'}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Nama Wali</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.nama_wali || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contact & Address */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={20} color="#059669" /> Kontak & Alamat
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Phone size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Nomor Telepon</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.no_hp || user.no_hp_wali || '-'}</p>
              </div>
            </div>

            {!isStudent && user.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Email</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>{user.email}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <MapPin size={20} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Alamat Lengkap</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  {user.alamat || '-'}
                  {(user.rt || user.rw) && ` (RT ${user.rt || '0'}/RW ${user.rw || '0'})`}
                  {user.desa && `, ${user.desa}`}
                  {user.kecamatan && `, ${user.kecamatan}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interests Section (For Student) */}
        {isStudent && (user.hobi || user.cita_cita) && (
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart size={20} color="#059669" /> Minat & Bakat
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '16px', backgroundColor: '#fff7ed', borderRadius: '16px', border: '1px solid #ffedd5' }}>
                <p style={{ fontSize: '11px', color: '#c2410c', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Hobi</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#9a3412', margin: 0 }}>{user.hobi || '-'}</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#fdf2f8', borderRadius: '16px', border: '1px solid #fce7f3' }}>
                <p style={{ fontSize: '11px', color: '#be185d', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Cita-cita</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#9d174d', margin: 0 }}>{user.cita_cita || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div style={{ marginTop: '12px' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '18px', 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              border: '1px solid #fecaca', 
              borderRadius: '24px', 
              fontSize: '16px', 
              fontWeight: '900', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={20} /> Keluar Aplikasi
          </button>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '16px', fontWeight: '500' }}>
            TPQ Anfak Al Azizah • Versi 1.0.0
          </p>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
