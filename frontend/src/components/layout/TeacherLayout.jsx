import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, CalendarCheck, LogOut, Bell, PiggyBank } from 'lucide-react';
import './TeacherLayout.css';

const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/guru/dashboard', icon: <LayoutDashboard size={24} />, label: 'Beranda' },
    { path: '/guru/kelas', icon: <Users size={24} />, label: 'Kelas' },
    { path: '/guru/absen', icon: <CalendarCheck size={24} />, label: 'Absen' },
    { path: '/guru/tabungan', icon: <PiggyBank size={24} />, label: 'Tabungan' }
  ];

  return (
    <div className="teacher-layout">
      {/* Top Header */}
      <header className="teacher-header arch-container-bottom">
        <div className="header-content flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/assets/logoapp.png" alt="Logo" className="teacher-logo" />
            <div>
              <h2 className="teacher-title">TPQ Anfak Al Azizah</h2>
              <p className="teacher-subtitle">Portal Guru</p>
            </div>
          </div>
          <button className="icon-btn">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="teacher-content">
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

export default TeacherLayout;
