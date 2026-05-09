import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, FileSignature, LogOut, Bell, Wallet } from 'lucide-react';
import './StudentLayout.css';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/siswa/dashboard', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
    { path: '/siswa/absen', icon: <CalendarCheck size={24} />, label: 'Absen' },
    { path: '/siswa/izin', icon: <FileSignature size={24} />, label: 'Izin' },
    { path: '/siswa/tabungan', icon: <Wallet size={24} />, label: 'Tabungan' }
  ];

  return (
    <div className="student-layout">
      {/* Top Header */}
      <header className="student-header arch-container-bottom">
        <div className="header-content flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/assets/logoapp.png" alt="Logo" className="student-logo" />
            <div>
              <h2 className="student-title">TPQ Anfak Al Azizah</h2>
              <p className="student-subtitle">Portal Siswa</p>
            </div>
          </div>
          <button className="icon-btn">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="student-content">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {menuItems.map(item => (
          <button
            key={item.path}
            className={`bottom-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div className="nav-icon-wrapper">{item.icon}</div>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
        <button
          className="bottom-nav-item logout"
          onClick={() => navigate('/login')}
        >
          <div className="nav-icon-wrapper"><LogOut size={24} /></div>
          <span className="nav-label">Keluar</span>
        </button>
      </nav>
    </div>
  );
};

export default StudentLayout;
