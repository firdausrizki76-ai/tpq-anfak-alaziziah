import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Loader2, 
  Sun, BookOpen, PartyPopper, Flag, Star, AlertCircle, CheckCircle2, Printer
} from 'lucide-react';
import { kalenderAPI } from '../../services/api';

const JENIS_OPTIONS = [
  { value: 'libur_nasional', label: 'Libur Nasional', color: '#dc2626', icon: Flag },
  { value: 'cuti_bersama', label: 'Cuti Bersama', color: '#f59e0b', icon: Sun },
  { value: 'agenda', label: 'Agenda TPQ', color: '#064e3b', icon: BookOpen },
  { value: 'kegiatan', label: 'Kegiatan', color: '#7c3aed', icon: PartyPopper },
  { value: 'hari_khusus', label: 'Hari Khusus', color: '#0ea5e9', icon: Star },
];

const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI_NAMES = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const getJenisInfo = (jenis) => JENIS_OPTIONS.find(j => j.value === jenis) || JENIS_OPTIONS[2];

const KalenderViewPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hariIni, setHariIni] = useState(null);
  const [statistik, setStatistik] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');
  const [filterBulan, setFilterBulan] = useState(String(new Date().getMonth()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, hariIniData, statsData] = await Promise.all([
        kalenderAPI.getAll({ tahun: year }),
        kalenderAPI.getHariIni(),
        kalenderAPI.getStatistik({ tahun: year })
      ]);
      setEvents(eventsData || []);
      setHariIni(hariIniData);
      setStatistik(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      days.push({ day: d, isCurrentMonth: true, date: dateStr });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, date: null });
    }
    return days;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (!map[e.tanggal]) map[e.tanggal] = [];
      map[e.tanggal].push(e);
    });
    return map;
  }, [events]);

  const monthEvents = useMemo(() => {
    let filtered = events;
    if (filterBulan !== 'all') {
      const targetM = parseInt(filterBulan);
      filtered = filtered.filter(e => {
        const d = new Date(e.tanggal + 'T00:00:00');
        return d.getMonth() === targetM;
      });
    }
    return filtered.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [events, filterBulan]);

  const monthEventsList = useMemo(() => {
    return events
      .filter(e => {
        const d = new Date(e.tanggal + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [events, year, month]);

  const calendarWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const currentMonthStats = statistik?.statistik?.find(s => s.bulan === month + 1);

  return (
    <div className="kalender-view-wrapper">
      {/* ================= ON-SCREEN INTERACTIVE UI ================= */}
      <div className="no-print" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={22} style={{ color: '#064e3b' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-family-display)', color: '#064e3b' }}>Kalender Pendidikan</h2>
          </div>
          <button
            onClick={() => window.print()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
              borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff',
              fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-family-body)'
            }}
            title="Cetak Kalender Pendidikan"
          >
            <Printer size={15} /> Cetak
          </button>
        </div>

        {/* Status Hari Ini */}
        {hariIni && (
          <div style={{
            padding: '14px 16px', borderRadius: '14px',
            background: hariIni.is_libur 
              ? 'linear-gradient(135deg, #fef2f2, #fecaca)' 
              : 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
            border: `1px solid ${hariIni.is_libur ? '#fca5a5' : '#86efac'}`,
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: hariIni.is_libur ? '#dc262620' : '#064e3b20'
            }}>
              {hariIni.is_libur ? <AlertCircle size={20} style={{ color: '#dc2626' }} /> : <CheckCircle2 size={20} style={{ color: '#064e3b' }} />}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: hariIni.is_libur ? '#991b1b' : '#166534' }}>
                Hari Ini: {hariIni.keterangan}
              </div>
              <div style={{ fontSize: '12px', color: hariIni.is_libur ? '#b91c1c' : '#15803d', marginTop: '2px' }}>
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {hariIni.events?.length > 0 && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  {hariIni.events.map(e => e.judul).join(' • ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {currentMonthStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f0fdf4', textAlign: 'center', border: '1px solid #bbf7d020' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#064e3b' }}>{currentMonthStats.hari_efektif}</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Hari Efektif KBM</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fef2f2', textAlign: 'center', border: '1px solid #fecaca20' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>{currentMonthStats.hari_libur}</div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Libur Nasional</div>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fff1f2', textAlign: 'center', border: '1px solid #fecdd3' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#e11d48' }}>{currentMonthStats.hari_kamis ?? currentMonthStats.hari_minggu}</div>
              <div style={{ fontSize: '10px', color: '#e11d48', fontWeight: '500' }}>Libur Kamis</div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
          {[{ key: 'calendar', label: '📅 Kalender' }, { key: 'list', label: '📋 Daftar' }].map(tab => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                fontFamily: 'var(--font-family-body)',
                backgroundColor: viewMode === tab.key ? '#ffffff' : 'transparent',
                color: viewMode === tab.key ? '#064e3b' : '#94a3b8',
                boxShadow: viewMode === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px' }}>Memuat kalender...</p>
          </div>
        ) : (
          <>
            {viewMode === 'calendar' && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                {/* Month Nav */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', backgroundColor: '#064e3b', color: '#ffffff', flexWrap: 'wrap', gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={prevMonth} style={navBtn}><ChevronLeft size={18} /></button>
                    <select
                      value={month}
                      onChange={e => {
                        const m = parseInt(e.target.value);
                        setCurrentDate(new Date(year, m, 1));
                        setFilterBulan(String(m));
                      }}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: 'var(--font-family-display)'
                      }}
                      title="Pilih Bulan"
                    >
                      {BULAN_NAMES.map((name, i) => (
                        <option key={i} value={i} style={{ color: '#000', fontFamily: 'var(--font-family-body)' }}>{name}</option>
                      ))}
                    </select>
                    <button onClick={nextMonth} style={navBtn}><ChevronRight size={18} /></button>
                  </div>
                  <select
                    value={year}
                    onChange={e => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={y} style={{ color: '#000' }}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Day Labels (Kamis Libur Rutin) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8fafc' }}>
                  {HARI_NAMES.map((name, i) => (
                    <div key={name} style={{
                      padding: '8px 0', textAlign: 'center', fontSize: '10px', fontWeight: '700',
                      color: i === 4 ? '#dc2626' : '#94a3b8', textTransform: 'uppercase'
                    }}>
                      {name} {i === 4 ? '*' : ''}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {calendarDays.map((day, idx) => {
                    const dayEvents = day.date ? (eventsByDate[day.date] || []) : [];
                    const isToday = day.date === todayStr;
                    const isKamis = idx % 7 === 4; // Kamis Libur Rutin TPQ
                    const hasLibur = dayEvents.some(e => e.is_libur);
                    const isSelected = day.date === selectedDate;

                    return (
                      <div
                        key={idx}
                        onClick={() => day.isCurrentMonth && day.date && setSelectedDate(day.date === selectedDate ? null : day.date)}
                        style={{
                          minHeight: '52px', padding: '2px', textAlign: 'center',
                          borderRight: '1px solid #f8fafc', borderBottom: '1px solid #f8fafc',
                          cursor: day.isCurrentMonth ? 'pointer' : 'default',
                          backgroundColor: isSelected ? '#f0fdf4' : isToday ? '#fffbeb' : !day.isCurrentMonth ? '#fafafa' : isKamis ? '#fff5f5' : '#fff',
                          position: 'relative'
                        }}
                      >
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%', margin: '2px auto',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: isToday ? '800' : '500',
                          backgroundColor: isToday ? '#064e3b' : 'transparent',
                          color: isToday ? '#fff' : !day.isCurrentMonth ? '#d1d5db' : isKamis || hasLibur ? '#dc2626' : '#1f2937'
                        }}>
                          {day.day}
                        </div>
                        {dayEvents.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '1px' }}>
                            {dayEvents.slice(0, 3).map((e, i) => (
                              <div key={i} style={{
                                width: '5px', height: '5px', borderRadius: '50%',
                                backgroundColor: e.warna || getJenisInfo(e.jenis).color
                              }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Date Detail */}
                {selectedDate && (
                  <div style={{ padding: '14px 16px', borderTop: '2px solid #064e3b', backgroundColor: '#f8fdf9' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#064e3b', marginBottom: '10px' }}>
                      📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {(eventsByDate[selectedDate] || []).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(eventsByDate[selectedDate] || []).map(event => {
                          const info = getJenisInfo(event.jenis);
                          const IconComp = info.icon;
                          return (
                            <div key={event.id} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 12px', borderRadius: '10px', backgroundColor: '#fff',
                              borderLeft: `3px solid ${event.warna || info.color}`,
                              border: '1px solid #f1f5f9'
                            }}>
                              <IconComp size={16} style={{ color: event.warna || info.color, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>{event.judul}</div>
                                {event.deskripsi && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{event.deskripsi}</div>}
                              </div>
                              {event.is_libur && (
                                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '700' }}>LIBUR</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Tidak ada event di tanggal ini.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#064e3b' }}>
                    {filterBulan === 'all' ? `Semua Bulan (${year})` : `${BULAN_NAMES[parseInt(filterBulan)]} ${year}`}
                  </span>
                  <select
                    value={filterBulan}
                    onChange={e => setFilterBulan(e.target.value)}
                    style={{
                      padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                      fontSize: '12px', fontWeight: '600', backgroundColor: '#ffffff', color: '#1f2937'
                    }}
                  >
                    <option value="all">Semua Bulan ({year})</option>
                    {BULAN_NAMES.map((name, i) => (
                      <option key={i} value={String(i)}>{name}</option>
                    ))}
                  </select>
                </div>

                {monthEvents.length > 0 ? monthEvents.map(event => {
                  const info = getJenisInfo(event.jenis);
                  const IconComp = info.icon;
                  return (
                    <div key={event.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 14px', borderRadius: '12px', backgroundColor: '#fff',
                      border: '1px solid #f1f5f9', borderLeft: `4px solid ${event.warna || info.color}`
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#064e3b', lineHeight: 1 }}>
                          {new Date(event.tanggal + 'T00:00:00').getDate()}
                        </span>
                        <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
                          {BULAN_NAMES[new Date(event.tanggal + 'T00:00:00').getMonth()].slice(0, 3)}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconComp size={12} style={{ color: event.warna || info.color }} />
                          <span style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>{event.judul}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {new Date(event.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' })} • {info.label}
                        </div>
                      </div>
                      {event.is_libur && (
                        <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '700', flexShrink: 0 }}>LIBUR</span>
                      )}
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
                    Tidak ada event di bulan {filterBulan === 'all' ? year : BULAN_NAMES[parseInt(filterBulan)]}.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', padding: '8px 0' }}>
          {JENIS_OPTIONS.map(j => (
            <div key={j.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#6b7280' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: j.color }} />
              {j.label}
            </div>
          ))}
        </div>
      </div>

      {/* ================= PRINT-ONLY KALENDER PENDIDIKAN ================= */}
      <div id="print-calendar-area-view" className="print-only" style={{ padding: '20px 24px', fontFamily: 'serif', backgroundColor: '#ffffff', color: '#000000' }}>
        {/* KOP RESMI */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', borderBottom: '3px double #064e3b', paddingBottom: '12px', marginBottom: '14px' }}>
          <img src="/assets/logoapp.png" alt="Logo" style={{ height: '60px', width: 'auto' }} />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#064e3b', margin: 0, textTransform: 'uppercase' }}>
              TPQ ANFAK AL AZIZAH
            </h1>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '3px 0', textDecoration: 'underline' }}>
              KALENDER PENDIDIKAN & AGENDA KEGIATAN
            </h2>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0, fontFamily: 'sans-serif' }}>
              Bulan: <strong>{BULAN_NAMES[month]} {year}</strong>
            </p>
          </div>
        </div>

        {/* RINGKASAN HARI EFEKTIF */}
        {currentMonthStats && (
          <div style={{ border: '1.5px solid #064e3b', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', backgroundColor: '#f0fdf4', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', gap: '6px', fontSize: '11px' }}>
              <div>
                <span style={{ color: '#166534', fontWeight: 'bold' }}>HARI EFEKTIF KBM</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#064e3b' }}>{currentMonthStats.hari_efektif} Hari</div>
              </div>
              <div>
                <span style={{ color: '#991b1b', fontWeight: 'bold' }}>LIBUR RUTIN KAMIS</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>{currentMonthStats.hari_kamis ?? currentMonthStats.hari_minggu} Hari</div>
              </div>
              <div>
                <span style={{ color: '#b91c1c', fontWeight: 'bold' }}>LIBUR NASIONAL</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#b91c1c' }}>{currentMonthStats.hari_libur} Hari</div>
              </div>
              <div>
                <span style={{ color: '#1e40af', fontWeight: 'bold' }}>TOTAL HARI</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1d4ed8' }}>{currentMonthStats.total_hari} Hari</div>
              </div>
            </div>
            <div style={{ fontSize: '9px', color: '#475569', textAlign: 'center', marginTop: '3px', fontStyle: 'italic', borderTop: '1px dashed #bbf7d0', paddingTop: '3px' }}>
              * Libur mingguan rutin TPQ adalah hari <strong>KAMIS</strong>. Hari Minggu KBM aktif.
            </div>
          </div>
        )}

        {/* TABEL KALENDER */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', marginBottom: '14px', fontFamily: 'sans-serif' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              {HARI_NAMES.map((name, i) => (
                <th key={name} style={{
                  border: '1px solid #000', padding: '5px', textAlign: 'center', fontSize: '10px',
                  fontWeight: 'bold', width: '14.28%', color: i === 4 ? '#dc2626' : '#000',
                  backgroundColor: i === 4 ? '#fee2e2' : '#f1f5f9'
                }}>
                  {name} {i === 4 ? '(LIBUR)' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendarWeeks.map((week, wIdx) => (
              <tr key={wIdx}>
                {week.map((day, dIdx) => {
                  const dayEvents = day.date ? (eventsByDate[day.date] || []) : [];
                  const isKamis = dIdx === 4;
                  const hasLibur = dayEvents.some(e => e.is_libur);
                  return (
                    <td
                      key={dIdx}
                      style={{
                        border: '1px solid #000', height: '52px', verticalAlign: 'top', padding: '3px',
                        backgroundColor: !day.isCurrentMonth ? '#f8fafc' : isKamis ? '#fff5f5' : '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: (isKamis || hasLibur) ? 'bold' : 'normal',
                          color: !day.isCurrentMonth ? '#94a3b8' : (isKamis || hasLibur) ? '#dc2626' : '#000000'
                        }}>
                          {day.day}
                        </span>
                        {isKamis && day.isCurrentMonth && (
                          <span style={{ fontSize: '7.5px', color: '#dc2626', fontWeight: 'bold' }}>Libur</span>
                        )}
                      </div>
                      {dayEvents.map((e, eIdx) => (
                        <div
                          key={eIdx}
                          style={{
                            fontSize: '7.5px', lineHeight: 1.1, padding: '1px 2px', marginBottom: '1px',
                            borderRadius: '2px', borderLeft: `2px solid ${e.is_libur ? '#dc2626' : '#064e3b'}`,
                            backgroundColor: e.is_libur ? '#fef2f2' : '#f0fdf4',
                            color: e.is_libur ? '#991b1b' : '#064e3b', fontWeight: '600'
                          }}
                        >
                          {e.judul}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* RINCIAN AGENDA */}
        <div style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#064e3b', marginBottom: '4px', borderBottom: '1px solid #000', paddingBottom: '2px', textTransform: 'uppercase' }}>
            Rincian Agenda & Libur — {BULAN_NAMES[month]} {year}
          </div>
          {monthEventsList.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', fontFamily: 'sans-serif' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #000' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center', width: '25px' }}>No</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'left', width: '80px' }}>Tanggal</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'left' }}>Nama Kegiatan / Libur</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center', width: '100px' }}>Kategori</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center', width: '60px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {monthEventsList.map((e, idx) => {
                  const info = getJenisInfo(e.jenis);
                  return (
                    <tr key={e.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '3px' }}>
                        {new Date(e.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ({new Date(e.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' })})
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '3px', fontWeight: e.is_libur ? 'bold' : 'normal', color: e.is_libur ? '#dc2626' : '#1f2937' }}>
                        {e.judul} {e.deskripsi ? `— ${e.deskripsi}` : ''}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center' }}>{info.label}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center', fontWeight: 'bold', color: e.is_libur ? '#dc2626' : '#166534' }}>
                        {e.is_libur ? 'LIBUR' : 'MASUK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: '9.5px', color: '#64748b', fontStyle: 'italic' }}>
              Tidak ada agenda khusus atau hari libur nasional di bulan ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const navBtn = {
  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff',
  width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

export default KalenderViewPage;
