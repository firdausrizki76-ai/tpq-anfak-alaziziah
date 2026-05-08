import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, 
  CalendarCheck, CreditCard, PiggyBank, FileBarChart, Settings, LogOut, Menu, X,
  Award
} from 'lucide-react';
import './AppLayout.css';

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/santri', icon: <Users size={20} />, label: 'Santri' },
    { path: '/guru', icon: <GraduationCap size={20} />, label: 'Guru' },
    { path: '/kelas', icon: <BookOpen size={20} />, label: 'Kelas' },
    { path: '/absensi', icon: <CalendarCheck size={20} />, label: 'Absensi' },
    { path: '/ujian', icon: <Award size={20} />, label: 'Ujian & Kenaikan' },
    { path: '/pembayaran', icon: <CreditCard size={20} />, label: 'Pembayaran' },
    { path: '/tabungan', icon: <PiggyBank size={20} />, label: 'Tabungan' },
    { path: '/laporan', icon: <FileBarChart size={20} />, label: 'Laporan' },
    { path: '/pengaturan', icon: <Settings size={20} />, label: 'Pengaturan' }
  ];

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar - Monolith */}
        <aside className={`sidebar arch-sidebar flex flex-col ${location.pathname.includes('/login') ? 'hidden' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header flex-col items-center text-center">
            <button className="mobile-close-btn" onClick={closeMobileMenu}>
              <X size={24} />
            </button>
            <img src="/assets/logoapp.png" alt="Logo" className="sidebar-logo" />
            <h3 className="font-medium text-lg mt-3">TPQ Anfak Al Azizah</h3>
          </div>
          
          <nav className="sidebar-nav">
            {menuItems.map(item => (
              <button 
                key={item.path}
                className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  closeMobileMenu();
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="sidebar-footer">
            <button className="nav-item logout-btn" onClick={() => navigate('/login')}>
              <span className="nav-icon"><LogOut size={20} /></span>
              <span className="nav-label font-medium">Keluar</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="main-wrapper flex flex-col w-full h-full">
          <header className="topbar">
            <div className="topbar-left flex items-center gap-4">
              <button className="hamburger-btn" onClick={toggleMobileMenu}>
                <Menu size={24} />
              </button>
              <div className="topbar-search">
                <h2 className="topbar-title font-medium">Panel Admin</h2>
              </div>
            </div>
            <div className="topbar-profile flex items-center gap-4">
              <span className="text-sm font-medium">Admin TPQ</span>
              <div className="avatar arch-avatar">AD</div>
            </div>
          </header>
          
          <div className="running-text-container">
            <div className="marquee">
              <span>Selamat Datang di TPQ Anfak Al Azizah - Sistem Administrasi Digital Terpadu untuk Manajemen Santri, Guru, Absensi, dan Pembayaran. Mari wujudkan pengelolaan pendidikan yang lebih profesional dan transparan.</span>
              <span>Selamat Datang di TPQ Anfak Al Azizah - Sistem Administrasi Digital Terpadu untuk Manajemen Santri, Guru, Absensi, dan Pembayaran. Mari wujudkan pengelolaan pendidikan yang lebih profesional dan transparan.</span>
            </div>
          </div>

          <main className="content-area">
            <div className="content-container">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
  );
};

export default AppLayout;
