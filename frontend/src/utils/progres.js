// Status progres prestasi: hanya dua pilihan yang dipakai di form.
//   lanjut -> L   (lanjut materi berikutnya)
//   ulang  -> L-  (ulang materi ini)
// Data lama bisa bernilai 'lancar' (opsi lama); dihitung sebagai L.
export const PROGRES_OPTIONS = [
  { value: 'lanjut', label: 'L', long: 'L (Lanjut)', color: '#166534', bg: '#dcfce7' },
  { value: 'ulang', label: 'L-', long: 'L- (Ulang)', color: '#991b1b', bg: '#fee2e2' },
];

export const normalizeProgres = (status) => {
  if (status === 'ulang') return 'ulang';
  if (status === 'lanjut' || status === 'lancar') return 'lanjut';
  return null;
};

export const progresInfo = (status) => PROGRES_OPTIONS.find(o => o.value === normalizeProgres(status)) || null;
