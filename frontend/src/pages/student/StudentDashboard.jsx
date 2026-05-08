import React from 'react';
import { QrCode, BookOpen, Clock, AlertCircle } from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = () => {
  return (
    <div className="flex-col gap-4">
      <div className="card text-center py-6 mb-4 relative overflow-hidden featured">
        <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none"></div>
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 border-4 border-white shadow flex items-center justify-center">
           <span className="text-xl font-bold text-gray-500">AF</span>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-primary-container)]">Ahmad Fauzi</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm">NIS: 12345678 • Kelas: TK 3A</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4 flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-full text-[var(--color-primary-container)] mb-2">
            <QrCode size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600">Scan Absen</h3>
        </div>
        <div className="card p-4 flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
            <BookOpen size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600">Pelajaran</h3>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--color-primary-container)]">Riwayat Absensi</h3>
          <span className="text-xs text-[var(--color-gold)] font-bold">Lihat Semua</span>
        </div>
        <div className="flex-col gap-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-semibold">Hadir</p>
                <p className="text-xs text-gray-500">Hari ini, 09:05</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Tepat Waktu</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-semibold">Hadir</p>
                <p className="text-xs text-gray-500">Kemarin, 08:50</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Tepat Waktu</span>
          </div>
        </div>
      </div>
      
      <div className="card p-4 bg-orange-50 border border-orange-200">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-orange-500 mt-1" />
          <div>
            <h4 className="font-bold text-orange-800 text-sm">Informasi Tunggakan</h4>
            <p className="text-xs text-orange-600 mt-1">Anda memiliki tunggakan Syahriah bulan ini sebesar Rp 75.000.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
