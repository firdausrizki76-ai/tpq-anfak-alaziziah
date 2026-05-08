import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Award, ArrowRight, Save, X, Calendar, Loader2, Plus, CheckCircle2, Printer } from 'lucide-react';
import { ujianAPI, kelasAPI, santriAPI } from '../../services/api';
import '../dashboard/Dashboard.css';

const UjianPage = () => {
  const [examData, setExamData] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [printSantri, setPrintSantri] = useState(null);
  const [selectedSantriIds, setSelectedSantriIds] = useState([]);
  const [nextKelas, setNextKelas] = useState('');
  const [nextKelasId, setNextKelasId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [regSearchQuery, setRegSearchQuery] = useState('');
  const [regFilterKelas, setRegFilterKelas] = useState('');
  const [formData, setFormData] = useState({ nilai: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0], hasil: 'lulus' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ujian, kelas] = await Promise.all([ujianAPI.getAll().catch(() => []), kelasAPI.getAll().catch(() => [])]);
      setExamData(ujian || []); setKelasList(kelas || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = async (type, item) => {
    setSelectedSantri(item);
    if (type === 'register_exam') {
      setLoading(true);
      try {
        const data = await santriAPI.getAll();
        setSantriList(data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    if (type === 'promotion_confirm' && item.santri?.kelas) {
      const currentUrutan = item.santri.kelas.urutan;
      const nextK = kelasList.find(k => k.urutan === currentUrutan + 1);
      setNextKelas(nextK ? nextK.nama_kelas : 'ALUMNI / LULUS');
      setNextKelasId(nextK ? nextK.id : '');
    }
    setActiveModal(type);
  };

  const closeModal = () => { 
    setActiveModal(null); 
    setSelectedSantri(null); 
    setSelectedSantriIds([]);
    setNextKelas(''); 
    setFormData({ nilai: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0], hasil: 'lulus' }); 
  };

  const handleInputChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleToggleSantri = (id) => {
    setSelectedSantriIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleRegisterExam = async () => {
    if (selectedSantriIds.length === 0) return;
    setSaving(true);
    try {
      await ujianAPI.register({ santri_ids: selectedSantriIds });
      await loadData();
      closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await ujianAPI.inputNilai({ santri_id: selectedSantri.santri_id, kelas_dari_id: selectedSantri.kelas_id, nilai_tes: parseInt(formData.nilai), status_tes: formData.hasil, catatan: formData.keterangan });
      await loadData(); 
      
      // Jika lulus, langsung tawarkan naik kelas
      if (formData.hasil === 'lulus') {
        openModal('promotion_confirm', selectedSantri);
      } else {
        closeModal();
      }
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handlePromotionConfirm = async () => {
    setSaving(true);
    try {
      await ujianAPI.naikKelas({ santri_id: selectedSantri.santri_id, kelas_dari_id: selectedSantri.kelas_id, kelas_ke_id: nextKelasId, tanggal_naik: new Date().toISOString().split('T')[0] });
      await loadData(); closeModal();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handlePrintKartu = (item) => {
    setPrintSantri(item);
    setTimeout(() => window.print(), 100);
  };

  const getStatus = (item) => {
    const pct = item.target_hari > 0 ? (item.aktual_hari / item.target_hari) * 100 : 0;
    if (pct >= 100) return 'Siap Ujian';
    return 'Belajar';
  };

  const filteredExam = examData.filter(item => !searchQuery || item.santri?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredReg = santriList.filter(s => {
    const matchesSearch = !regSearchQuery || s.nama_lengkap?.toLowerCase().includes(regSearchQuery.toLowerCase()) || s.nomor_induk?.includes(regSearchQuery);
    const matchesKelas = !regFilterKelas || s.kelas_id === regFilterKelas;
    const isNotAlreadyInExam = !examData.some(e => e.santri_id === s.id && getStatus(e) === 'Siap Ujian');
    return matchesSearch && matchesKelas && isNotAlreadyInExam && s.status === 'aktif';
  });

  return (
    <div className="flex-col gap-6 w-full relative">
      {printSantri && (
        <div id="print-kartu-tes" className="print-only">
          <div className="a5-card">
            
            {/* Header Table: Left Aligned */}
            <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse', border: 'none' }}>
              <tbody>
                <tr>
                  <td style={{ width: '70px', verticalAlign: 'middle', border: 'none', padding: 0 }}>
                    <img src="/assets/logoapp.png" alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                  </td>
                  <td style={{ textAlign: 'left', verticalAlign: 'middle', border: 'none', padding: '0 0 0 10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '500' }}>YAYASAN MAJELIS PENDIDIKAN ISLAM</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', lineHeight: '1.1', margin: '2px 0' }}>ANFAK AL AZIZIAH</div>
                    <div style={{ fontSize: '9px', lineHeight: '1.2' }}>Akta Notaris 04 Tgl 3 Juli 2007, No. Induk 02-06-04-001</div>
                    <div style={{ fontSize: '9px', lineHeight: '1.2' }}>Alamat : Tepus Wetan, Surodadi, Candimulyo, Magelang 56191</div>
                  </td>
                  <td style={{ width: '70px', verticalAlign: 'top', border: 'none', padding: 0, textAlign: 'right' }}>
                    <div style={{ width: '60px', height: '70px', border: '1px solid #ddd', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', display: 'inline-block', textAlign: 'center', padding: '3px', boxSizing: 'border-box' }}>
                      <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCADIAEgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDBAIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZnaGlqc3R1dnd4eXqGhcXHyIlicPZTVlZnWlgrG4RJCQWgeVjGV2JifPjQ0MrLzNbc4yPzV+0lhXYi4jVFJURmRWl5iZmqEjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD856KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKigAps81sfmJeUaV3I1GtIN/dGlQIj6XqqUmVru+TxTpORmuDg2jPbOwH/WBHDp/alFhgAPsu9RYboRVJorbSCU6pswCyiZibSlhhAbezkKNg8jzRoTSvIgOF/qh46HXkJgTNybCxzWL3Rs2HYCBQb2wR5KjF5AwQkRMCyPb1LTy3zTLrkYhd2dYUvQKy+NIUFG5pRsHRuo3opSvP03ImBtUEoZkRBLKmBlztdCo5wO8G9yH+2EcAhj3pFqBO9L5jSzjT6a10vvbf8HWohYRZXRG9yEV1RcFBprWP4UCqprpeJ1bERTfVulyJ/NDqb4MircRousMgeMGPwTQw7AtMLRPcmYXSyfRqeiFuDB63Pi/LDWn7GEC6nrTFzaqJEmppRNtbTPlcwOJqz2CcAPrYiJVq9leDrnYclqBU10VtajbZ0PaKH1CfjfO5sTsVrForZf9u5UWsWIF05FTO+J7PeaZdEBYeAetxo+IT+dNxe/swOq8NpIq8VrJUMMtH+4GWTdUSFpUC3eeDv6rb8krK87EUeBCXk8UXHWYqTBO3MapKzOjxxx2rs1ABh4av3e1tKqQUdqoYuNOLqayKF6ksQ9RIoxZpRQeqaQeX5QBQyjkLtFVZ3g2DB33qN2PNwNlTNqbNVU1a2d0ThCH4unICQo/VzTReRBojhogZmG3V5nSUhCyyXqVd2B76alWB/ZWChzNMo84W+lMtlD+EKHheaHxRRBQPrxxE/R7Tl7iL4VO1KpTlJXg9bL5/fd0EG5X6wEiHe0ucylON4GV5VTDxlskphNNL5pqhQb+wQCHoz90HIKFojqEga5WerxD8it3ZMRprJL+Lkt5A+2DweNUAw/3eBuSDIj7U+d5eprLRNljrMjinbEw7SuIzdsfigAxD8iLD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" alt="Qiraati" style={{ width: '100%', height: '52px', borderRadius: '26px', objectFit: 'contain' }} />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Title Section */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>KARTU TES KENAIKAN JILID</div>
              <div style={{ fontSize: '11px', marginTop: '2px' }}>TGL INPUT : {new Date().toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')}</div>
            </div>

            {/* Main Data Table */}
            <table className="ptable">
              <tbody>
                <tr>
                  <td colSpan="2" style={{ fontWeight: 'bold', fontSize: '14px', width: '65%' }}>
                    NOMOR : TES/26/05/{printSantri.santri?.nomor_induk?.slice(-3) || '001'}
                  </td>
                  <td style={{ width: '11.6%', textAlign: 'center', verticalAlign: 'top', fontSize: '9px', height: '35px' }}>IKL</td>
                  <td style={{ width: '11.6%', textAlign: 'center', verticalAlign: 'top', fontSize: '9px' }}>IA</td>
                  <td style={{ width: '11.6%', textAlign: 'center', verticalAlign: 'top', fontSize: '9px' }}>SCAN</td>
                </tr>
                <tr>
                  <td style={{ width: '150px' }}>Nomor Induk</td>
                  <td colSpan="4">{printSantri.santri?.nomor_induk || '-'}</td>
                </tr>
                <tr>
                  <td>Nama Lengkap</td>
                  <td colSpan="4">{printSantri.santri?.nama_lengkap || '-'}</td>
                </tr>
                <tr>
                  <td>Kelas</td>
                  <td colSpan="4">{printSantri.santri?.kelas?.nama_kelas || printSantri.kelas?.nama_kelas || '-'}</td>
                </tr>
                <tr>
                  <td>Tanggal Mulai</td>
                  <td colSpan="4">{printSantri.tanggal_mulai ? new Date(printSantri.tanggal_mulai).toLocaleDateString('id-ID') : '-'}</td>
                </tr>
                <tr>
                  <td>Tanggal Selesai</td>
                  <td colSpan="4">{printSantri.tanggal_selesai ? new Date(printSantri.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</td>
                </tr>
                <tr>
                  <td>Masa Tempuh</td>
                  <td colSpan="4">{printSantri.aktual_hari || 0} hari</td>
                </tr>
                <tr>
                  <td>Tagihan Syahriyah</td>
                  <td style={{ width: '150px' }}>Rp {(printSantri.syahriyah_nominal || 0).toLocaleString('id-ID')}</td>
                  <td colSpan="3"></td>
                </tr>
                <tr>
                  <td style={{ height: '40px', verticalAlign: 'top' }}>Keterangan</td>
                  <td colSpan="4"></td>
                </tr>
                <tr>
                  <td>Tanggal Tes</td>
                  <td></td>
                  <td></td>
                  <td colSpan="2"></td>
                </tr>
                <tr>
                  <td>Tanggal Naik</td>
                  <td colSpan="4"></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>NAIK/TIDAK NAIK</td>
                  <td colSpan="4"></td>
                </tr>
              </tbody>
            </table>

            {/* Signatures Table: Larger boxes */}
            <table className="ptable" style={{ marginTop: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '25%', height: '110px', verticalAlign: 'top', textAlign: 'center', padding: '8px' }}>
                    <div style={{ marginBottom: '60px', fontSize: '11px' }}>Wali Santri</div>
                    <div style={{ fontSize: '11px' }}>( ........................... )</div>
                  </td>
                  <td style={{ width: '25%', height: '110px', verticalAlign: 'top', textAlign: 'center', padding: '8px' }}>
                    <div style={{ marginBottom: '50px', fontSize: '11px' }}>Wali Kelas</div>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', lineHeight: '1.2' }}>
                      {printSantri.santri?.kelas?.wali?.nama_lengkap || '__________________'}
                    </div>
                  </td>
                  <td style={{ width: '25%', height: '110px', verticalAlign: 'top', textAlign: 'center', padding: '8px' }}>
                    <div style={{ marginBottom: '60px', fontSize: '11px' }}>Kepala Lembaga</div>
                    <div style={{ fontSize: '11px' }}>( ........................... )</div>
                  </td>
                  <td style={{ width: '25%', height: '110px', verticalAlign: 'top', textAlign: 'center', padding: '8px' }}>
                    <div style={{ marginBottom: '60px', fontSize: '11px' }}>Wali Kelas Baru</div>
                    <div style={{ fontSize: '11px' }}>( ........................... )</div>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      )}

      <div className="page-header mb-6 flex justify-between items-center no-print">
        <div><h1 className="page-title">Ujian & Kenaikan Kelas</h1><p className="page-subtitle">Kelola evaluasi akhir jilid dan kenaikan tingkat santri</p></div>
        <button className="btn-primary" onClick={() => openModal('register_exam')}><Plus size={18} /> Daftarkan Ujian</button>
      </div>

      <div className="card w-full">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="input-with-icon" style={{ maxWidth: '300px', width: '100%' }}>
            <Search className="icon" size={18} />
            <input type="text" className="input-field" placeholder="Cari nama santri..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table w-full">
            <thead><tr><th>No</th><th>Nama Santri</th><th>Kelas</th><th>Tanggal</th><th>Masa Tempuh</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {loading && !activeModal ? <tr><td colSpan="7" className="text-center" style={{ padding: '40px' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></td></tr>
              : filteredExam.length === 0 ? <tr><td colSpan="7" className="text-center" style={{ padding: '40px', color: 'var(--color-outline)' }}>Belum ada data pencapaian</td></tr>
              : filteredExam.map((item, i) => {
                const status = getStatus(item);
                const pct = item.target_hari > 0 ? Math.min((item.aktual_hari / item.target_hari) * 100, 100) : 0;
                return (
                  <tr key={item.id}>
                    <td>{i+1}</td>
                    <td className="font-medium">{item.santri?.nama_lengkap || '-'}</td>
                    <td><span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{item.santri?.kelas?.nama_kelas || item.kelas?.nama_kelas || '-'}</span></td>
                    <td className="text-xs text-gray-500">
                      <div>Mulai: {item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString('id-ID') : '-'}</div>
                      <div>Selesai: {item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</div>
                    </td>
                    <td>
                      <span className="font-bold">{item.aktual_hari || 0} Hari / {item.target_hari || 60}</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div className={`h-full ${pct >= 100 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </td>
                    <td>
                      {status === 'Siap Ujian' && <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Siap Ujian</span>}
                      {status === 'Belajar' && <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>Belajar</span>}
                    </td>
                    <td className="text-center flex justify-center gap-2">
                      {status === 'Siap Ujian' && <button className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Cetak Kartu Tes" onClick={() => handlePrintKartu(item)}><Printer size={18} /></button>}
                      {status === 'Siap Ujian' && <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 font-medium" title="Input Nilai" onClick={() => openModal('input_nilai', item)}><Award size={18} /> Nilai</button>}
                      {status === 'Belajar' && <span className="text-gray-400 text-sm italic">Proses Belajar</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal === 'register_exam' && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '600px' }}>
          <div className="modal-header"><h2 className="modal-title">Daftarkan Peserta Ujian</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body">
            <div className="flex gap-2 mb-4">
              <div className="input-with-icon flex-1">
                <Search className="icon" size={16} />
                <input type="text" className="input-field text-sm" placeholder="Cari nama santri..." value={regSearchQuery} onChange={(e) => setRegSearchQuery(e.target.value)} />
              </div>
              <select className="input-field text-sm" style={{ width: '150px' }} value={regFilterKelas} onChange={(e) => setRegFilterKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
            </div>
            <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-xl">
              <table className="data-table w-full text-sm">
                <thead className="sticky top-0 bg-white shadow-sm"><tr><th width="40">Pilih</th><th>Nama Santri</th><th>Kelas</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="3" className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto" /></td></tr>
                  : filteredReg.length === 0 ? <tr><td colSpan="3" className="text-center py-8 text-gray-400">Tidak ada santri ditemukan</td></tr>
                  : filteredReg.map(s => (
                    <tr key={s.id} onClick={() => handleToggleSantri(s.id)} className="cursor-pointer hover:bg-blue-50">
                      <td className="text-center"><input type="checkbox" checked={selectedSantriIds.includes(s.id)} onChange={() => {}} /></td>
                      <td className="font-medium">{s.nama_lengkap}</td>
                      <td>{s.kelas?.nama_kelas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} /> <span>{selectedSantriIds.length} santri terpilih untuk didaftarkan ujian.</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button className="btn-primary" onClick={handleRegisterExam} disabled={saving || selectedSantriIds.length === 0}>{saving ? 'Mendaftarkan...' : 'Daftarkan Sekarang'}</button>
          </div>
        </div></div>
      )}

      {activeModal === 'input_nilai' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '450px' }}>
          <div className="modal-header"><h2 className="modal-title">Input Hasil Ujian</h2><X className="modal-close" onClick={closeModal} /></div>
          <form onSubmit={handleSubmitScore}><div className="modal-body">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold shadow-sm">{(selectedSantri.santri?.nama_lengkap || '?').charAt(0)}</div>
              <div><h4 className="font-bold text-gray-800">{selectedSantri.santri?.nama_lengkap}</h4><p className="text-xs text-blue-600">Ujian Kenaikan {selectedSantri.santri?.kelas?.nama_kelas || selectedSantri.kelas?.nama_kelas}</p></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group"><label className="form-label">Skor Ujian (0-100)</label><input type="number" name="nilai" className="input-field" value={formData.nilai} onChange={handleInputChange} required /></div>
                <div className="form-group"><label className="form-label">Hasil</label><select name="hasil" className="input-field" value={formData.hasil} onChange={handleInputChange}><option value="lulus">Lulus</option><option value="remidi">Remedi</option></select></div>
              </div>
              <div className="form-group"><label className="form-label">Catatan</label><textarea name="keterangan" className="input-field" rows="3" style={{ resize: 'none' }} value={formData.keterangan} onChange={handleInputChange}></textarea></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Hasil'}</button>
          </div></form>
        </div></div>
      )}

      {activeModal === 'promotion_confirm' && selectedSantri && (
        <div className="modal-overlay"><div className="modal-container" style={{ maxWidth: '400px' }}>
          <div className="modal-header border-none"><h2 className="modal-title">Konfirmasi Kenaikan</h2><X className="modal-close" onClick={closeModal} /></div>
          <div className="modal-body text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4"><Award size={40} /></div>
            <p className="text-gray-600 mb-4">Ujian Selesai! Naikkan santri ini sekarang?</p>
            <div className="flex items-center justify-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-center"><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">DARI</p><span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>{selectedSantri.santri?.kelas?.nama_kelas || selectedSantri.kelas?.nama_kelas}</span></div>
              <ArrowRight className="text-emerald-500" size={24} />
              <div className="text-center"><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">KE</p><span className="badge badge-success">{nextKelas}</span></div>
            </div>
            <h4 className="font-bold text-gray-800 mt-4">{selectedSantri.santri?.nama_lengkap}</h4>
          </div>
          <div className="modal-footer border-none pt-0">
            <button className="btn-primary" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={closeModal}>Nanti Saja</button>
            <button className="btn-primary" style={{ backgroundColor: '#10b981' }} onClick={handlePromotionConfirm} disabled={saving}>{saving ? 'Memproses...' : 'Ya, Naikkan Sekarang'}</button>
          </div>
        </div></div>
      )}
      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          @page { size: A5 portrait; margin: 10mm; }
          
          /* Hide everything by default */
          body * { visibility: hidden; }
          
          /* Show only the print container and its contents */
          #print-kartu-tes, #print-kartu-tes * { visibility: visible; }
          
          /* Position the print container and force parents to be visible but not show their own content */
          #print-kartu-tes {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          /* Crucial: parents must not clip or hide the absolute child */
          html, body, #root, .app-layout, .main-wrapper, .content-area, .content-container, .flex-col {
            visibility: visible !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            position: static !important;
            display: block !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .a5-card { 
            width: 100%; 
            max-width: 148mm; 
            margin: 0 auto; 
            padding: 10px; 
            border: 1px solid #000; 
            background: #fff; 
            font-family: 'Times New Roman', serif; 
            box-sizing: border-box;
          }
          
          .ptable { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .ptable th, .ptable td { border: 1px solid #000 !important; padding: 4px 8px; font-size: 11px; vertical-align: middle; }
        }
      `}</style>
    </div>
  );
};

export default UjianPage;
