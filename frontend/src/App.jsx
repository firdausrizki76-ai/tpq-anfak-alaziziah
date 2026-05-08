import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import SantriPage from './pages/santri/SantriPage';
import GuruPage from './pages/guru/GuruPage';
import KelasPage from './pages/kelas/KelasPage';
import AbsensiPage from './pages/absensi/AbsensiPage';
import PembayaranPage from './pages/pembayaran/PembayaranPage';
import TabunganPage from './pages/tabungan/TabunganPage';
import LaporanPage from './pages/laporan/LaporanPage';
import PengaturanPage from './pages/pengaturan/PengaturanPage';
import UjianPage from './pages/ujian/UjianPage';
import StudentLayout from './components/layout/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherLayout from './components/layout/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';

import ScannerPage from './pages/absensi/ScannerPage';

import ClassListPage from './pages/teacher/ClassListPage';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('tpq_token');
  const userStr = localStorage.getItem('tpq_user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (allowedRole && user.role !== allowedRole) {
      if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
      if (user.role === 'guru') return <Navigate to="/guru/dashboard" replace />;
      if (user.role === 'siswa') return <Navigate to="/siswa/dashboard" replace />;
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="admin"><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/santri" element={<SantriPage />} />
          <Route path="/guru" element={<GuruPage />} />
          <Route path="/kelas" element={<KelasPage />} />
          <Route path="/absensi" element={<AbsensiPage />} />
          <Route path="/pembayaran" element={<PembayaranPage />} />
          <Route path="/tabungan" element={<TabunganPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
          <Route path="/pengaturan" element={<PengaturanPage />} />
          <Route path="/ujian" element={<UjianPage />} />
        </Route>
        
        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRole="guru"><TeacherLayout /></ProtectedRoute>}>
          <Route path="/guru/dashboard" element={<TeacherDashboard />} />
          <Route path="/guru/kelas" element={<ClassListPage />} />
          <Route path="/guru/absen" element={<ScannerPage />} />
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRole="siswa"><StudentLayout /></ProtectedRoute>}>
          <Route path="/siswa/dashboard" element={<StudentDashboard />} />
          <Route path="/siswa/absen" element={<div className="p-4 text-center mt-10"><h2>Scan Absensi</h2><p>Arahkan kamera ke QR Code</p></div>} />
          <Route path="/siswa/izin" element={<div className="p-4 text-center mt-10"><h2>Pengajuan Izin</h2><p>Form izin tidak hadir</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
